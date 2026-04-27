"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Page = {
  id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
  isTemplate: boolean;
  updatedAt: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [cloneTarget, setCloneTarget] = useState<string | null>(null);
  const [cloneSlug, setCloneSlug] = useState("");

  async function fetchPages() {
    setLoading(true);
    try {
      const res = await fetch("/api/pages");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPages(await res.json());
    } catch (err) {
      console.error("Error cargando páginas:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPages();
    const handleVisible = () => {
      if (document.visibilityState === "visible") fetchPages();
    };
    document.addEventListener("visibilitychange", handleVisible);
    return () => document.removeEventListener("visibilitychange", handleVisible);
  }, []);

  async function handleDelete(slug: string) {
    if (!confirm(`¿Eliminar "/${slug}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/pages/${slug}`, { method: "DELETE" });
    fetchPages();
  }

  async function handleToggleTemplate(slug: string, current: boolean) {
    await fetch(`/api/pages/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTemplate: !current }),
    });
    fetchPages();
  }

  async function handleClone(e: React.FormEvent) {
    e.preventDefault();
    if (!cloneTarget || !cloneSlug.trim()) return;
    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSlug: cloneTarget, newSlug: cloneSlug.trim() }),
    });
    const json = await res.json();
    if (!res.ok) { alert(json.error || "Error"); return; }
    router.push(`/editor/${cloneSlug.trim()}`);
  }

  function handleNewPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newSlug.trim()) return;
    router.push(`/editor/${newSlug.trim()}`);
  }

  const templates = pages.filter((p) => p.isTemplate);
  const regularPages = pages.filter((p) => !p.isTemplate);

  function renderCloneForm(slug: string) {
    return (
      <form onSubmit={handleClone} className="flex gap-2 items-center">
        <input
          autoFocus
          value={cloneSlug}
          onChange={(e) => setCloneSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          placeholder="nuevo-slug"
          className="border border-zinc-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-w-0"
        />
        <button type="submit" className="text-sm bg-zinc-900 text-white px-3 py-1 rounded hover:bg-zinc-700 shrink-0">
          OK
        </button>
        <button type="button" onClick={() => setCloneTarget(null)} className="text-sm text-zinc-400 hover:text-zinc-600 shrink-0">
          ✕
        </button>
      </form>
    );
  }

  function renderTemplateCard(page: Page) {
    return (
      <div
        key={page.id}
        className="bg-white rounded-xl border-2 border-indigo-200 p-5 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 truncate">
              {page.metaTitle || page.title || page.slug}
            </p>
            <p className="text-sm text-zinc-400 mt-0.5 truncate">/{page.slug}</p>
          </div>
          <span className="shrink-0 text-xs font-medium bg-primary-500 text-white px-2 py-0.5 rounded-md">
            Template
          </span>
        </div>

        {cloneTarget === page.slug ? renderCloneForm(page.slug) : (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setCloneTarget(page.slug); setCloneSlug(""); }}
              className="text-xs cursor-pointer font-medium px-3 py-1.5 bg-primary-500 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Use as base
            </button>
            <a
              href={`/editor/${page.slug}`}
              className="text-xs bg-primary-100 cursor-pointer text-primary-700 font-medium px-3 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
            >
              Edit
            </a>
            <button
              onClick={() => handleToggleTemplate(page.slug, true)}
              className="text-xs font-medium px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50"
            >
              Remove template
            </button>
            <button
              onClick={() => handleDelete(page.slug)}
              className="text-xs font-medium px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderPageCard(page: Page) {
    return (
      <div
        key={page.id}
        className="bg-white rounded-xl border border-zinc-200 p-5 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-zinc-900 truncate">
            {page.metaTitle || page.title || page.slug}
          </p>
          <p className="text-sm text-zinc-400 mt-0.5 truncate">/{page.slug}</p>
          <p className="text-xs text-zinc-300 mt-2">
            Editado:{" "}
            {new Date(page.updatedAt).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {cloneTarget === page.slug ? renderCloneForm(page.slug) : (
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/editor/${page.slug}`}
              className="text-xs font-medium px-3 bg-primary-500 py-1.5 text-white rounded hover:opacity-90 transition-opacity"
            >
              Edit
            </a>
            <a
              href={`/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium bg-primary-100 px-3 py-1.5 border border-zinc-300 text-primary-700 rounded hover:bg-primary-50"
            >
              Preview
            </a>
            <button
              onClick={() => { setCloneTarget(page.slug); setCloneSlug(""); }}
              className="text-xs font-medium px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded hover:bg-zinc-50"
            >
              Duplicate
            </button>
            <button
              onClick={() => handleToggleTemplate(page.slug, false)}
              className="text-xs bg-primary-100 font-medium px-3 py-1.5 border border-indigo-200 text-primary-950 rounded hover:bg-indigo-50"
            >
              Save as template
            </button>
            <button
              onClick={() => handleDelete(page.slug)}
              className="text-xs font-medium px-3 py-1.5 text-red-500 border border-red-200 rounded hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div
        style={{ background: "var(--color-primary-950)" }}
        className="text-white px-8 py-5 flex flex-wrap items-center justify-between gap-4"
      >
        <h1 className="text-xl font-semibold tracking-tight">Landing Builder</h1>
        <form onSubmit={handleNewPage} className="flex gap-2">
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="slug-nueva-pagina"
            className="rounded px-3 py-1.5 text-sm text-zinc-900 bg-white w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            className="bg-white font-medium text-sm px-4 py-1.5 rounded hover:bg-zinc-100 transition-colors"
            style={{ color: "var(--color-primary-950)" }}
          >
            + Nueva página
          </button>
        </form>
      </div>

      <div className="px-8 py-8 max-w-6xl mx-auto space-y-10">
        {loading && <p className="text-zinc-400 text-sm">Cargando...</p>}

        {!loading && templates.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Templates
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map(renderTemplateCard)}
            </div>
          </section>
        )}

        {!loading && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              Páginas
            </h2>
            {regularPages.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <p className="text-lg font-medium">Pages Builder</p>
                <p className="text-sm mt-1">Enter a slug above and create your first landing page.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularPages.map(renderPageCard)}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
