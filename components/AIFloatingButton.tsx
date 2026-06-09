"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createUsePuck, useGetPuck, type Data } from "@puckeditor/core";
import type { AnalyzedComponent, AnalyzedLayout } from "@/app/api/ai/image-to-layout/route";
import { componentRegistry } from "@/registry/component-fields";

const usePuck = createUsePuck();

function extractPageContent(data: Data): string {
  return data.content
    .flatMap((item) => Object.values(item.props))
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ");
}

async function resizeImageToBase64(
  file: File,
  maxWidth = 1280
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function buildPuckData(components: AnalyzedComponent[]) {
  // In Puck 0.21 the id lives inside props, not as a top-level field.
  const content: Array<{ type: string; props: Record<string, string> }> = [];
  const zones: Record<string, Array<{ type: string; props: Record<string, string> }>> = {};

  components.forEach((comp, i) => {
    const id = makeId(comp.type.toLowerCase());
    content.push({ type: comp.type, props: { ...comp.props, id } });

    // Dynamically handle zones for any component that declares one in the registry
    const meta = componentRegistry[comp.type];
    if (meta?.zone) {
      const { name: zoneName, allow } = meta.zone;
      const zoneItems = (comp as Record<string, unknown>)[zoneName];
      if (Array.isArray(zoneItems) && zoneItems.length > 0) {
        const childType = allow[0];
        const childDefaults = componentRegistry[childType]?.defaultProps ?? {};
        zones[`${id}:${zoneName}`] = (zoneItems as Record<string, string>[]).map((item) => ({
          type: childType,
          props: { ...childDefaults, ...item, id: makeId(childType.toLowerCase()) },
        }));
      }
    }
  });

  return {
    content,
    root: { props: { metaTitle: "", metaDescription: "", ogTitle: "", ogImage: "" } },
    zones,
  };
}

type Tab = "seo" | "image";

export default function AIFloatingButton() {
  const dispatch = usePuck((s) => s.dispatch);
  const rootProps = usePuck((s) => s.appState.data.root.props);
  const getPuck = useGetPuck();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("seo");
  const [mounted, setMounted] = useState(false);

  // SEO state
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");

  // Image-to-layout state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [detectedLayout, setDetectedLayout] = useState<AnalyzedLayout | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      const p = rootProps as Record<string, string> | null;
      setMetaTitle(p?.metaTitle ?? "");
      setMetaDescription(p?.metaDescription ?? "");
      setOgTitle(p?.ogTitle ?? "");
      setSeoError(null);
    }
  }, [open, rootProps]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setOpen(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  // SEO handlers
  const handleGenerateSeo = async () => {
    setSeoLoading(true);
    setSeoError(null);
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
      setSeoError(err instanceof Error ? err.message : "Error");
    } finally {
      setSeoLoading(false);
    }
  };

  const handleApplySeo = () => {
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

  // Image handlers
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file (JPG, PNG, WebP)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setDetectedLayout(null);
    setImageError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setImageLoading(true);
    setImageError(null);
    try {
      const { base64, mimeType } = await resizeImageToBase64(imageFile);
      const res = await fetch("/api/ai/image-to-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetectedLayout({ components: data.components });
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setImageLoading(false);
    }
  };

  const handleApplyLayout = () => {
    if (!detectedLayout) return;
    const puckData = buildPuckData(detectedLayout.components);
    dispatch({
      type: "setData",
      data: puckData,
      recordHistory: true,
    } as Parameters<typeof dispatch>[0]);
    showFeedback("✓ Layout applied to editor");
    setImageFile(null);
    setImagePreview(null);
    setDetectedLayout(null);
  };

  if (!mounted) return null;

  const canApplySeo = metaTitle.trim() || metaDescription.trim() || ogTitle.trim();

  const componentLabel = (c: AnalyzedComponent) => {
    const meta = componentRegistry[c.type];
    if (meta?.zone) {
      const items = (c as Record<string, unknown>)[meta.zone.name];
      const count = Array.isArray(items) ? items.length : 0;
      const colInfo = c.props.columns ? ` — ${c.props.columns} cols` : "";
      return `${c.type}${colInfo}${count ? `, ${count} ${meta.zone.name}` : ""}`;
    }
    return c.type;
  };

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
          title="AI Tools"
        >
          AI
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-3 pb-3 border-b">
            <h3 className="font-bold text-gray-800">AI Tools</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-lg leading-none cursor-pointer transition"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-md">
            <button
              onClick={() => setActiveTab("seo")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded transition cursor-pointer ${
                activeTab === "seo"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              SEO Pack
            </button>
            <button
              onClick={() => setActiveTab("image")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded transition cursor-pointer ${
                activeTab === "image"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Desde imagen
            </button>
          </div>

          {/* SEO Tab */}
          {activeTab === "seo" && (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-semibold text-gray-700">Meta Title</label>
                  <span className={`text-xs ${metaTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
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
                  <label className="text-xs font-semibold text-gray-700">Meta Description</label>
                  <span
                    className={`text-xs ${
                      metaDescription.length > 160
                        ? "text-red-500"
                        : metaDescription.length >= 120
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
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
                  <label className="text-xs font-semibold text-gray-700">OG Title</label>
                  <span className={`text-xs ${ogTitle.length > 60 ? "text-red-500" : "text-gray-400"}`}>
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

              {seoError && (
                <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{seoError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGenerateSeo}
                  disabled={seoLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded font-medium text-sm transition cursor-pointer"
                >
                  {seoLoading ? "Generating..." : "✨ Generate with AI"}
                </button>
                <button
                  onClick={handleApplySeo}
                  disabled={!canApplySeo}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 rounded font-medium text-sm transition cursor-pointer disabled:cursor-not-allowed"
                >
                  Apply to Page
                </button>
              </div>

              <div className="pt-2 border-t text-xs text-gray-400">
                <span className="text-blue-600 font-semibold">Mode: Mock</span>
                {" · "}You can also fill these fields manually
              </div>
            </div>
          )}

          {/* Image-to-Layout Tab */}
          {activeTab === "image" && (
            <div className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-lg cursor-pointer transition ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition">
                      <span className="text-white text-xs font-medium">Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-xs text-center">
                      Click or drag a landing page screenshot
                    </span>
                    <span className="text-xs text-gray-300">JPG, PNG, WebP</span>
                  </div>
                )}
              </div>

              {imageError && (
                <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{imageError}</p>
              )}

              {/* Analyze button */}
              {imageFile && !detectedLayout && (
                <button
                  onClick={handleAnalyze}
                  disabled={imageLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded font-medium text-sm transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {imageLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    "✨ Analyze & Generate Layout"
                  )}
                </button>
              )}

              {/* Detected components list */}
              {detectedLayout && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Detected components ({detectedLayout.components.length}):
                  </p>
                  <ul className="space-y-1">
                    {detectedLayout.components.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 px-2 py-1.5 rounded">
                        <span className="text-green-500 font-bold">✓</span>
                        {componentLabel(c)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setDetectedLayout(null); setImageFile(null); setImagePreview(null); }}
                      className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-2 rounded font-medium text-sm transition cursor-pointer"
                    >
                      Try again
                    </button>
                    <button
                      onClick={handleApplyLayout}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded font-medium text-sm transition cursor-pointer"
                    >
                      Apply to editor
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t text-xs text-gray-400">
                <span className="text-blue-600 font-semibold">Mode: Mock</span>
                {" · "}Switch to OpenAI in .env.local
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
