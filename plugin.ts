/* Highlight HTML elements with Shiki (from source files or innerHTML) */

import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import type { Plugin } from "vite";
import { createHighlighter } from "shiki";
import { readFileSync } from "node:fs";
import { unified } from "unified";
import type { Element } from "hast";
import { visit, SKIP } from "unist-util-visit";

const SHIKI_THEME = "rose-pine";

/* some processing applied to the source content */
const RE_REMOVE = new RegExp("\\s*//\\s*PROC:\\s*REMOVE\\s*$");
const RE_REPLACE = new RegExp(
  "\\s*//\\s*PROC:\\s*REPLACE\\s+(\"|')(?<from>.*?)\\1\\s+(\"|')(?<to>.*?)\\3\\s*$",
);
export const processLines = (multiline: string): string => {
  return multiline
    .split("\n")
    .map((line: string) => {
      if (RE_REMOVE.test(line)) return null; // filter out "REMOVE" lines

      const m = line.match(RE_REPLACE); // perform substitution for "REPLACE" lines
      if (m) {
        const { from, to } = m.groups!;
        // keep only the code part, strip the directive (comment)
        const body = line.slice(0, m.index);
        return body.replace(from, to);
      }

      return line;
    })
    .filter(Boolean) // drop removed lines
    .join("\n");
};

// Infer source content and language from a Hast element
const getElemHighlights = (
  node: Element,
): undefined | { source: string; lang: string } => {
  if (!node.properties) {
    return;
  }

  const filepath = node.properties.dataShikiSource;
  delete node.properties.dataShikiSource;
  const lang_ = node.properties.dataShikiLang;
  delete node.properties.dataShikiLang;

  if (filepath && typeof filepath === "string") {
    /* this points to a file. Read the file and try to infer the language */
    const pathFrags = filepath.split(".");
    const lang =
      typeof lang_ === "string" ? lang_ : pathFrags[pathFrags.length - 1];
    const source = readFileSync(filepath, { encoding: "utf-8" });
    return { lang, source };
  }

  const children = node.children;

  if (
    lang_ &&
    typeof lang_ === "string" &&
    children &&
    Array.isArray(children) &&
    children.length === 1
  ) {
    /* language is specified so we use the element's innerHTML as source */
    const child = children[0];

    if (child.type !== "text") {
      return;
    }

    return { lang: lang_, source: child.value };
  }
};

export default function shikiHighlight(): Plugin {
  return {
    name: "transform-html",

    async transformIndexHtml(html) {
      /* created here so that the visitor below doesn't have to be async */
      const highlighter = await createHighlighter({
        themes: [SHIKI_THEME],
        langs: ["glsl", "ts", "bash", "css"],
      });

      const tree = unified().use(rehypeParse).parse(html);

      visit(tree, "element", (node, index, parent) => {
        if (!parent || index === undefined) {
          return;
        }

        const highlights = getElemHighlights(node);

        if (!highlights) {
          return;
        }

        const { source, lang } = highlights;
        const html = highlighter.codeToHast(processLines(source), {
          lang,
          theme: SHIKI_THEME,
        });
        parent.children.splice(index, 1, ...html.children);

        return SKIP; /* don't process element's children */
      });

      highlighter.dispose();
      return unified().use(rehypeStringify).stringify(tree);
    },
  };
}
