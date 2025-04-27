// This is the app's entrypoint. It picks the canvas element and attaches sets up
// WebGL via the lib.
import { animate, getComputedStylePropRGBA } from "./src";

// Read the .glsl files
import fragShaderSphereSrc from "./frag-sphere.glsl?raw";
import fragShaderDotsSrc from "./frag-dots.glsl?raw";

function attachWithColors(canvas: HTMLCanvasElement, fragShaderSrc: string) {
  const quadShader = animate(canvas, fragShaderSrc);

  quadShader.uniform4f("uColPrimary", () =>
    getComputedStylePropRGBA(quadShader.canvas, "color"),
  );

  quadShader.uniform4f("uColPop", () =>
    getComputedStylePropRGBA(quadShader.canvas, "accent-color"),
  );
}

export function main() {
  // The the canvas element we'll be drawing on
  let canvas = document.querySelector("#glcanvas-sphere");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("No canvas found");

  attachWithColors(canvas, fragShaderSphereSrc);

  canvas = document.querySelector("#glcanvas-dots");
  if (!(canvas instanceof HTMLCanvasElement))
    throw new Error("No canvas found");

  attachWithColors(canvas, fragShaderDotsSrc);
}
