'use client';

import { useState, useEffect } from "react";
import { Upload, CheckCircle } from "lucide-react";

export default function UploadProgress({ progress, status, fileName }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          {status === "uploading" ? (
            <>
              <div className="mb-6">
                <Upload className="w-16 h-16 text-blue-600 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Uploading PDF</h2>
              <p className="text-gray-600 text-center text-sm mb-6">{fileName}</p>
              
              {/* Progress Bar */}
              <div className="w-full mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${progress.toFixed(1)}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm font-semibold text-blue-600 mt-2">
                  {progress.toFixed(0)}%
                </p>
              </div>
              <p className="text-xs text-gray-500">Extracting text, creating embeddings...</p>
            </>
          ) : (
            <>
              <div className="mb-6 bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your document is ready!</h2>
              <p className="text-gray-600 text-center text-sm">
                You can now ask questions about your document. For example:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{`"What is the main topic of this document?"`}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{`"Can you summarize the key points?"`}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{`"What are the conclusions or recommendations?"`}</span>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
