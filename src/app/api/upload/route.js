import { extractText } from "unpdf";
import fetch from "node-fetch";
import { saveToPinecone } from "@/utils/pineconeClient";
import FormData from "form-data";

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req) {
  try {
    console.log("1. Starting upload...");
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file uploaded" }), 
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    console.log("2. Extracting text...");
    const { text, totalPages } = await extractText(
      new Uint8Array(fileBuffer),
      { mergePages: true }
    );
    console.log("3. PDF extracted:", text.length, "chars");

    const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];
    console.log("4. Chunks created:", chunks.length);

    const embedApiKey = process.env.GEMINI_API_KEY;
    const embedModel = "gemini-embedding-001";

    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${embedApiKey}`;
        
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${embedModel}`,
            content: {
              parts: [{ text: chunkText }]
            },
            outputDimensionality: 1024
          })
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

    console.log("5. Total embeddings:", vectors.length);
    
    if (!vectors.length) {
      return new Response(
        JSON.stringify({ error: "No embeddings generated" }), 
        { status: 500 }
      );
    }

    console.log("6. Saving to Pinecone...");
    await saveToPinecone(vectors);

    // ← UPLOAD TO CLOUDINARY WITH FOLDER (FIXED: Use Buffer instead of file.stream())
    console.log("7. Uploading to Cloudinary with folder...");
    
    const cloudinaryForm = new FormData();
    
    // ← KEY FIX: Use Buffer instead of file.stream()
    cloudinaryForm.append('file', fileBuffer, {
      filename: file.name,
      contentType: 'application/pdf',
    });
    
    cloudinaryForm.append('upload_preset', 'notebooklm');
    cloudinaryForm.append('folder', 'notebooklm/pdfs');
    cloudinaryForm.append('resource_type', 'auto');
    cloudinaryForm.append('public_id', `${Date.now()}_${file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase()}`);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: cloudinaryForm,
        // ← KEY FIX: Use getHeaders() to properly set boundary
        headers: cloudinaryForm.getHeaders(),
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.text();
      console.error("Cloudinary upload error:", error);
      throw new Error('Cloudinary upload failed');
    }

    const cloudinaryData = await cloudinaryResponse.json();
    const pdfUrl = cloudinaryData.secure_url;

    console.log("8. PDF uploaded to Cloudinary:", pdfUrl);
    console.log("9. Folder path:", cloudinaryData.folder || 'notebooklm/pdfs');

    return new Response(
      JSON.stringify({ 
        status: "vectorized", 
        vectorCount: vectors.length,
        chunksProcessed: chunks.length,
        totalPages,
        embeddingDimension: 1024,
        pdfUrl: pdfUrl,
        fileName: file.name,
        cloudinaryFolder: cloudinaryData.folder,
        publicId: cloudinaryData.public_id
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Fatal error:", error.message);
    console.error("Stack:", error.stack);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}
