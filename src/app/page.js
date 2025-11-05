'use client';

import { useState, useEffect } from "react";
import ChatBox from "@/components/ChatBox";
import PDFUploader from "@/components/PDFUploader";
import PDFViewer from "@/components/PDFViewer";

export default function Home() {
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [citationPage, setCitationPage] = useState(null);

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

  // Show upload screen before file is uploaded
  if (!uploadedFileName) {
    return <PDFUploader onUploadSuccess={handleUploadSuccess} />;
  }

  // Show split view after upload
  return (
    <div className="fixed inset-0 bg-gray-50">
      {/* Left: PDF Viewer */}
      <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden border-r border-gray-300 bg-gray-900">
        <PDFViewer pdfUrl={pdfUrl} citationPage={citationPage} />
      </div>

      {/* Right: Chat Box */}
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
