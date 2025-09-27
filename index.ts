// This is the app's entrypoint. It picks the canvas element and attaches sets up
// WebGL via the lib.
import type { QuadShader } from "./src";
import { animate, getComputedStylePropRGBA } from "./src";

// Read the .glsl files
import fragShaderSphereSrc from "./frag-sphere.glsl?raw";
import fragShaderDotsSrc from "./frag-dots.glsl?raw";
import fragShaderAmoebaSrc from "./frag-amoeba.glsl?raw";

function attachWithColors(
  canvas: HTMLCanvasElement,
  fragShaderSrc: string,
): QuadShader {
  const quadShader = animate(canvas, fragShaderSrc);

  quadShader.uniform4f("uColPrimary", () =>
    getComputedStylePropRGBA(quadShader.canvas, "color"),
  );

  quadShader.uniform4f("uColPop", () =>
    getComputedStylePropRGBA(quadShader.canvas, "accent-color"),
  );

  return quadShader;
}

export function main() {
  // The the canvas element we'll be drawing on
  let canvas = document.querySelector("#glcanvas-sphere");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("No canvas found");

  attachWithColors(canvas, fragShaderSphereSrc);

  canvas = document.querySelector("#glcanvas-amoeba");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("No canvas found");

  attachWithColors(canvas, fragShaderAmoebaSrc);

  canvas = document.querySelector("#glcanvas-dots");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("No canvas found");

  const qs = attachWithColors(canvas, fragShaderDotsSrc);

  /* Extra click handling for the dots animation */

  let t = -1000 * 1000;

  /* sharp rise with long tail */
  const fn = (x: number) => {
    const M = 1; // max value
    const b = 0.1; // x value at which M is reached
    return M * (x / b) * Math.exp(1 - x / b);
  };

  qs.uniform1f("uExtra", () => fn(performance.now() / 1000 - t));
  qs.canvas.addEventListener("pointerdown", () => {
    t = performance.now() / 1000;
  });
}

/*
    Example source processing:

      `// PROC: REMOVE` -> line is removed
      `// PROC: REPLACE "foo" "bar"` -> "foo" is replaced with "bar" in line
*/

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
