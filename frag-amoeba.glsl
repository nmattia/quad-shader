#define TAU 6.28318530718

precision highp float;

varying vec2 vPosition;
uniform float uTime;

/* color used in the shader */
uniform vec4 uColPop;

/* convert from polar to cartesian coordinates */
vec2 polar(in vec2 uv) {
    float theta = atan(uv.y, uv.x);
    float rho = length(uv);
    return vec2(rho, theta);
}

/* convert from cartesian to polar coordinates */
vec2 cart(in vec2 p) {
    return vec2(p.x*cos(p.y), p.x*sin(p.y));
}

void main() {

    /* The absolute position, before any transformation */
    vec2 uv = vec2(vPosition.x, vPosition.y);
    vec2 p = polar(uv);

    /* the whole image slowly */
    p.y += uTime/7.;

    float theta = p.y;
    /* number of slices, i.e. symmetries/columns/etc. Picked to look
     mostly continuous though with dots appearing sometimes. */
    float rep =  360.;

    /* Create the symmetries. By taking the mod of TAU/rep, we effectively
       constrain the animation to a single slice which gets repeated (shifted every
       time) */
    p.y = mod(p.y + TAU/(2.*rep),TAU/rep) - TAU/(2.*rep);

    uv = cart(p);

    /* everything from now on is drawn as dots on the X axis (the symmetry stuff
       is already handled above).

       Here we shift by some (changing) value _to the right_, creating the
       empty hole in the middle when replicated by the symmetries above. */
    uv.x -= .2 + .1 * sin(uTime/13.);
    uv.x -= .015 * (.5 + 4.*sin(uTime/17. + theta));

    /* Starting from the X offset, we write _n_ dots, with the given size
       and gap between dots. */
    float size = 0.01 * (1. + .5 * sin(uTime/33.));
    float gap = 1.5 * size * (1. + pow(sin(uTime + sin(theta)), 3.));

    float factor_neg = 1.;
    for(int i = 0; i < 15; i+=1) {
        factor_neg *= step(size/2., length(uv));
        uv.x -= gap;
    }

    float fadeIn = smoothstep(0., 1., uTime);
    gl_FragColor = fadeIn * (1. - factor_neg) * uColPop;
}
