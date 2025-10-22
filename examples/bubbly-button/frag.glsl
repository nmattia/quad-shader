
#define TAU 6.28318530718

precision mediump float;

varying vec2 vPosition;

uniform vec4 uColor;
uniform float uTime;

const float n_slices = 25.; // how many radial slices to draw
const float R = .07; // Reference radius

float rnd(float x) {
  return mod(sin(x * 12.9898) * 43758.5453, 1.);
}

float get_opacity(vec2 uv) {
  float product = 1.;
  float transparency = 1.;
  for(int i = 0; i < int(n_slices); i ++) {
    float x = rnd(float(i)); // Randomness used for dot size, motion & opacity

    float r = R * (.1 + x/2.);
    float speed = .15 + .5 * rnd(x);
    float phase = x + float(i) / n_slices;
    float opacity = x;

    float rho = mod(uTime*speed + phase, 1.); // Repeat the animation

    float theta = float(i + i) * TAU /n_slices ;
    theta += uTime * 2. / TAU; // Add some rotation
    vec2 center = rho * vec2(cos(theta), sin(theta)); // dot center

    float d = 2.*r;
    float appear = d + .3*rnd(x); // distance where dot fades in
    float disappear = 1. - d - rnd(x)/5.; // distance where dot fades out
    opacity *= smoothstep(appear, appear+.2, rho) * (1. - smoothstep(disappear -.1, disappear, rho));
    product *= 1. - opacity * (1. - step(r, length(uv - center)));
  }

  return 1. - product;
}

void main() {
    gl_FragColor = get_opacity(vPosition) * uColor;
}
