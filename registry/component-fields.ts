/**
 * Single source of truth for all Puck components.
 *
 * To add a new component:
 *  1. Add its entry here (description, fields, defaultProps, optional zone).
 *  2. Register it in puck.config.tsx with render: YourComponent.
 *  3. Done — the image-to-layout AI will pick it up automatically.
 */

// No "use client", no React — safe to import from server-side API routes.

export type RadioOption = { label: string; value: string };

export type FieldDef = {
  type: "text" | "textarea" | "radio";
  label?: string;
  options?: RadioOption[];
  /** Hint passed to the AI about what value to use (e.g. 'use ""' or 'use "#"'). */
  aiHint?: string;
};

export type ZoneDef = {
  /** Name used in <DropZone zone="…" /> */
  name: string;
  /** Component types allowed in this zone */
  allow: string[];
  /** Shape of each item — shown to AI so it knows what to generate */
  itemShape: string;
  /** Plain-language description for the AI */
  aiDescription: string;
};

export type ComponentMeta = {
  /** One-line description shown to the AI */
  description: string;
  fields: Record<string, FieldDef>;
  defaultProps: Record<string, string>;
  /** Present only when this component contains a DropZone */
  zone?: ZoneDef;
};

export const componentRegistry: Record<string, ComponentMeta> = {
  Header: {
    description: "Top navigation bar with dual logos, nav buttons, and phone number",
    fields: {
      logo1Url: { type: "text", label: "URL logo principal", aiHint: 'use ""' },
      logo2Url: { type: "text", label: "URL logo secundario (partner)", aiHint: 'use ""' },
      nav1Text: { type: "text", label: "Botón 1 — texto" },
      nav1Url: { type: "text", label: "Botón 1 — enlace", aiHint: 'use "#"' },
      nav2Text: { type: "text", label: "Botón 2 — texto" },
      nav2Url: { type: "text", label: "Botón 2 — enlace", aiHint: 'use "#"' },
      nav3Text: { type: "text", label: "Botón 3 — texto" },
      nav3Url: { type: "text", label: "Botón 3 — enlace", aiHint: 'use "#"' },
      phoneLabel: { type: "text", label: "Etiqueta teléfono" },
      phoneNumber: { type: "text", label: "Número de teléfono" },
    },
    defaultProps: {
      logo1Url: "",
      logo2Url: "",
      nav1Text: "Request a Quote",
      nav1Url: "#",
      nav2Text: "Schedule a Call",
      nav2Url: "#",
      nav3Text: "Insurance Review",
      nav3Url: "#",
      phoneLabel: "Call Us Now!",
      phoneNumber: "(877) 852-6408",
    },
  },

  Hero: {
    description: "Full-width hero section with image, headline, description, and CTA button",
    fields: {
      imageUrl: {
        type: "text",
        label: "URL de imagen (directa, .jpg/.png/.webp)",
        aiHint: 'use ""',
      },
      eyebrow: { type: "text", label: "Texto superior (eyebrow)" },
      title: { type: "text", label: "Título principal" },
      description: { type: "textarea", label: "Descripción" },
      ctaText: { type: "text", label: "Texto del botón CTA" },
      ctaUrl: { type: "text", label: "Enlace del botón CTA", aiHint: 'use "#"' },
      secondaryText: { type: "text", label: "Texto antes del link secundario" },
      secondaryLinkText: { type: "text", label: "Texto del link secundario" },
      secondaryLinkUrl: { type: "text", label: "Enlace secundario", aiHint: 'use "#"' },
      trustText: { type: "text", label: "Texto barra de confianza" },
    },
    defaultProps: {
      imageUrl: "",
      eyebrow: "REAL PEOPLE, RELIABLE ADVICE, NO PRESSURE",
      title: "Insurance for Wisdom Real Estate Clients",
      description:
        "Reliable, personalized coverage — tailored to fit your needs and lifestyle.",
      ctaText: "Start My Quote",
      ctaUrl: "#",
      secondaryText: "Need expert advice?",
      secondaryLinkText: "Send Us a Message",
      secondaryLinkUrl: "#",
      trustText:
        "Trusted by Homeowners Across Colorado • Expert Coverage for Wisdom Real Estate Clients • Multiple Options from Leading Carriers",
    },
  },

  Card: {
    description: "Individual card with image, title, and subtitle (typically used inside CardGrid)",
    fields: {
      title: { type: "text", label: "Título" },
      subtitle: { type: "text", label: "Subtítulo / descripción" },
      imageUrl: {
        type: "text",
        label: "URL de imagen (directa, .jpg/.png/.webp)",
        aiHint: 'use ""',
      },
      width: { type: "text", label: "Ancho", aiHint: 'use "320px"' },
    },
    defaultProps: {
      title: "Título de la card",
      subtitle: "Descripción breve",
      imageUrl: "",
      width: "320px",
    },
  },

  CardGrid: {
    description: "Responsive grid container that holds Card components",
    fields: {
      columns: {
        type: "radio",
        options: [
          { label: "2 columnas", value: "2" },
          { label: "3 columnas", value: "3" },
          { label: "4 columnas", value: "4" },
        ],
      },
    },
    defaultProps: {
      columns: "3",
    },
    zone: {
      name: "cards",
      allow: ["Card"],
      itemShape: '{ "title": string, "subtitle": string }',
      aiDescription:
        'Cards placed inside this grid. Include a "cards" array with objects matching itemShape.',
    },
  },
};

/** Returns just the Puck-compatible field config (strips aiHint). */
export function toPuckFields(
  meta: ComponentMeta
): Record<string, Omit<FieldDef, "aiHint">> {
  return Object.fromEntries(
    Object.entries(meta.fields).map(([key, { aiHint: _stripped, ...rest }]) => [
      key,
      rest,
    ])
  );
}

/** Builds the component schema string injected into the AI prompt. */
export function buildAiSchema(): string {
  return Object.entries(componentRegistry)
    .map(([name, meta], i) => {
      const propsStr = Object.entries(meta.fields)
        .map(([key, f]) => {
          let desc = key;
          if (f.options) desc += ` (${f.options.map((o) => `"${o.value}"`).join(" | ")})`;
          if (f.aiHint) desc += ` — ${f.aiHint}`;
          return desc;
        })
        .join(", ");

      let zoneInfo = "";
      if (meta.zone) {
        zoneInfo =
          `\n   Zone "${meta.zone.name}" (${meta.zone.allow.join(", ")}): ` +
          `${meta.zone.aiDescription} Each item shape: ${meta.zone.itemShape}`;
      }

      return `${i + 1}. "${name}" — ${meta.description}\n   Props: { ${propsStr} }${zoneInfo}`;
    })
    .join("\n\n");
}
