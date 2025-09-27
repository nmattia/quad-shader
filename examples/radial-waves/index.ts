import { animate, getComputedStylePropRGBA } from "quad-shader";
import frag from "./frag.glsl?raw" // PROC: REMOVE
const canvas = document.querySelector("#glcanvas-radial-waves") as HTMLCanvasElement; // PROC: REMOVE
const qs = animate(
    canvas, /* the HTMLCanvasElement to draw on */
    frag, /* fragment shader, as a string */
);

/* register a callback that updates "uColor" on render */
/* 'getComputedStylePropRGBA' is a helper that returns the */
/*  given CSS property as a RGBA value */
qs.uniform4f("uColor", () => getComputedStylePropRGBA(canvas, "accent-color")); // PROC: REPLACE "accent-color" "color"
