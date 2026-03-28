import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/utils/firebase";

function toBase64Url(input) {
  const b64 = btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeContent(content) {
  return content.trim().replace(/\s+/g, " ").toLowerCase();
}

export function buildAffirmationDocId(content, createdAtMs) {
  const normalized = normalizeContent(content).slice(0, 40);
  return `${createdAtMs}_${toBase64Url(normalized)}`;
}

function tsToIso(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return null;
}

/** Milliseconds for last-write-wins (sync with mobile / other clients). */
export function readAffirmationUpdatedAtMs(raw) {
  if (raw == null) return 0;
  if (typeof raw.updated_at === "number" && Number.isFinite(raw.updated_at)) {
    return raw.updated_at;
  }
  if (typeof raw.updatedAt?.toMillis === "function") return raw.updatedAt.toMillis();
  if (typeof raw.updatedAt?.toDate === "function") return raw.updatedAt.toDate().getTime();
  if (typeof raw.createdAt?.toMillis === "function") return raw.createdAt.toMillis();
  if (typeof raw.createdAt?.toDate === "function") return raw.createdAt.toDate().getTime();
  return 0;
}

/** Tombstone: soft-delete from web (deletedAt) or mobile-style is_deleted. */
export function isAffirmationDeleted(raw) {
  if (raw == null) return true;
  if (raw.is_deleted === true) return true;
  if (raw.deletedAt) return true;
  return false;
}

function getDefaultInterceptSettings() {
  return {
    isEnabled: true,
    interceptedApps: [],
    cooldownPeriod: 5,
    requiredAffirmationsCount: 3,
  };
}

function getDefaultStreak() {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
    totalDaysCompleted: 0,
    streakStartDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    streakLevel: 1,
  };
}

async function listActiveAffirmationDocs(uid) {
  const affirmationsRef = collection(db, `users/${uid}/affirmations`);
  const affirmationsQ = query(affirmationsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(affirmationsQ);
  return snap.docs.filter((item) => !isAffirmationDeleted(item.data()));
}

function countImagesFromRawAffirmation(raw) {
  if (Array.isArray(raw.cloudImagePaths)) return raw.cloudImagePaths.filter(Boolean).length;
  if (raw.cloudImagePath) return 1;
  return 0;
}

async function enforceAffirmationLimits(uid, { maxAffirmations, maxImages, nextImageCount = 0, excludeDocId = null } = {}) {
  if (maxAffirmations == null && maxImages == null) return;
  const activeDocs = await listActiveAffirmationDocs(uid);
  const filteredDocs = excludeDocId ? activeDocs.filter((docSnap) => docSnap.id !== excludeDocId) : activeDocs;

  if (maxAffirmations != null && filteredDocs.length >= maxAffirmations) {
    throw new Error(`Free web limit reached: maximum ${maxAffirmations} affirmation allowed.`);
  }

  if (maxImages != null) {
    const existingImageCount = filteredDocs.reduce((sum, docSnap) => sum + countImagesFromRawAffirmation(docSnap.data()), 0);
    if (existingImageCount + nextImageCount > maxImages) {
      throw new Error(`Free web limit reached: maximum ${maxImages} image allowed.`);
    }
  }
}

async function resolveStorageUrl(cloudImagePath) {
  if (!cloudImagePath) return "";
  try {
    return await getDownloadURL(storageRef(storage, cloudImagePath));
  } catch {
    return "";
  }
}

/**
 * Map one Firestore affirmation doc to the dashboard shape (includes updatedAtMs for LWW).
 */
export async function mapAffirmationDocument(docSnap) {
  const raw = docSnap.data();
  const cloudImagePaths = Array.isArray(raw.cloudImagePaths)
    ? raw.cloudImagePaths.filter(Boolean)
    : raw.cloudImagePath
      ? [raw.cloudImagePath]
      : [];
  const imageUrls = (
    await Promise.all(cloudImagePaths.map((path) => resolveStorageUrl(path)))
  ).filter(Boolean);
  const updatedAtMs = readAffirmationUpdatedAtMs(raw);
  return {
    docId: docSnap.id,
    localId: Number(docSnap.id.split("_")[0]) || Date.now(),
    content: raw.content || "",
    category: raw.category || "",
    isFavorite: Boolean(raw.isFavorite),
    affirmCount: Number(raw.affirmCount || 0),
    cloudImagePath: cloudImagePaths[0] || "",
    cloudImagePaths,
    imageUrl: imageUrls[0] || "",
    imageUrls,
    createdAt: tsToIso(raw.createdAt),
    updatedAt: tsToIso(raw.updatedAt),
    updatedAtMs,
    deletedAt: tsToIso(raw.deletedAt),
    isDeleted: isAffirmationDeleted(raw),
  };
}

/**
 * Last-write-wins merge by docId (for offline / multi-device). Keeps the row with higher updatedAtMs.
 */
export function mergeAffirmationsByLWW(localList, remoteList) {
  const byId = new Map();
  for (const r of remoteList) {
    if (r?.docId) byId.set(r.docId, r);
  }
  for (const l of localList) {
    if (!l?.docId) continue;
    const existing = byId.get(l.docId);
    if (!existing) {
      byId.set(l.docId, l);
      continue;
    }
    const lMs = Number(l.updatedAtMs ?? 0);
    const rMs = Number(existing.updatedAtMs ?? 0);
    byId.set(l.docId, lMs >= rMs ? l : existing);
  }
  return [...byId.values()].filter((a) => !a.isDeleted && !a.deletedAt);
}

/**
 * Realtime listener: same document shape as fetchLoACloudData affirmations (Deckbase-style live sync).
 * @returns {() => void} unsubscribe
 */
export function subscribeLoAAffirmations(uid, onNext, onError) {
  const affirmationsRef = collection(db, `users/${uid}/affirmations`);
  const affirmationsQ = query(affirmationsRef, orderBy("createdAt", "desc"));
  return onSnapshot(
    affirmationsQ,
    async (snapshot) => {
      const affirmations = await Promise.all(
        snapshot.docs.map((d) => mapAffirmationDocument(d)),
      );
      onNext(affirmations.filter((a) => !a.isDeleted && !a.deletedAt));
    },
    (err) => {
      if (onError) onError(err);
    },
  );
}

/** One-shot “full sync” pull — same bundle as initial load (name mirrors mobile performFullSync pull phase). */
export async function performLoAFullSync(uid) {
  return fetchLoACloudData(uid);
}

export async function fetchLoACloudData(uid) {
  const affirmationsRef = collection(db, `users/${uid}/affirmations`);
  const affirmationsQ = query(affirmationsRef, orderBy("createdAt", "desc"));
  const [affirmationsSnap, streakSnap, settingsSnap, appLimitsSnap, schedulesSnap] =
    await Promise.all([
      getDocs(affirmationsQ),
      getDoc(doc(db, `users/${uid}/streak/current`)),
      getDoc(doc(db, `users/${uid}/intercept/settings`)),
      getDoc(doc(db, `users/${uid}/intercept/appLimits`)),
      getDoc(doc(db, `users/${uid}/intercept/schedules`)),
    ]);

  const affirmations = await Promise.all(
    affirmationsSnap.docs.map((item) => mapAffirmationDocument(item)),
  );

  return {
    affirmations: affirmations.filter((a) => !a.isDeleted && !a.deletedAt),
    streak: streakSnap.exists() ? streakSnap.data() : null,
    interceptSettings: settingsSnap.exists()
      ? settingsSnap.data().data || getDefaultInterceptSettings()
      : getDefaultInterceptSettings(),
    appLimits: appLimitsSnap.exists() ? appLimitsSnap.data().data || [] : [],
    schedules: schedulesSnap.exists() ? schedulesSnap.data().data || [] : [],
  };
}

/** Fetch a single affirmation by docId for the given user. Returns null if not found or deleted. */
export async function fetchAffirmationById(uid, docId) {
  if (!uid || !docId) return null;
  const ref = doc(db, `users/${uid}/affirmations/${docId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const mapped = await mapAffirmationDocument(snap);
  if (mapped.isDeleted || mapped.deletedAt) return null;
  return mapped;
}

export async function ensureStreakDoc(uid) {
  const streakRef = doc(db, `users/${uid}/streak/current`);
  const snap = await getDoc(streakRef);
  if (!snap.exists()) {
    await setDoc(streakRef, getDefaultStreak());
  }
}

export async function createAffirmation(uid, payload, limits = {}) {
  const createdAtMs = payload.createdAtMs || Date.now();
  const docId = buildAffirmationDocId(payload.content, createdAtMs);
  const files = Array.isArray(payload.files)
    ? payload.files.filter(Boolean)
    : payload.file
      ? [payload.file]
      : [];
  await enforceAffirmationLimits(uid, {
    maxAffirmations: limits.maxAffirmations,
    maxImages: limits.maxImages,
    nextImageCount: files.length,
  });
  const cloudImagePaths = [];

  for (let i = 0; i < files.length; i += 1) {
    const current = files[i];
    const ext = current.name.split(".").pop() || "jpg";
    const objectPath = `users/${uid}/affirmations/${docId}/image-${i + 1}.${ext}`;
    await uploadBytes(storageRef(storage, objectPath), current, {
      contentType: current.type || "image/jpeg",
    });
    cloudImagePaths.push(objectPath);
  }

  const createdAtTs = Timestamp.fromMillis(createdAtMs);
  const nowMs = Date.now();
  await setDoc(doc(db, `users/${uid}/affirmations/${docId}`), {
    content: payload.content,
    category: payload.category || "",
    isFavorite: Boolean(payload.isFavorite),
    affirmCount: Number(payload.affirmCount || 0),
    cloudImagePath: cloudImagePaths[0] || null,
    cloudImagePaths,
    createdAt: createdAtTs,
    updatedAt: serverTimestamp(),
    updated_at: nowMs,
    is_deleted: false,
    deletedAt: null,
  });

  return docId;
}

export async function updateAffirmation(uid, docId, patch, limits = {}) {
  const allowed = {};
  if (Array.isArray(patch.cloudImagePaths)) {
    await enforceAffirmationLimits(uid, {
      maxImages: limits.maxImages,
      nextImageCount: patch.cloudImagePaths.filter(Boolean).length,
      excludeDocId: docId,
    });
  }
  if (typeof patch.content === "string") allowed.content = patch.content;
  if (typeof patch.category === "string") allowed.category = patch.category;
  if (typeof patch.isFavorite === "boolean") allowed.isFavorite = patch.isFavorite;
  if (typeof patch.affirmCount === "number") allowed.affirmCount = patch.affirmCount;
  if (Array.isArray(patch.cloudImagePaths)) {
    allowed.cloudImagePaths = patch.cloudImagePaths;
    allowed.cloudImagePath = patch.cloudImagePaths[0] || null;
  }
  allowed.updatedAt = serverTimestamp();
  allowed.updated_at = Date.now();

  await updateDoc(doc(db, `users/${uid}/affirmations/${docId}`), allowed);
}

/** Upload additional image files to an existing affirmation. Returns the new storage paths. */
export async function uploadAffirmationImages(uid, docId, files, startIndex = 0, limits = {}) {
  const fileList = Array.isArray(files) ? files.filter(Boolean) : [];
  await enforceAffirmationLimits(uid, {
    maxImages: limits.maxImages,
    nextImageCount: fileList.length + startIndex,
    excludeDocId: docId,
  });
  const newPaths = [];
  for (let i = 0; i < fileList.length; i += 1) {
    const file = fileList[i];
    const ext = (file.name && file.name.split(".").pop()) || "jpg";
    const objectPath = `users/${uid}/affirmations/${docId}/image-${startIndex + i + 1}.${ext}`;
    await uploadBytes(storageRef(storage, objectPath), file, {
      contentType: file.type || "image/jpeg",
    });
    newPaths.push(objectPath);
  }
  return newPaths;
}

/** Delete one image file from Storage (does not update Firestore). */
export async function deleteAffirmationImageFromStorage(uid, storagePath) {
  const ref = storageRef(storage, storagePath);
  await deleteObject(ref);
}

/** Delete one image from an affirmation: removes from Storage and updates Firestore. */
export async function deleteAffirmationImage(uid, docId, storagePath, currentCloudImagePaths) {
  await deleteAffirmationImageFromStorage(uid, storagePath);
  const nextPaths = (currentCloudImagePaths || []).filter((p) => p !== storagePath);
  await updateDoc(doc(db, `users/${uid}/affirmations/${docId}`), {
    cloudImagePaths: nextPaths,
    cloudImagePath: nextPaths[0] || null,
    updatedAt: serverTimestamp(),
    updated_at: Date.now(),
  });
}

export async function softDeleteAffirmation(uid, docId) {
  const nowMs = Date.now();
  await updateDoc(doc(db, `users/${uid}/affirmations/${docId}`), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updated_at: nowMs,
    is_deleted: true,
  });
}

export async function saveInterceptSettings(uid, data) {
  await setDoc(doc(db, `users/${uid}/intercept/settings`), {
    data,
    updatedAt: serverTimestamp(),
  });
}

export async function saveAppLimits(uid, data) {
  await setDoc(doc(db, `users/${uid}/intercept/appLimits`), {
    data,
    updatedAt: serverTimestamp(),
  });
}

export async function saveSchedules(uid, data) {
  await setDoc(doc(db, `users/${uid}/intercept/schedules`), {
    data,
    updatedAt: serverTimestamp(),
  });
}

// ——— Affirmation templates ———
const templatesRef = (uid) => collection(db, `users/${uid}/affirmation_templates`);

export async function getAffirmationTemplates(uid) {
  const q = query(templatesRef(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const raw = d.data();
    return {
      id: d.id,
      name: raw.name || "",
      content: raw.content || "",
      category: raw.category || "",
      createdAt: tsToIso(raw.createdAt),
      updatedAt: tsToIso(raw.updatedAt),
    };
  });
}

export async function createAffirmationTemplate(uid, payload) {
  const ref = await addDoc(templatesRef(uid), {
    name: payload.name || "",
    content: payload.content || "",
    category: payload.category || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAffirmationTemplate(uid, templateId, patch) {
  const allowed = {};
  if (typeof patch.name === "string") allowed.name = patch.name;
  if (typeof patch.content === "string") allowed.content = patch.content;
  if (typeof patch.category === "string") allowed.category = patch.category;
  allowed.updatedAt = serverTimestamp();
  await updateDoc(doc(db, `users/${uid}/affirmation_templates`, templateId), allowed);
}

export async function deleteAffirmationTemplate(uid, templateId) {
  await deleteDoc(doc(db, `users/${uid}/affirmation_templates`, templateId));
}

// ——— Default affirmation templates (root collection: affirmation_templates) ———
const defaultTemplatesRef = () => collection(db, "affirmation_templates");

export async function getDefaultAffirmationTemplates() {
  const ref = defaultTemplatesRef();
  console.log("[getDefaultAffirmationTemplates] Fetching collection: affirmation_templates (root)");
  let snap;
  try {
    snap = await getDocs(ref);
  } catch (err) {
    console.error("[getDefaultAffirmationTemplates] getDocs error:", err?.code, err?.message, err);
    throw err;
  }
  console.log("[getDefaultAffirmationTemplates] Snapshot size:", snap.size, "empty:", snap.empty);
  if (snap.size > 0) {
    console.log("[getDefaultAffirmationTemplates] First doc id:", snap.docs[0].id, "data keys:", Object.keys(snap.docs[0].data()));
  }
  const list = snap.docs
    .map((d) => {
      const raw = d.data();
      return {
        id: d.id,
        name: raw.name || "",
        content: raw.content || "",
        category: raw.category || "",
        order: raw.order ?? 0,
      };
    })
    .sort((a, b) => a.order - b.order);
  console.log("[getDefaultAffirmationTemplates] Returning", list.length, "templates");
  return list;
}
