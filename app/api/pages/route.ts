import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const pages = await prisma.page.findMany({
    select: { id: true, slug: true, title: true, metaTitle: true, isTemplate: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const { sourceSlug, newSlug } = await req.json();

  if (!newSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(newSlug)) {
    return NextResponse.json(
      { error: "Invalid slug. Use only lowercase letters, numbers and hyphens." },
      { status: 400 }
    );
  }

  const source = await prisma.page.findUnique({ where: { slug: sourceSlug } });
  if (!source) {
    return NextResponse.json({ error: "Source page not found." }, { status: 404 });
  }

  const exists = await prisma.page.findUnique({ where: { slug: newSlug } });
  if (exists) {
    return NextResponse.json({ error: "Slug is already in use." }, { status: 409 });
  }

  const cloned = await prisma.page.create({
    data: {
      slug: newSlug,
      title: `${source.title} (copy)`,
      data: source.data,
      metaTitle: source.metaTitle,
      metaDescription: source.metaDescription,
      ogImage: source.ogImage,
    },
  });

  return NextResponse.json(cloned, { status: 201 });
}
