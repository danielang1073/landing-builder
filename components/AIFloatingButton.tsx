"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createUsePuck } from "@puckeditor/core";

const usePuck = createUsePuck();

type FieldType = "title" | "description" | "button" | "seo";

// Maps component type + fieldType → which prop to update
const PROP_MAP: Record<string, Partial<Record<FieldType, string>>> = {
  Hero: { title: "title", description: "description", button: "ctaText" },
  Card: { title: "title", description: "subtitle" },
  Header: { button: "nav1Text" },
};

function getTargetProp(componentType: string, fieldType: FieldType): string | null {
  return PROP_MAP[componentType]?.[fieldType] ?? null;
}

export default function AIFloatingButton() {
  const selectedItem = usePuck((s) => s.selectedItem);
  const getSelectorForId = usePuck((s) => s.getSelectorForId);
  const dispatch = usePuck((s) => s.dispatch);
  const rootProps = usePuck((s) => s.appState.data.root.props);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldType, setFieldType] = useState<FieldType>("description");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setResult(null);
    setPrompt("");
    setOpen(false);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, fieldType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    if (!result) return;

    if (fieldType === "seo") {
      dispatch({
        type: "setData",
        data: {
          root: {
            props: {
              ...(rootProps ?? {}),
              metaDescription: result,
            },
          },
        },
        recordHistory: true,
      } as Parameters<typeof dispatch>[0]);
      showFeedback("✓ Meta description actualizada");
      return;
    }

    if (!selectedItem) {
      navigator.clipboard.writeText(result);
      showFeedback("Copiado — selecciona un componente para insertar directamente");
      return;
    }

    const propName = getTargetProp(selectedItem.type, fieldType);
    if (!propName) {
      navigator.clipboard.writeText(result);
      showFeedback(`Copiado — ${selectedItem.type} no tiene campo para "${fieldType}"`);
      return;
    }

    const selector = getSelectorForId(selectedItem.props.id);
    if (!selector) {
      navigator.clipboard.writeText(result);
      showFeedback("Copiado — no se pudo localizar el componente");
      return;
    }

    dispatch({
      type: "replace",
      destinationIndex: selector.index,
      destinationZone: selector.zone,
      data: {
        type: selectedItem.type,
        props: { ...selectedItem.props, [propName]: result },
      },
      recordHistory: true,
    });

    showFeedback(`✓ Insertado en ${selectedItem.type} › ${propName}`);
  };

  if (!mounted) return null;

  const insertLabel =
    fieldType === "seo"
      ? "Insertar en SEO root"
      : selectedItem
      ? `Insertar en ${selectedItem.type}`
      : "Copiar";

  const panel = (
    <>
      {feedback && (
        <div className="fixed bottom-24 right-6 z-[9999] bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg max-w-xs">
          {feedback}
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl transition"
          title="Generador IA"
        >
          ✨
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="font-bold text-gray-800">Generador IA</h3>
            <button
              onClick={() => { setOpen(false); setResult(null); }}
              className="text-gray-500 hover:text-gray-700 text-lg"
            >
              ✕
            </button>
          </div>

          {selectedItem ? (
            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mb-3">
              Componente seleccionado: <strong>{selectedItem.type}</strong>
            </p>
          ) : (
            <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded mb-3">
              Selecciona un componente para insertar directamente
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Tipo de texto</label>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                className="w-full border rounded px-2 py-1 text-sm mt-1"
              >
                <option value="title">Título (corto)</option>
                <option value="description">Descripción (largo)</option>
                <option value="button">Botón CTA</option>
                <option value="seo">SEO Meta Description</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700">Qué quieres generar</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={500}
                placeholder="Ej: Seguros de casa baratos con cobertura completa..."
                className="w-full border rounded px-2 py-2 text-sm h-16 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-xs font-semibold text-green-700 mb-2">Generado:</p>
                <p className="text-sm text-gray-800 mb-3 bg-white p-2 rounded border border-green-100">
                  {result}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleInsert}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded font-medium transition"
                  >
                    {insertLabel}
                  </button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result!); showFeedback("Copiado"); }}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-2 rounded transition"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 rounded font-medium text-sm transition"
            >
              {loading ? "Generando..." : "✨ Generar"}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t text-xs text-gray-500">
            <p className="text-blue-600 font-semibold">Modo: Mock (Gratis)</p>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
