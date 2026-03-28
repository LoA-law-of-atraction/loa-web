"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Purchases } from "@revenuecat/purchases-js";
import { auth } from "@/utils/firebase";
import { REVENUECAT_ENTITLEMENT_ID } from "@/lib/revenuecat-config";

const RevenueCatContext = createContext({
  isConfigured: false,
  customerInfo: null,
  loading: true,
  isEntitledTo: async () => false,
  isVip: false,
  isPro: false,
  getOfferings: async () => ({ current: null, all: {} }),
  purchase: async () => ({}),
  presentPaywall: async () => {},
  refreshCustomerInfo: async () => null,
  error: null,
});

export const useRevenueCat = () => useContext(RevenueCatContext);
export const DEFAULT_ENTITLEMENT_ID = REVENUECAT_ENTITLEMENT_ID;

export function RevenueCatProvider({ children, entitlementId = REVENUECAT_ENTITLEMENT_ID }) {
  const [uid, setUid] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [entitled, setEntitled] = useState(false);
  const instanceRef = useRef(null);

  const apiKey = String(process.env.NEXT_PUBLIC_REVENUECAT_WEB_API_KEY || "").trim();

  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!mounted) return;
      setUid(user?.isAnonymous ? "" : user?.uid || "");
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const refreshCustomerInfo = useCallback(async () => {
    if (!instanceRef.current) return null;
    try {
      const info = await instanceRef.current.getCustomerInfo();
      setCustomerInfo(info);
      setError(null);
      return info;
    } catch (e) {
      const msg = e?.message || "";
      const backendCode = e?.extra?.backendErrorCode;
      const isSubscriberNotFound =
        backendCode === 7259 || /not found|404|subscriber.*not found/i.test(msg);
      if (isSubscriberNotFound) {
        setCustomerInfo(null);
        setError(null);
        return null;
      }
      setError(msg || "Failed to fetch subscription status");
      return null;
    }
  }, []);

  useEffect(() => {
    if (!apiKey) {
      setCustomerInfo(null);
      setSdkReady(false);
      setLoading(false);
      return;
    }
    if (!uid) {
      setCustomerInfo(null);
      instanceRef.current = null;
      setSdkReady(false);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);
    setSdkReady(false);

    (async () => {
      try {
        let purchases = null;
        if (typeof Purchases.isConfigured === "function" && Purchases.isConfigured()) {
          try {
            const existing = Purchases.getSharedInstance();
            const existingAppUserId =
              typeof existing?.getAppUserId === "function" ? await existing.getAppUserId() : null;
            // Reuse existing instance for same user to avoid tearing down active checkout elements.
            if (!existingAppUserId || existingAppUserId === uid) {
              purchases = existing;
            } else {
              if (existing?.close) existing.close();
              purchases = Purchases.configure({
                apiKey,
                appUserId: uid,
              });
            }
          } catch {
            purchases = Purchases.configure({
              apiKey,
              appUserId: uid,
            });
          }
        } else {
          purchases = Purchases.configure({
            apiKey,
            appUserId: uid,
          });
        }
        instanceRef.current = purchases;
        if (mounted) {
          setSdkReady(true);
          const info = await purchases.getCustomerInfo();
          setCustomerInfo(info);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setSdkReady(false);
          const msg = e?.message || "";
          const backendCode = e?.extra?.backendErrorCode;
          const isSubscriberNotFound =
            backendCode === 7259 || /not found|404|subscriber.*not found/i.test(msg);
          if (isSubscriberNotFound) {
            setCustomerInfo(null);
            setError(null);
          } else {
            setError(msg || "RevenueCat configure failed");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [apiKey, uid]);

  useEffect(() => {
    if (!instanceRef.current || !uid) {
      setEntitled(false);
      return;
    }
    let mounted = true;
    Promise.all([
      instanceRef.current.isEntitledTo("pro"),
      instanceRef.current.isEntitledTo("basic"),
    ])
      .then(([pro, basic]) => {
        if (mounted) setEntitled(!!(pro || basic));
      })
      .catch(() => {
        if (mounted) setEntitled(false);
      });
    return () => {
      mounted = false;
    };
  }, [uid, customerInfo, sdkReady]);

  const isEntitledTo = useCallback(
    async (identifier = entitlementId) => {
      if (!instanceRef.current) return false;
      try {
        return await instanceRef.current.isEntitledTo(identifier);
      } catch {
        return false;
      }
    },
    [entitlementId]
  );

  const getOfferings = useCallback(async (params) => {
    if (!instanceRef.current) {
      throw new Error("RevenueCat is not configured. Add NEXT_PUBLIC_REVENUECAT_WEB_API_KEY.");
    }
    return instanceRef.current.getOfferings(params);
  }, []);

  const purchase = useCallback(
    async (params) => {
      if (!instanceRef.current) {
        throw new Error("RevenueCat is not configured. Add NEXT_PUBLIC_REVENUECAT_WEB_API_KEY.");
      }
      const result = await instanceRef.current.purchase(params);
      await refreshCustomerInfo();
      return result;
    },
    [refreshCustomerInfo]
  );

  const presentPaywall = useCallback(
    async (options = {}) => {
      if (!instanceRef.current) {
        throw new Error("RevenueCat is not configured. Add NEXT_PUBLIC_REVENUECAT_WEB_API_KEY.");
      }
      try {
        const result = await instanceRef.current.presentPaywall({
          htmlTarget: options.htmlTarget ?? null,
          offering: options.offering ?? undefined,
        });
        await refreshCustomerInfo();
        return result;
      } catch (e) {
        const msg = e?.message || "";
        if (/doesn't have a paywall attached|no paywall attached/i.test(msg)) {
          const err = new Error("PAYWALL_NOT_CONFIGURED");
          err.originalMessage = msg;
          throw err;
        }
        throw e;
      }
    },
    [refreshCustomerInfo]
  );

  return (
    <RevenueCatContext.Provider
      value={{
        isConfigured: !!apiKey && !!uid && sdkReady,
        customerInfo,
        loading,
        isEntitledTo,
        isVip: false,
        isPro: entitled,
        getOfferings,
        purchase,
        presentPaywall,
        refreshCustomerInfo,
        error,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}
