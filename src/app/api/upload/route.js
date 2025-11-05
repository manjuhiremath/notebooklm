import { extractText } from "unpdf";
import fetch from "node-fetch";
import { saveToPinecone } from "@/utils/pineconeClient";
import fs from "fs";
import path from "path";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    console.log("1. Starting upload...");
    const formData = await req.formData();
    let file = formData.get("file") || formData.get("pdf");
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }), 
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const { text, totalPages } = await extractText(
      new Uint8Array(fileBuffer),
      { mergePages: true }
    );
    console.log("2. PDF extracted:", text.length, "chars");

    const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];
    console.log("3. Chunks created:", chunks.length);

    const embedApiKey = process.env.GEMINI_API_KEY;
    const embedModel = "gemini-embedding-001";

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${embedApiKey}`;
        
        const payload = {
          model: `models/${embedModel}`,
          content: {
            parts: [{ text: chunkText }]
          },
          outputDimensionality: 1024
        };
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) continue;
        
        const embedData = await response.json();
        const embedding = embedData.embedding?.values;
        
        if (embedding && Array.isArray(embedding)) {
          vectors.push({ text: chunkText, embedding });
        }
      } catch (error) {
        console.error(`Chunk ${i} error:`, error.message);
        continue;
      }
    }

    console.log("4. Total embeddings:", vectors.length);
    
    if (!vectors.length) {
      return new Response(
        JSON.stringify({ error: "No embeddings generated" }), 
        { status: 500 }
      );
    }

    console.log("5. Saving to Pinecone...");
    await saveToPinecone(vectors);

    console.log("6. Saving PDF file...");
    const uploadsDir = path.join(process.cwd(), "public/uploads");
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sanitized = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}_${sanitized}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, fileBuffer);
    console.log("7. PDF saved:", fileName);

    const pdfUrl = `/uploads/${fileName}`;

    return new Response(
      JSON.stringify({ 
        status: "vectorized", 
        vectorCount: vectors.length,
        chunksProcessed: chunks.length,
        totalPages,
        embeddingDimension: 1024,
        pdfUrl: pdfUrl,
        fileName: file.name
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        } 
      }
    );
  } catch (error) {
    console.error("Fatal error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}
