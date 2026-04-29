"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createUsePuck, useGetPuck, type Data } from "@puckeditor/core";

const usePuck = createUsePuck();

function extractPageContent(data: Data): string {
  return data.content
    .flatMap((item) => Object.values(item.props))
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ");
}

export default function AIFloatingButton() {
  const dispatch = usePuck((s) => s.dispatch);
  const rootProps = usePuck((s) => s.appState.data.root.props);
  const getPuck = useGetPuck();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const p = rootProps as Record<string, string> | null;
      setMetaTitle(p?.metaTitle ?? "");
      setMetaDescription(p?.metaDescription ?? "");
      setOgTitle(p?.ogTitle ?? "");
      setError(null);
    }
  }, [open, rootProps]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setOpen(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageContent = extractPageContent(getPuck().appState.data);
      const res = await fetch("/api/ai/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMetaTitle(data.metaTitle ?? "");
      setMetaDescription(data.metaDescription ?? "");
      setOgTitle(data.ogTitle ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    dispatch({
      type: "replaceRoot",
      root: {
        props: {
          ...(rootProps ?? {}),
          metaTitle,
          metaDescription,
          ogTitle,
        },
      },
      recordHistory: true,
    } as Parameters<typeof dispatch>[0]);
    showFeedback("✓ SEO applied to page");
  };

  if (!mounted) return null;

  const canApply = metaTitle.trim() || metaDescription.trim() || ogTitle.trim();

  const panel = (
    <>
      {feedback && (
        <div className="fixed bottom-24 right-6 z-[9999] bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {feedback}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] h-11 px-4 rounded-md cursor-pointer bg-primary-500 hover:bg-primary-600 text-white shadow-lg font-semibold text-sm tracking-wide transition"
          title="SEO Pack"
        >
          SEO
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="font-bold text-gray-800">SEO Pack</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-lg leading-none cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-semibold text-gray-700">
                  Meta Title
                </label>
                <span
                  className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}
                >
                  {metaTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Page title for search engines..."
                className="w-full border rounded px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-semibold text-gray-700">
                  Meta Description
                </label>
                <span
                  className={`text-xs ${metaDescription.length > 160 ? "text-red-500" : metaDescription.length >= 120 ? "text-green-600" : "text-gray-400"}`}
                >
                  {metaDescription.length}/160
                </span>
              </div>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description shown in search results..."
                className="w-full border rounded px-2 py-1.5 text-sm mt-1 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-semibold text-gray-700">
                  OG Title
                </label>
                <span
                  className={`text-xs ${ogTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}
                >
                  {ogTitle.length}/60
                </span>
              </div>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => setOgTitle(e.target.value)}
                placeholder="Title for social media shares..."
                className="w-full border rounded px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded font-medium text-sm transition"
              >
                {loading ? "Generating..." : "✨ Generate with AI"}
              </button>
              <button
                onClick={handleApply}
                disabled={!canApply}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded font-medium text-sm transition"
              >
                Apply to Page
              </button>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-gray-400">
            <span className="text-blue-600 font-semibold">Mode: Mock</span>
            {" · "}You can also fill these fields manually
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
