'use client';

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Copy,
  CheckCircle2,
  MessageCircle,
  FileText,
  BarChart3,
  Lightbulb,
  AlertCircle,
  BookOpen,
} from "lucide-react";

export default function ChatBox({ fileName, onReset, onCitationClick }) {
  const [question, setQuestion] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Format text with markdown-like rendering
  const formatText = (text) => {
    if (!text) return text;

    // Split by lines first
    const lines = text.split('\n');
    const formatted = [];
    let inList = false;
    let listItems = [];

    lines.forEach((line, lineIndex) => {
      const trimmed = line.trim();

      // Handle bullet points (*, -, •)
      if (trimmed.match(/^[\*\-\•]\s+/)) {
        const content = trimmed.replace(/^[\*\-\•]\s+/, '');
        listItems.push(content);
        inList = true;
      } 
      // Handle numbered lists (1., 2., etc)
      else if (trimmed.match(/^\d+\.\s+/)) {
        const content = trimmed.replace(/^\d+\.\s+/, '');
        listItems.push(content);
        inList = true;
      }
      // Regular line
      else {
        // Flush list if we have one
        if (inList && listItems.length > 0) {
          formatted.push(
            <ul key={`list-${lineIndex}`} className="list-disc list-inside space-y-1 my-2 ml-2">
              {listItems.map((item, i) => (
                <li key={i} className="text-xs leading-relaxed">{formatInline(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        // Add regular line
        if (trimmed) {
          formatted.push(
            <p key={`line-${lineIndex}`} className="text-xs leading-relaxed my-1">
              {formatInline(trimmed)}
            </p>
          );
        }
      }
    });

    // Flush remaining list items
    if (listItems.length > 0) {
      formatted.push(
        <ul key="list-final" className="list-disc list-inside space-y-1 my-2 ml-2">
          {listItems.map((item, i) => (
            <li key={i} className="text-xs leading-relaxed">{formatInline(item)}</li>
          ))}
        </ul>
      );
    }

    return <div className="space-y-1">{formatted}</div>;
  };

  // Format inline text (bold, code, etc)
  const formatInline = (text) => {
    if (!text) return text;

    const parts = [];
    let currentText = text;
    let key = 0;

    // Handle **bold** text
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(currentText)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${key++}`}>
            {currentText.substring(lastIndex, match.index)}
          </span>
        );
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < currentText.length) {
      parts.push(
        <span key={`text-${key++}`}>
          {currentText.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : text;
  };

  const submitChat = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setError("");
    setLoading(true);

    try {
      const currentQuestion = question.trim();
      setQuestion("");

      setConversations((prev) => [
        ...prev,
        { type: "user", content: currentQuestion },
      ]);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get answer");
      }

      setConversations((prev) => [
        ...prev,
        {
          type: "assistant",
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence,
          citations: data.citations || [],
        },
      ]);
    } catch (err) {
      setError(err.message);
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">NotebookLM</h1>
              <p className="text-xs text-gray-600">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right max-w-xs">
              <p className="text-xs text-gray-600">Document</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {fileName}
              </p>
            </div>
            <button
              onClick={onReset}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors font-medium whitespace-nowrap"
            >
              Upload New
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-6 space-y-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Start asking questions
              </h2>
              <p className="text-xs text-gray-600 max-w-xs">
                Ask anything about the uploaded document. Click citations to jump to relevant pages.
              </p>
            </div>
          ) : (
            conversations.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg transition-all ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-md"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm"
                  }`}
                >
                  {msg.type === "user" ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    // ← FORMATTED ASSISTANT RESPONSE
                    <div className="prose prose-sm max-w-none">
                      {formatText(msg.content)}
                    </div>
                  )}

                  {msg.type === "assistant" && (
                    <>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-1.5">
                          {msg.citations.map((citation, i) => (
                            <button
                              key={i}
                              onClick={() => onCitationClick(citation.page)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded transition-colors font-medium"
                              title={`Go to page ${citation.page}`}
                            >
                              <BookOpen className="w-3 h-3" />
                              Page {citation.page}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            {msg.sources} sources • {(msg.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(msg.content, idx)}
                          className={`p-1.5 rounded transition-all ${
                            copiedIndex === idx
                              ? "bg-green-100 text-green-600"
                              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          }`}
                          title="Copy to clipboard"
                        >
                          {copiedIndex === idx ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start">
              <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg rounded-bl-none text-red-800 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0">
        <div className="p-4">
          <form onSubmit={submitChat} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about your document..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-medium text-sm shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Ask
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              <span>Tip: Be specific with your questions for better answers</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
