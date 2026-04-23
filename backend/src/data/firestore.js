const { getFirestore, createId } = require("../firebase");

function normalizeDocument(snapshot) {
  if (!snapshot.exists) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
}

async function listCollection(collectionName) {
  const snapshot = await getFirestore().collection(collectionName).get();
  return snapshot.docs.map(normalizeDocument);
}

async function getDocument(collectionName, id) {
  const snapshot = await getFirestore().collection(collectionName).doc(id).get();
  return normalizeDocument(snapshot);
}

async function createDocument(collectionName, data, id = createId(collectionName)) {
  const ref = getFirestore().collection(collectionName).doc(id);
  await ref.set(data);
  return {
    id,
    ...data
  };
}

async function updateDocument(collectionName, id, data) {
  await getFirestore().collection(collectionName).doc(id).set(data, { merge: true });
  return getDocument(collectionName, id);
}

async function replaceDocument(collectionName, id, data) {
  const { id: _ignoredId, ...documentData } = data;
  await getFirestore().collection(collectionName).doc(id).set(documentData);
  return {
    id,
    ...documentData
  };
}

async function deleteDocument(collectionName, id) {
  await getFirestore().collection(collectionName).doc(id).delete();
}

async function findByField(collectionName, field, value) {
  const snapshot = await getFirestore().collection(collectionName).where(field, "==", value).limit(1).get();
  return snapshot.empty ? null : normalizeDocument(snapshot.docs[0]);
}

async function queryCollection(collectionName, filters = []) {
  if (!filters.length) {
    return listCollection(collectionName);
  }

  if (filters.length > 1) {
    const items = await listCollection(collectionName);
    return items.filter((item) => filters.every((filter) => item[filter.field] === filter.value));
  }

  let query = getFirestore().collection(collectionName);

  filters.forEach(({ field, operator = "==", value }) => {
    query = query.where(field, operator, value);
  });

  const snapshot = await query.get();
  return snapshot.docs.map(normalizeDocument);
}

module.exports = {
  createDocument,
  deleteDocument,
  findByField,
  getDocument,
  listCollection,
  queryCollection,
  replaceDocument,
  updateDocument
};
