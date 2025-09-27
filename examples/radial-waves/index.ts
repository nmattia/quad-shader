import { animate, getComputedStylePropRGBA } from "quad-shader";
const canvas = document.querySelector("#glcanvas-radial-waves") as HTMLCanvasElement; // PROC: REMOVE
const qs = animate(
    canvas, /* the HTMLCanvasElement to draw on */
    `
    precision lowp float;
    varying vec2 vPosition;
    uniform vec4 uColor;
    uniform float uTime;
    void main() {
        float theta = atan(vPosition.y, vPosition.x);
        float rho = length(vPosition.xy);
        float v = mod(rho - uTime/10., .2);
        float alpha = smoothstep(.1, .2, v);
        alpha *= (1. - smoothstep(0., 1., rho));
        float fadeIn = smoothstep(0., 1., uTime);
        gl_FragColor = fadeIn * alpha * uColor;
    }
    `,
);
qs.uniform4f("uColor", () => getComputedStylePropRGBA(canvas, "accent-color")); // PROC: REPLACE "accent-color" "color"
