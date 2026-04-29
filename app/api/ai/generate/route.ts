import { NextRequest, NextResponse } from "next/server";

// Respuestas simuladas para modo mock
const mockResponses: Record<string, Record<string, string>> = {
  title: {
    seguros: "Seguros de Casa Completos y Asequibles",
    "seguros de casa": "Protege Tu Hogar con Cobertura Integral",
    "bienes raices": "Seguros de Bienes Raíces Profesionales",
    default: "Soluciones de Seguros Confiables",
  },
  description: {
    seguros: "Ofrecemos cobertura completa para tu hogar con opciones flexibles y precios competitivos. Protege tu inversión con nuestros expertos en seguros.",
    "seguros de casa": "Asegura tu propiedad con cobertura integral contra incendios, robo y daños naturales. Cotización gratis en 5 minutos.",
    "bienes raices": "Soluciones especializadas para agentes y propietarios de bienes raíces. Múltiples opciones de cobertura con precios para cada presupuesto.",
    default: "Obtén protección confiable para lo que más importa. Contáctanos hoy para una cotización personalizada.",
  },
  button: {
    default: "Solicitar Cotización",
    seguros: "Asegurate Ahora",
    "bienes raices": "Contactar Experto",
  },
  seo: {
    seguros: "Seguros de casa baratos y confiables. Cobertura completa para tu hogar. Cotización gratis. Múltiples opciones de proveedores.",
    "bienes raices": "Seguros especializados para agentes y propietarios de bienes raíces. Cobertura integral con precios competitivos.",
    default: "Obtén la mejor cobertura de seguros. Protección confiable para tu familia y hogar.",
  },
};

function getMockResponse(fieldType: FieldType, prompt: string): string {
  const field = mockResponses[fieldType] || mockResponses.description;
  const promptLower = prompt.toLowerCase();
  
  // Buscar coincidencia en el prompt
  for (const [key, value] of Object.entries(field)) {
    if (key !== "default" && promptLower.includes(key)) {
      return value;
    }
  }
  
  return field.default || "Texto generado automáticamente";
}

async function generateWithOpenAI(prompt: string, fieldType: FieldType) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey.includes("YOUR_KEY")) {
    throw new Error("OPENAI_API_KEY no configurado. Ve a .env.local");
  }

  const systemPrompts: Record<string, string> = {
    title: "Genera un título corto, atractivo (máximo 10 palabras). Solo devuelve el título.",
    description: "Genera una descripción persuasiva (máximo 100 palabras). Solo devuelve la descripción.",
    button: "Genera un texto corto para botón (máximo 3 palabras). Solo devuelve el texto.",
    seo: "Genera una meta descripción SEO (120-160 caracteres). Solo devuelve la descripción.",
  };

  const system = systemPrompts[fieldType] || systemPrompts.description;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Error en OpenAI API");
  }

  const data = await response.json();
  return data.choices[0].message.content?.trim() || "";
}

const VALID_FIELD_TYPES = ["title", "description", "button", "seo"] as const;
type FieldType = (typeof VALID_FIELD_TYPES)[number];

export async function POST(request: NextRequest) {
  try {
    const { prompt, fieldType = "description" } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt requerido" }, { status: 400 });
    }

    if (prompt.trim().length > 500) {
      return NextResponse.json({ error: "Prompt demasiado largo (máx 500 caracteres)" }, { status: 400 });
    }

    if (!VALID_FIELD_TYPES.includes(fieldType)) {
      return NextResponse.json({ error: "Tipo de campo inválido" }, { status: 400 });
    }

    const safeFieldType = fieldType as FieldType;
    const aiMode = process.env.AI_MODE || "mock";
    let generatedText: string;

    if (aiMode === "mock") {
      generatedText = getMockResponse(safeFieldType, prompt);
    } else {
      generatedText = await generateWithOpenAI(prompt, safeFieldType);
    }

    return NextResponse.json({
      success: true,
      text: generatedText,
      mode: aiMode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("Error en /api/ai/generate:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
