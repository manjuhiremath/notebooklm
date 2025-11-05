import path from "path";
import fs from "fs/promises";

// For demo: vector store as a JSON file (simulate FAISS DB)
const FAISS_STORE = path.join(process.cwd(), "faiss-store.json");

// Save vectors
export async function saveVectors(docId, vectors) {
  let store = {};
  try { store = JSON.parse(await fs.readFile(FAISS_STORE, "utf-8")); } catch {}
  store[docId] = vectors;
  await fs.writeFile(FAISS_STORE, JSON.stringify(store));
}

// Search vectors by question (semantic search stub)
export async function faissSearch(docId, question) {
  // Load vectors, implement similarity if needed
  let store = {};
  try { store = JSON.parse(await fs.readFile(FAISS_STORE, "utf-8")); } catch {}
  const docChunks = store[docId] || [];
  // Naive: return all chunks; for real, use a sentence embedding + ANN search
  return docChunks.map((chunk) => chunk.text);
}
