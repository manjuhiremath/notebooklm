export async function geminiQuery(contextChunks, question) {

  // Gemini Chat API request, uses .env key and model
  const apiKey = process.env.GEMINI_API_KEY;
  const chatModel = process.env.GEMINI_CHAT_MODEL;
  const context = contextChunks.join("\n");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [ { role: "user", parts: [ { text: question }, { text: context } ] }]
    })
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No answer";
}
