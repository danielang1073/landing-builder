import type { Config } from "@puckeditor/core";
import { Header, HeaderProps } from "@/components/blocks/Header";
import { Hero, HeroProps } from "@/components/blocks/Hero";
import { Card, CardProps } from "@/components/blocks/Card";
import { CardGrid, CardGridProps } from "@/components/blocks/CardGrid";
import { componentRegistry, toPuckFields } from "./component-fields";

type Props = {
  Header: HeaderProps;
  Hero: HeroProps;
  Card: CardProps;
  CardGrid: CardGridProps;
};

export const puckConfig: Config<Props> = {
  root: {
    fields: {
      metaTitle: { type: "text", label: "SEO — Meta Title" },
      metaDescription: { type: "textarea", label: "SEO — Meta Description" },
      ogTitle: { type: "text", label: "SEO — OG Title" },
      ogImage: { type: "text", label: "SEO — OG Image URL" },
    },
    defaultProps: {
      metaTitle: "",
      metaDescription: "",
      ogTitle: "",
      ogImage: "",
    },
  },
  components: {
    Header: {
      fields: toPuckFields(componentRegistry.Header) as Config<Props>["components"]["Header"]["fields"],
      defaultProps: componentRegistry.Header.defaultProps as HeaderProps,
      render: Header,
    },
    Hero: {
      fields: toPuckFields(componentRegistry.Hero) as Config<Props>["components"]["Hero"]["fields"],
      defaultProps: componentRegistry.Hero.defaultProps as HeroProps,
      render: Hero,
    },
    Card: {
      fields: toPuckFields(componentRegistry.Card) as Config<Props>["components"]["Card"]["fields"],
      defaultProps: componentRegistry.Card.defaultProps as CardProps,
      render: Card,
    },
    CardGrid: {
      fields: toPuckFields(componentRegistry.CardGrid) as Config<Props>["components"]["CardGrid"]["fields"],
      defaultProps: componentRegistry.CardGrid.defaultProps as CardGridProps,
      render: CardGrid,
    },
  },
};
