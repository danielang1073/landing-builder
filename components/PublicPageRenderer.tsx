'use client';

import { Render } from "@puckeditor/core";
import { puckConfig } from "@/registry/puck.config";

export function PublicPageRenderer({ data }: { data: any }) {
  return <Render config={puckConfig} data={data} />;
}
