import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
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

async function resolveStorageUrl(cloudImagePath) {
  if (!cloudImagePath) return "";
  try {
    return await getDownloadURL(storageRef(storage, cloudImagePath));
  } catch {
    return "";
  }
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
    affirmationsSnap.docs.map(async (item) => {
      const raw = item.data();
      const cloudImagePaths = Array.isArray(raw.cloudImagePaths)
        ? raw.cloudImagePaths.filter(Boolean)
        : raw.cloudImagePath
          ? [raw.cloudImagePath]
          : [];
      const imageUrls = (
        await Promise.all(cloudImagePaths.map((path) => resolveStorageUrl(path)))
      ).filter(Boolean);
      return {
        docId: item.id,
        localId: Number(item.id.split("_")[0]) || Date.now(),
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
        deletedAt: tsToIso(raw.deletedAt),
      };
    }),
  );

  return {
    affirmations: affirmations.filter((a) => !a.deletedAt),
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
  const raw = snap.data();
  if (raw.deletedAt) return null;
  const cloudImagePaths = Array.isArray(raw.cloudImagePaths)
    ? raw.cloudImagePaths.filter(Boolean)
    : raw.cloudImagePath
      ? [raw.cloudImagePath]
      : [];
  const imageUrls = (
    await Promise.all(cloudImagePaths.map((path) => resolveStorageUrl(path)))
  ).filter(Boolean);
  return {
    docId: snap.id,
    localId: Number(snap.id.split("_")[0]) || Date.now(),
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
  };
}

export async function ensureStreakDoc(uid) {
  const streakRef = doc(db, `users/${uid}/streak/current`);
  const snap = await getDoc(streakRef);
  if (!snap.exists()) {
    await setDoc(streakRef, getDefaultStreak());
  }
}

export async function createAffirmation(uid, payload) {
  const createdAtMs = payload.createdAtMs || Date.now();
  const docId = buildAffirmationDocId(payload.content, createdAtMs);
  const files = Array.isArray(payload.files)
    ? payload.files.filter(Boolean)
    : payload.file
      ? [payload.file]
      : [];
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
  await setDoc(doc(db, `users/${uid}/affirmations/${docId}`), {
    content: payload.content,
    category: payload.category || "",
    isFavorite: Boolean(payload.isFavorite),
    affirmCount: Number(payload.affirmCount || 0),
    cloudImagePath: cloudImagePaths[0] || null,
    cloudImagePaths,
    createdAt: createdAtTs,
    updatedAt: serverTimestamp(),
    deletedAt: null,
  });

  return docId;
}

export async function updateAffirmation(uid, docId, patch) {
  const allowed = {};
  if (typeof patch.content === "string") allowed.content = patch.content;
  if (typeof patch.category === "string") allowed.category = patch.category;
  if (typeof patch.isFavorite === "boolean") allowed.isFavorite = patch.isFavorite;
  if (typeof patch.affirmCount === "number") allowed.affirmCount = patch.affirmCount;
  if (Array.isArray(patch.cloudImagePaths)) {
    allowed.cloudImagePaths = patch.cloudImagePaths;
    allowed.cloudImagePath = patch.cloudImagePaths[0] || null;
  }
  allowed.updatedAt = serverTimestamp();

  await updateDoc(doc(db, `users/${uid}/affirmations/${docId}`), allowed);
}

/** Upload additional image files to an existing affirmation. Returns the new storage paths. */
export async function uploadAffirmationImages(uid, docId, files, startIndex = 0) {
  const fileList = Array.isArray(files) ? files.filter(Boolean) : [];
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
  });
}

export async function softDeleteAffirmation(uid, docId) {
  await updateDoc(doc(db, `users/${uid}/affirmations/${docId}`), {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
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
