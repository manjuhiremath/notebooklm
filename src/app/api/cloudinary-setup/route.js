import fetch from "node-fetch";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    console.log("Creating Cloudinary upload preset...");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ 
          error: "Missing Cloudinary credentials",
          missing: {
            cloudName: !cloudName,
            apiKey: !apiKey,
            apiSecret: !apiSecret
          }
        }), 
        { status: 400 }
      );
    }

    // Create Base64 auth header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Create unsigned upload preset
    const presetForm = new FormData();
    presetForm.append('name', 'notebooklm');
    presetForm.append('unsigned', 'true');
    presetForm.append('folder', 'notebooklm/pdfs');
    presetForm.append('resource_type', 'auto');

    const uploadPresetUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload_presets`;

    console.log("Sending preset creation request...");

    const presetResponse = await fetch(uploadPresetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(presetForm).toString(),
    });

    console.log("Preset response status:", presetResponse.status);

    if (presetResponse.status === 409) {
      console.log("Preset already exists");
      return new Response(
        JSON.stringify({ 
          status: "success",
          message: "Upload preset 'notebooklm' already exists"
        }),
        { status: 200 }
      );
    }

    if (!presetResponse.ok) {
      const error = await presetResponse.text();
      console.error("Preset creation error:", error);
      throw new Error(`Failed to create preset: ${error}`);
    }

    const presetData = await presetResponse.json();
    console.log("Preset created successfully:", presetData);

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Upload preset created successfully",
        preset: presetData
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Setup error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
