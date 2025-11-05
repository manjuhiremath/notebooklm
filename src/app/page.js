'use client';

import { useEffect, useState } from "react";
import ChatBox from "@/components/ChatBox";
import PDFUploader from "@/components/PDFUploader";
import PDFViewer from "@/components/PDFViewer";

export default function Home() {
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [citationPage, setCitationPage] = useState(null);
  const [setupDone, setSetupDone] = useState(false);

  // Auto-setup Cloudinary preset on app start
  useEffect(() => {
    const setupCloudinary = async () => {
      try {
        console.log("Setting up Cloudinary preset...");
        const response = await fetch("/api/cloudinary-setup", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✓ Cloudinary setup:", data.message);
          setSetupDone(true);
        } else {
          const error = await response.json();
          console.error("Setup error:", error);
          setSetupDone(true); // Continue anyway
        }
      } catch (error) {
        console.error("Setup request failed:", error);
        setSetupDone(true); // Continue anyway
      }
    };

    setupCloudinary();
  }, []);

  const handleUploadSuccess = (fileName, url) => {
    console.log("✓ Upload Success:", { fileName, url });
    setUploadedFileName(fileName);
    setPdfUrl(url);
  };

  const handleReset = () => {
    console.log("Reset: Clearing states");
    setUploadedFileName(null);
    setPdfUrl(null);
    setCitationPage(null);
  };

  if (!uploadedFileName) {
    return <PDFUploader onUploadSuccess={handleUploadSuccess} />;
  }

  return (
    <div className="fixed inset-0 bg-gray-50">
      <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden border-r border-gray-300 bg-gray-900">
        <PDFViewer pdfUrl={pdfUrl} citationPage={citationPage} />
      </div>

      <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
        <ChatBox
          fileName={uploadedFileName}
          onReset={handleReset}
          onCitationClick={(page) => setCitationPage(page)}
        />
      </div>
    </div>
  );
}
