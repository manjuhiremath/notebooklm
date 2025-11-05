'use client';

import { useRef, useState, useEffect } from "react";
import {
  FileUp,
  AlertCircle,
  Loader,
  Search,
  MessageSquare,
  Target,
} from "lucide-react";
import UploadProgress from "./UploadProgress";

export default function PDFUploader({ onUploadSuccess }) {
  const fileRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      setStatus("error");
      setMessage("Please upload a PDF file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setStatus("error");
      setMessage("File size must be less than 50MB");
      return;
    }

    setLoading(true);
    setStatus("uploading");
    setFileName(file.name);
    setShowProgress(true);
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 500);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      setStatus("success");
      setMessage(`✓ Successfully uploaded! ${data.vectorCount} embeddings created.`);

      setTimeout(() => {
        onUploadSuccess(file.name, data.pdfUrl);
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setStatus("error");
      setMessage(`✕ Error: ${error.message}`);
      console.error("Upload error:", error);
      setShowProgress(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <>
      {showProgress && <UploadProgress progress={progress} status={status} fileName={fileName} />}

      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 p-3 rounded-full mb-4">
              <FileUp className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">NotebookLM</h1>
            <p className="text-gray-600 mt-1">AI-Powered Document Q&A</p>
          </div>

          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50 scale-105"
                : "border-gray-300 bg-white hover:border-gray-400"
            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} shadow-lg`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <div>
                {loading ? (
                  <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                ) : (
                  <FileUp className="w-12 h-12 text-blue-600 mx-auto" />
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {loading ? "Uploading & Processing..." : "Upload Your PDF"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {loading
                    ? "Extracting text, creating embeddings..."
                    : "Drag and drop your PDF here or click to browse"}
                </p>
              </div>

              <div className="text-xs text-gray-500 flex items-center gap-2 justify-center">
                <FileUp className="w-3 h-3" />
                <span>PDF • Max 50MB</span>
              </div>
            </div>
          </div>

          {/* File Name Display */}
          {fileName && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <FileUp className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900 font-medium truncate">{fileName}</p>
            </div>
          )}

          {/* Status Messages */}
          {message && !showProgress && (
            <div
              className={`mt-4 p-4 rounded-lg border flex items-start gap-3 ${
                status === "success"
                  ? "bg-green-50 border-green-200"
                  : status === "error"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {status === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                {status === "success" && (
                  <div className="w-5 h-5 text-green-600">✓</div>
                )}
              </div>

              <div>
                <p
                  className={`text-sm font-medium ${
                    status === "success"
                      ? "text-green-900"
                      : status === "error"
                      ? "text-red-900"
                      : "text-blue-900"
                  }`}
                >
                  {status === "success" && "✓ Upload successful"}
                  {status === "error" && "✕ Upload failed"}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    status === "success"
                      ? "text-green-700"
                      : status === "error"
                      ? "text-red-700"
                      : "text-blue-700"
                  }`}
                >
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">How it works</h3>
            </div>
            <ul className="text-xs text-gray-600 space-y-3">
              <li className="flex gap-3 items-start">
                <FileUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Upload your PDF document</span>
              </li>
              <li className="flex gap-3 items-start">
                <Search className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>AI extracts and indexes the content</span>
              </li>
              <li className="flex gap-3 items-start">
                <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Ask questions and get instant answers</span>
              </li>
              <li className="flex gap-3 items-start">
                <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>Click citations to jump to relevant pages</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Powered by Gemini API & Pinecone Vector DB</p>
          </div>
        </div>
      </div>
    </>
  );
}
