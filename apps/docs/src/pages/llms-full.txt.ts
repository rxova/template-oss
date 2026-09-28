import type { APIRoute } from "astro";
import { llmsFull } from "@rxova/docs-kit";
import { llms, pages } from "../lib/docs";

export const prerender = true;
export const GET: APIRoute = async () =>
  new Response(llmsFull(await pages(), llms), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
