import type { Config } from "@puckeditor/core";
import { Header, HeaderProps } from "@/components/blocks/Header";
import { Hero, HeroProps } from "@/components/blocks/Hero";
import { Card, CardProps } from "@/components/blocks/Card";
import { CardGrid, CardGridProps } from "@/components/blocks/CardGrid";

type Props = {
  Header: HeaderProps;
  Hero: HeroProps;
  Card: CardProps;
  CardGrid: CardGridProps;
};

export const puckConfig: Config<Props> = {
  root: {
    fields: {
      metaTitle: { type: "text", label: "SEO — Meta título" },
      metaDescription: { type: "textarea", label: "SEO — Meta descripción" },
      ogImage: { type: "text", label: "SEO — URL imagen Open Graph" },
    },
    defaultProps: {
      metaTitle: "",
      metaDescription: "",
      ogImage: "",
    },
  },
  components: {
    Header: {
      fields: {
        logo1Url: { type: "text", label: "URL logo principal" },
        logo2Url: { type: "text", label: "URL logo secundario (partner)" },
        nav1Text: { type: "text", label: "Botón 1 — texto" },
        nav1Url: { type: "text", label: "Botón 1 — enlace" },
        nav2Text: { type: "text", label: "Botón 2 — texto" },
        nav2Url: { type: "text", label: "Botón 2 — enlace" },
        nav3Text: { type: "text", label: "Botón 3 — texto" },
        nav3Url: { type: "text", label: "Botón 3 — enlace" },
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
      render: Header,
    },
    Hero: {
      fields: {
        imageUrl: { type: "text", label: "URL de imagen (directa, .jpg/.png/.webp)" },
        eyebrow: { type: "text", label: "Texto superior (eyebrow)" },
        title: { type: "text", label: "Título principal" },
        description: { type: "textarea", label: "Descripción" },
        ctaText: { type: "text", label: "Texto del botón CTA" },
        ctaUrl: { type: "text", label: "Enlace del botón CTA" },
        secondaryText: { type: "text", label: "Texto antes del link secundario" },
        secondaryLinkText: { type: "text", label: "Texto del link secundario" },
        secondaryLinkUrl: { type: "text", label: "Enlace secundario" },
        trustText: { type: "text", label: "Texto barra de confianza" },
      },
      defaultProps: {
        imageUrl: "",
        eyebrow: "REAL PEOPLE, RELIABLE ADVICE, NO PRESSURE",
        title: "Insurance for Wisdom Real Estate Clients",
        description: "Reliable, personalized coverage — tailored to fit your needs and lifestyle.",
        ctaText: "Start My Quote",
        ctaUrl: "#",
        secondaryText: "Need expert advice?",
        secondaryLinkText: "Send Us a Message",
        secondaryLinkUrl: "#",
        trustText: "Trusted by Homeowners Across Colorado • Expert Coverage for Wisdom Real Estate Clients • Multiple Options from Leading Carriers",
      },
      render: Hero,
    },
    Card: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        imageUrl: { type: "text", label: "URL de imagen (directa, .jpg/.png/.webp)" },
        width: { type: "text" },
      },
      defaultProps: {
        title: "Título de la card",
        subtitle: "Descripción breve",
        imageUrl: "",
        width: "320px",
      },
      render: Card,
    },
    CardGrid: {
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
      render: CardGrid,
    },
  },
};
