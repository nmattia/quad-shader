#version 300 es

precision lowp float;

in vec2 vPosition; /* pixel position, X & Y in [-1, +1] */
uniform vec4 uColor; /* injected from JS */
uniform float uTime; /* time in seconds since canvas loaded */

out vec4 outputColor;

// Animation code
void main() {
    float theta = atan(vPosition.y, vPosition.x);
    float rho = length(vPosition.xy);
    float v = mod(rho - uTime/10., .2);
    float alpha = smoothstep(.1, .2, v);
    alpha *= 1. - smoothstep(0., 1., rho);
    float fadeIn = smoothstep(0., 1., uTime);
    outputColor = fadeIn * alpha * uColor;
}
