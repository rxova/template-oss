import type { APIRoute, GetStaticPaths } from "astro";
import { renderMarkdown, type DocsPage } from "@rxova/docs-kit";
import { pages } from "../lib/docs";

// A raw-Markdown twin of every page at `<route>.md`, for agents.
export const prerender = true;
export const getStaticPaths: GetStaticPaths = async () =>
  (await pages()).map((page) => ({ params: { slug: page.id }, props: { page } }));
export const GET: APIRoute = ({ props }) =>
  new Response(renderMarkdown((props as { page: DocsPage }).page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
