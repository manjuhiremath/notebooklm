import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

export async function saveToPinecone(vectors, namespace = "notebooklm-upload") {
  try {
    console.log("Pinecone: Getting index...");
    const indexName = process.env.PINECONE_INDEX || "notebooklm-pdf";
    const index = pinecone.Index(indexName);
    
    console.log("Pinecone: Preparing records...");
    const records = vectors.map((v, i) => ({
      id: `chunk-${i}-${Date.now()}`,
      values: v.embedding,
      metadata: { text: v.text.substring(0, 40000) } // Pinecone metadata limit
    }));
    
    console.log(`Pinecone: Upserting ${records.length} vectors to namespace "${namespace}"...`);
    const result = await index.namespace(namespace).upsert(records);
    console.log("Pinecone: Upsert complete");
    
    return result;
  } catch (error) {
    console.error("Pinecone error:", error.message);
    throw new Error(`Pinecone upsert failed: ${error.message}`);
  }
}
