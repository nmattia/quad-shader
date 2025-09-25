#define TAU 6.28318530718

precision mediump float;

varying vec2 vPosition;
uniform float uTime;
uniform float uExtra;
uniform vec4 uColPop;

float get_opacity(vec2 uv) {
        const float r = .01;
        const float uSymmetries = 200.;
        const int nSideDots = 8;

        float a = TAU/uSymmetries;
        float a2 = a/2.;

        float theta = atan(uv.y, uv.x);
        float rho = length(uv);

        theta += a2;
        float slice_ix = floor(theta/a);
        theta = mod(theta + TAU, TAU);
        theta = mod(theta, a);
        theta -= a2; /* compensate for shift above */

        uv = vec2(rho*cos(theta), rho*sin(theta));
        uv.x -= .8;

        float dist = .007;
        dist += .002 * sin(3./17. * uTime * TAU + slice_ix/uSymmetries * TAU);
        dist += .005 * sin(1./11. * uTime * TAU + slice_ix/uSymmetries * TAU);
        dist = mix(dist, 1./32., uExtra);

        float product = 1.;
        for (int i = -nSideDots; i <= nSideDots; i ++) {
            vec2 delta = vec2(float(i)*dist, 0.);
            float v = length(uv + delta);
            float ri = .98 * r;
            float opacity = 1.;
            opacity *= 1. - smoothstep(ri, r, v); /* blur edges */
            opacity *= 1. - smoothstep(.2, 1., abs(float(i))/float(nSideDots)); /* outer dots less opaque */
            product *= 1. - opacity;
        }

        return 1. - product;
}

void main() {
        vec3 rgb = uColPop.rgb;
        vec2 uv = vPosition.xy;
        float fadeIn = smoothstep(0., 1., uTime);
        gl_FragColor = fadeIn * get_opacity(uv) * vec4(rgb, 1.);
}
