import fetch from "node-fetch";
import { Pinecone } from "@pinecone-database/pinecone";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    console.log("=== CHAT REQUEST ===");
    console.log("Content-Type:", req.headers.get("content-type"));
    
    // ← FIX: Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Request body parse error:", parseError.message);
      const rawBody = await req.text();
      console.error("Raw body was:", rawBody);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400 }
      );
    }

    const { question } = body;
    
    if (!question || question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400 }
      );
    }

    console.log("1. Question:", question);

    const embedApiKey = process.env.GEMINI_API_KEY;
    const embedModel = "gemini-embedding-001";
    
    const embedResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${embedModel}:embedContent?key=${embedApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${embedModel}`,
          content: { parts: [{ text: question }] },
          outputDimensionality: 1024
        }),
      }
    );

    if (!embedResponse.ok) {
      const errorText = await embedResponse.text();
      console.error("Embedding error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate question embedding" }),
        { status: 500 }
      );
    }

    const embedData = await embedResponse.json();
    const questionEmbedding = embedData.embedding?.values;

    if (!questionEmbedding) {
      return new Response(
        JSON.stringify({ error: "No embedding generated" }),
        { status: 500 }
      );
    }

    console.log("2. Question embedding dimension:", questionEmbedding.length);

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX || "notebooklm-pdf");
    
    const searchResults = await index
      .namespace("notebooklm-upload")
      .query({
        vector: questionEmbedding,
        topK: 3,
        includeMetadata: true
      });

    console.log("3. Search results:", searchResults.matches.length);

    const contextChunks = searchResults.matches
      .map(match => match.metadata?.text || "")
      .filter(text => text.length > 0)
      .join("\n\n");

    console.log("4. Context length:", contextChunks.length);

    if (!contextChunks || contextChunks.length === 0) {
      return new Response(
        JSON.stringify({
          answer: "No relevant information found in the document."
        }),
        { status: 200 }
      );
    }

    const chatModel = process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

    const chatResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent?key=${embedApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are a helpful assistant. Answer questions based on the provided document context."
            }]
          },
          contents: [{
            role: "user",
            parts: [{
              text: `Document context:\n${contextChunks}\n\nQuestion: ${question}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    console.log("5. Gemini response status:", chatResponse.status);

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Gemini error:", errorText);
      return new Response(
        JSON.stringify({ error: `Gemini error: ${errorText}` }),
        { status: 500 }
      );
    }

    const chatData = await chatResponse.json();
    const answer = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "No answer generated";

    console.log("6. Answer generated");

    return new Response(
      JSON.stringify({
        answer,
        sources: searchResults.matches.length,
        confidence: (searchResults.matches[0]?.score || 0).toFixed(4)
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Chat error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
