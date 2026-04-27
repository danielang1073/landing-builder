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

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then((r) => r.json())
      .then((p) => setData(p?.data ?? { content: [], root: {} }));
  }, [slug]);

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar la página "/${slug}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;
    await fetch(`/api/pages/${slug}`, { method: "DELETE" });
    alert("Página eliminada.");
    router.push("/");
  }

  if (!data) return <div className="p-8">Cargando...</div>;

  return (
    <Puck
      config={puckConfig}
      data={data}
      onPublish={async (newData) => {
        await fetch(`/api/pages/${slug}`, {
          method: "PUT",
          body: JSON.stringify({ title: slug, data: newData }),
        });
        alert("¡Publicado!");
      }}
      overrides={{
        headerActions: ({ children }) => (
          <>
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
              Eliminar página
            </button>
            {children}
          </>
        ),
      }}
    />
  );
}