import { getCollection } from "astro:content";
import { docsPages, type LlmsOptions } from "@rxova/docs-kit";

/** Every page as Markdown: the one list the `.md` twins and both llms files share. */
export const pages = async () =>
  docsPages(await getCollection("docs"), {
    origin: import.meta.env.SITE,
    base: import.meta.env.BASE_URL,
  });

/** The llms.txt header and sections, in the sidebar's reading order. */
export const llms: LlmsOptions = {
  project: "template-oss",
  summary: ["Replace this with what the project does, in one sentence."],
  sections: [
    ["start", "Start here"],
    ["reference", "Reference"],
  ],
};
