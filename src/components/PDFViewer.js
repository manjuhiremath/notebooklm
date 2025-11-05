'use client';

import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, Download, AlertCircle } from "lucide-react";

export default function PDFViewer({ pdfUrl, citationPage }) {
  const [scale, setScale] = useState(100);
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pdfUrl) return;

    // Fetch PDF and convert to blob URL
    const fetchPdf = async () => {
      try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(true);
      }
    };

    fetchPdf();

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [pdfUrl]);

  const handleZoom = (direction) => {
    if (direction === "in" && scale < 200) {
      setScale(scale + 20);
    } else if (direction === "out" && scale > 50) {
      setScale(scale - 20);
    }
  };

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-400">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center ">
        {error ? (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-6 py-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to display PDF</p>
              <p className="text-sm mt-1">
                <a href={pdfUrl} download className="underline hover:text-red-200">
                  Click here to download
                </a>
              </p>
            </div>
          </div>
        ) : blobUrl ? (
          <embed
            src={blobUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{
              transform: `scale(${scale / 100})`,
              transformOrigin: 'top center',
            }}
          />
        ) : (
          <div className="text-gray-400">Loading PDF...</div>
        )}
      </div>
    </div>
  );
}
