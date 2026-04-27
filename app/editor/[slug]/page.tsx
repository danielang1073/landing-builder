"use client";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "@/registry/puck.config";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditorPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then((r) => r.json())
      .then((p) => {
        setData(p?.data ?? { content: [], root: {} });
        setIsTemplate(p?.isTemplate ?? false);
      });
  }, [slug]);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the page "/${slug}"? This action cannot be undone.`,
    );
    if (!confirmed) return;
    await fetch(`/api/pages/${slug}`, { method: "DELETE" });
    router.push("/");
  }

  async function handleToggleTemplate() {
    const next = !isTemplate;
    const res = await fetch(`/api/pages/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTemplate: next }),
    });
    if (res.ok) setIsTemplate(next);
  }

  async function handleDuplicate() {
    const newSlug = window.prompt(
      "Slug for the duplicated page:",
      `${slug}-copy`,
    );
    if (!newSlug) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSlug: slug, newSlug: newSlug.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Error duplicating page");
      return;
    }
    router.push(`/editor/${newSlug.trim()}`);
  }

  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <Puck
      config={puckConfig}
      data={data}
      onPublish={async (newData) => {
        await fetch(`/api/pages/${slug}`, {
          method: "PUT",
          body: JSON.stringify({ title: slug, data: newData }),
        });
        alert("Published!");
      }}
      overrides={{
        headerActions: ({ children }) => (
          <>
            <button
              type="button"
              onClick={() => router.push("/")}
              style={{
                background: "transparent",
                border: "1px solid #a1a1aa",
                color: "#a1a1aa",
                borderRadius: "4px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              ← Dashboard
            </button>
            <button
              type="button"
              onClick={handleToggleTemplate}
              style={{
                background: isTemplate ? "#6F8CC0" : "transparent",
                border: "1px solid #6F8CC0",
                color: isTemplate ? "#fff" : "#6F8CC0",
                borderRadius: "4px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              {isTemplate ? "✓ Template" : "Save as template"}
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              style={{
                background: "transparent",
                border: "1px solid #6F8CC0",
                color: "#6F8CC0",
                borderRadius: "4px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: "transparent",
                border: "1px solid #f87171",
                color: "#f87171",
                borderRadius: "4px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
                marginRight: "8px",
              }}
            >
              Delete
            </button>
            {children}
          </>
        ),
      }}
    />
  );
}
