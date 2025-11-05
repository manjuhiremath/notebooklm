import { extractText } from "unpdf";
import fetch from "node-fetch";
import { saveToPinecone } from "@/utils/pineconeClient";
import FormData from "form-data";
import crypto from "crypto";

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req) {
  try {
    console.log("1. Starting upload...");
    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log("2. Extracting text...");
    const { text, totalPages } = await extractText(
      new Uint8Array(fileBuffer),
      { mergePages: true }
    );
    console.log("3. PDF extracted:", text.length, "chars");

    const chunks = text.match(/(.|[\r\n]){1,1000}/g) || [];
    console.log("4. Chunks created:", chunks.length);

    const embedApiKey = process.env.GEMINI_API_KEY;
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${embedApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: `models/gemini-embedding-001`,
              content: { parts: [{ text: chunks[i] }] },
              outputDimensionality: 1024
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.embedding?.values) {
            vectors.push({ text: chunks[i], embedding: data.embedding.values });
          }
        }
      } catch (error) {
        console.error(`Chunk ${i} error:`, error.message);
      }
    }

    if (!vectors.length) {
      return new Response(
        JSON.stringify({ error: "No embeddings generated" }), 
        { status: 500 }
      );
    }

    console.log("5. Total embeddings:", vectors.length);
    console.log("6. Saving to Pinecone...");
    await saveToPinecone(vectors);

    console.log("7. Uploading to Cloudinary...");
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Missing Cloudinary credentials");
    }

    // ← GENERATE SIGNATURE FOR SIGNED UPLOAD
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
    const publicId = `notebooklm/pdfs/${Date.now()}_${sanitizedName}`;

    // Create signature
    const stringToSign = `folder=notebooklm/pdfs&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    console.log("8. Creating upload form...");

    const cloudinaryForm = new FormData();
    
    cloudinaryForm.append('file', fileBuffer, {
      filename: file.name,
      contentType: 'application/pdf',
    });
    
    // ← ADD SIGNATURE AND API KEY
    cloudinaryForm.append('api_key', apiKey);
    cloudinaryForm.append('timestamp', timestamp);
    cloudinaryForm.append('signature', signature);
    cloudinaryForm.append('folder', 'notebooklm/pdfs');
    cloudinaryForm.append('public_id', publicId);
    cloudinaryForm.append('resource_type', 'auto');

    console.log("9. Sending to Cloudinary...");
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryForm,
      headers: cloudinaryForm.getHeaders(),
    });

    console.log("10. Response status:", cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error("11. Cloudinary error:", errorText);
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const cloudinaryData = await cloudinaryResponse.json();
    console.log("12. ✓ Upload success:", cloudinaryData.secure_url);

    return new Response(
      JSON.stringify({
        status: "vectorized",
        vectorCount: vectors.length,
        chunksProcessed: chunks.length,
        totalPages,
        embeddingDimension: 1024,
        pdfUrl: cloudinaryData.secure_url,
        fileName: file.name
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Fatal error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500 }
    );
  }
}
