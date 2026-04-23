const fs = require("fs");
const path = require("path");
const https = require("https");
const crypto = require("crypto");
const admin = require("firebase-admin");
const config = require("./config");

let bootstrapPromise = null;

function assertFirebaseConfig() {
  const missing = [];

  if (!config.firebaseProjectId) {
    missing.push("FIREBASE_PROJECT_ID");
  }
  if (!config.firebaseClientEmail) {
    missing.push("FIREBASE_CLIENT_EMAIL");
  }
  if (!config.firebasePrivateKey) {
    missing.push("FIREBASE_PRIVATE_KEY");
  }

  if (missing.length) {
    throw new Error(`Firebase configuration missing: ${missing.join(", ")}`);
  }
}

function getFirebaseApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  assertFirebaseConfig();

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebaseProjectId,
      clientEmail: config.firebaseClientEmail,
      privateKey: config.firebasePrivateKey
    }),
    databaseURL: config.firebaseDatabaseUrl || undefined,
    storageBucket: config.firebaseStorageBucket || undefined
  });
}

function getAuth() {
  return getFirebaseApp().auth();
}

function getFirestore() {
  return getFirebaseApp().firestore();
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

function readSeedData() {
  return JSON.parse(fs.readFileSync(path.resolve(config.seedFile), "utf8"));
}

async function ensureBootstrapAdmin(seedData) {
  if (!config.bootstrapAdminEmail || !config.bootstrapAdminPassword) {
    return;
  }

  const auth = getAuth();
  const db = getFirestore();
  let authUser = null;

  try {
    authUser = await auth.getUserByEmail(config.bootstrapAdminEmail);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  if (!authUser) {
    authUser = await auth.createUser({
      email: config.bootstrapAdminEmail,
      password: config.bootstrapAdminPassword,
      displayName: `${config.bootstrapAdminFirstName} ${config.bootstrapAdminLastName}`.trim()
    });
  }

  const userRef = db.collection("users").doc(authUser.uid);
  const existingUser = await userRef.get();
  if (existingUser.exists) {
    return;
  }

  const seedAdmin = (seedData.users || []).find((entry) => entry.role === "admin") || {};
  await userRef.set({
    email: config.bootstrapAdminEmail,
    role: "admin",
    firstName: config.bootstrapAdminFirstName || seedAdmin.firstName || "Alex",
    lastName: config.bootstrapAdminLastName || seedAdmin.lastName || "Admin",
    createdAt: new Date().toISOString()
  });
}

async function seedCollectionIfEmpty(collectionName, items) {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).limit(1).get();
  if (!snapshot.empty || !items.length) {
    return;
  }

  const batch = db.batch();
  items.forEach((item) => {
    const docId = item.id || createId(collectionName);
    const { id: _ignoredId, ...documentData } = item;
    batch.set(db.collection(collectionName).doc(docId), documentData);
  });
  await batch.commit();
}

async function ensureFirebaseReady() {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    getFirebaseApp();

    if (!config.firebaseSeedOnStart) {
      return;
    }

    const seedData = readSeedData();
    await ensureBootstrapAdmin(seedData);
    await seedCollectionIfEmpty("invitations", seedData.invitations || []);
    await seedCollectionIfEmpty("classes", seedData.classes || []);
    await seedCollectionIfEmpty("students", seedData.students || []);
    await seedCollectionIfEmpty("attendance", seedData.attendance || []);
    await seedCollectionIfEmpty("classbookEntries", seedData.classbookEntries || []);
    await seedCollectionIfEmpty("lessons", seedData.lessons || []);
  })();

  return bootstrapPromise;
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }, (response) => {
      let body = "";

      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        const parsed = body ? JSON.parse(body) : {};
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }

        reject(Object.assign(new Error(parsed.error?.message || "Firebase request failed"), {
          statusCode: response.statusCode,
          response: parsed
        }));
      });
    });

    request.on("error", reject);
    request.write(JSON.stringify(payload));
    request.end();
  });
}

async function signInWithEmailPassword(email, password) {
  if (!config.firebaseWebApiKey) {
    throw new Error("Firebase configuration missing: FIREBASE_WEB_API_KEY");
  }

  return postJson(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.firebaseWebApiKey)}`,
    {
      email,
      password,
      returnSecureToken: true
    }
  );
}

module.exports = {
  createId,
  ensureFirebaseReady,
  getAuth,
  getFirestore,
  signInWithEmailPassword
};
