import type { APIRoute } from "astro";
import { llmsIndex } from "@rxova/docs-kit";
import { llms, pages } from "../lib/docs";

export const prerender = true;
export const GET: APIRoute = async () =>
  new Response(
    llmsIndex(await pages(), {
      ...llms,
      mount: `${import.meta.env.SITE}${import.meta.env.BASE_URL}`,
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
