"use client";
import { DropZone } from "@puckeditor/core";

export type CardGridProps = {
  columns?: "2" | "3" | "4";
};

export function CardGrid({ columns = "3" }: CardGridProps) {
  return (
    <section className="card-grid">
      <DropZone
        zone="cards"
        allow={["Card"]}
        className={`card-grid__zone card-grid__zone--${columns}`}
      />
    </section>
  );
}
