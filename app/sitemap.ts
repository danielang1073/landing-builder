import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await prisma.page.findMany({
    select: { slug: true, updatedAt: true },
  });

  return pages.map((page) => ({
    url: `${siteUrl}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}
