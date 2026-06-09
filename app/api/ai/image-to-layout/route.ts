import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAiSchema, componentRegistry } from "@/registry/component-fields";

/**
 * Component returned by the AI.
 * Zone items (e.g. cards inside CardGrid) are stored as top-level keys
 * matching the zone name defined in componentRegistry.
 */
export type AnalyzedComponent = {
  type: string;
  props: Record<string, string>;
  [zoneName: string]: unknown;
};

export type AnalyzedLayout = {
  components: AnalyzedComponent[];
};

function buildMockLayout(): AnalyzedLayout {
  const first = Object.entries(componentRegistry)[0];
  const header = componentRegistry.Header;
  const hero = componentRegistry.Hero;
  const cardGrid = componentRegistry.CardGrid;

  if (!first) return { components: [] };

  const components: AnalyzedComponent[] = [];

  if (header) {
    components.push({ type: "Header", props: { ...header.defaultProps } });
  }
  if (hero) {
    components.push({
      type: "Hero",
      props: {
        ...hero.defaultProps,
        title: "Protect What Matters Most",
        description:
          "Get the coverage you need at the best rates. Compare quotes from top carriers today.",
        ctaText: "Get My Free Quote",
      },
    });
  }
  if (cardGrid) {
    const zoneKey = cardGrid.zone?.name ?? "cards";
    components.push({
      type: "CardGrid",
      props: { ...cardGrid.defaultProps },
      [zoneKey]: [
        { title: "Home Insurance", subtitle: "Comprehensive coverage for your home and belongings" },
        { title: "Auto Insurance", subtitle: "Reliable protection for every driver and vehicle" },
        { title: "Life Insurance", subtitle: "Secure your family's future with the right plan" },
      ],
    });
  }

  return { components };
}

function buildSystemPrompt(): string {
  const schema = buildAiSchema();

  // Build zone instructions from registry
  const zoneInstructions = Object.entries(componentRegistry)
    .filter(([, meta]) => meta.zone)
    .map(([name, meta]) => {
      const z = meta.zone!;
      return `- For "${name}", include a top-level "${z.name}" array with objects shaped as ${z.itemShape}`;
    })
    .join("\n");

  return `You are a landing page layout analyzer. Study the screenshot and return a JSON object that maps its sections to the available components.

Available components:
${schema}

Return ONLY valid JSON in this exact format — no explanation, no markdown fences:
{
  "components": [
    { "type": "Header", "props": { ... } },
    { "type": "Hero", "props": { ... } },
    { "type": "CardGrid", "props": { "columns": "3" }, "cards": [{ "title": "...", "subtitle": "..." }] }
  ]
}

Zone instructions:
${zoneInstructions}

Rules:
- Order components top-to-bottom as they appear in the image
- Follow the aiHint for each field (e.g. use "" for image URLs, "#" for links)
- Infer text content from visible text in the screenshot; use a reasonable placeholder when unclear
- Only include component types listed above
- For any grid or repeated card section, prefer CardGrid over individual Cards`;
}

async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string
): Promise<AnalyzedLayout> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.includes("YOUR_KEY")) {
    throw new Error("OPENAI_API_KEY not configured. Check .env.local");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Analyze this landing page screenshot and return the JSON layout.",
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  let text: string = data.choices[0].message.content?.trim() ?? "{}";

  // Strip markdown code fences if the model included them
  text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  return JSON.parse(text) as AnalyzedLayout;
}

async function analyzeWithClaude(
  imageBase64: string,
  mimeType: string
): Promise<AnalyzedLayout> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured. Check .env.local");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2000,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze this landing page screenshot and return the JSON layout.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  let text = textBlock.text.trim();
  text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

  return JSON.parse(text) as AnalyzedLayout;
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required" },
        { status: 400 }
      );
    }

    const aiMode = process.env.AI_MODE || "mock";

    const result: AnalyzedLayout =
      aiMode === "mock"
        ? buildMockLayout()
        : aiMode === "claude"
        ? await analyzeWithClaude(imageBase64, mimeType)
        : await analyzeWithOpenAI(imageBase64, mimeType);

    return NextResponse.json({ success: true, ...result, mode: aiMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /api/ai/image-to-layout:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
