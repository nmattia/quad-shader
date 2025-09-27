precision lowp float;
varying vec2 vPosition;
uniform vec4 uColor;
uniform float uTime;

vec4 waves() {
    // The pixel valueA (starting out transparent)
    vec4 pixel = vec4(0., 0., 0., 0.);

    // ellipse equation; window is "1." inside the ellipse and "0." outside
    float window = step(1., vPosition.x*vPosition.x/(.9*.9) + vPosition.y*vPosition.y);

    // default "sky" color
    pixel = .08 * uColor;
    for (int i = 8; i >= 1; i-=1) {

        // "distance" to the window
        float d = float(i);

        // Equation for a wave as wave < A sin(wt + phi) + B
        float B = - .5 + 3./14.*sqrt(d - 1.);

        // amplitude of wave, slowly decreasing with distance
        float A = .15 / sqrt(2.*d - 1.);

        // the speed at which the wave ("cloud") moves
        float v = .3 * (1. + 3./sqrt(d - .5))/5.;

        // wave phase angle at any point is displacement (how far the "cloud"
        // has moved) plus some somewhat arbitrary shift
        float phi = v * uTime + (d - 1.) * (d - 1.) /4.;

        // the angular frequency (found empirically)
        float w = d * 2. / 5. + 13./5.;
        bool inWave = vPosition.y < B + A * sin( -1. * w * vPosition.x + phi);

        // fade as we get further away
        vec4 color = uColor * (1. - ((d - 1.)/10.));
        pixel = inWave ? color : pixel;
    }

    pixel *= 1. - window; // transparent outside of window border
    return pixel;
}


void main() {
    float fadeIn = smoothstep(0., 1., uTime);
    gl_FragColor = fadeIn * waves();
}
