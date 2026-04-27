import type { Metadata } from "next";
import { PublicPageRenderer } from "@/components/PublicPageRenderer";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return {};

  const title = page.metaTitle || page.title;
  const description = page.metaDescription ?? undefined;
  const images = page.ogImage ? [{ url: page.ogImage }] : [];
  const url = `${siteUrl}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: page.ogImage ? [page.ogImage] : [],
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  const data = JSON.parse(page.data);
  return <PublicPageRenderer data={data} />;
}
