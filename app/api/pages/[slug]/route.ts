import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return NextResponse.json(null);
  return NextResponse.json({ ...page, data: JSON.parse(page.data) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const rootProps = body.data?.root?.props ?? {};
  const seoFields = {
    metaTitle: rootProps.metaTitle || null,
    metaDescription: rootProps.metaDescription || null,
    ogImage: rootProps.ogImage || null,
  };
  const page = await prisma.page.upsert({
    where: { slug },
    update: { title: body.title, data: JSON.stringify(body.data), ...seoFields },
    create: { slug, title: body.title, data: JSON.stringify(body.data), ...seoFields },
  });
  return NextResponse.json(page);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await prisma.page.delete({ where: { slug } });
  return NextResponse.json({ deleted: true });
}