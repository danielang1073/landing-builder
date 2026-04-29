import { NextRequest, NextResponse } from "next/server";

type SeoResult = {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
};

const mockSeo: Record<string, SeoResult> = {
  insurance: {
    metaTitle: "Affordable Home Insurance | Free Quote in Minutes",
    metaDescription:
      "Protect your home with comprehensive insurance coverage. Compare quotes from top carriers and find the right policy for your budget. Free quote in minutes.",
    ogTitle: "Home Insurance Made Simple — Free Quote Today",
  },
  "real estate": {
    metaTitle: "Real Estate Insurance Solutions | Expert Coverage",
    metaDescription:
      "Specialized insurance for real estate clients. Expert coverage tailored to homeowners and property investors. Multiple carriers, competitive rates.",
    ogTitle: "Insurance for Real Estate Clients — Trusted by Homeowners",
  },
  default: {
    metaTitle: "Insurance Solutions | Reliable Coverage for Your Needs",
    metaDescription:
      "Get reliable insurance coverage tailored to your needs. Compare top carriers and find the right policy today. Fast quotes, expert advice.",
    ogTitle: "Reliable Insurance Coverage — Get Your Free Quote",
  },
};

function getMockSeo(content: string): SeoResult {
  const lower = content.toLowerCase();
  for (const [key, value] of Object.entries(mockSeo)) {
    if (key !== "default" && lower.includes(key)) return value;
  }
  return mockSeo.default;
}

async function generateSeoWithOpenAI(content: string): Promise<SeoResult> {
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
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert. Given the page content, generate:
- metaTitle: 50-60 characters, keyword-rich page title
- metaDescription: 120-160 characters, compelling description with a call to action
- ogTitle: max 60 characters, engaging title for social media shares

Return ONLY valid JSON with these three fields, no explanation.`,
        },
        { role: "user", content: content || "Insurance landing page" },
      ],
      max_tokens: 300,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API error");
  }

  const data = await response.json();
  const text = data.choices[0].message.content?.trim() ?? "{}";
  return JSON.parse(text) as SeoResult;
}

export async function POST(request: NextRequest) {
  try {
    const { pageContent = "" } = await request.json();
    const aiMode = process.env.AI_MODE || "mock";

    const result =
      aiMode === "mock"
        ? getMockSeo(pageContent)
        : await generateSeoWithOpenAI(pageContent);

    return NextResponse.json({ success: true, ...result, mode: aiMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in /api/ai/seo:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
