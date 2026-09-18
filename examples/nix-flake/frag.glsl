#version 300 es

#define TAU 6.28318530718

precision lowp float;
in vec2 vPosition;
uniform vec4 uColor;
uniform float uTime;
out vec4 outputColor;

const int N = 9;

float sdPolygon( in vec2[N] v, in vec2 p )
{
    float d = dot(p-v[0],p-v[0]);
    float s = 1.0;
    for( int i=0, j=N-1; i<N; j=i, i++ )
    {
        vec2 e = v[j] - v[i];
        vec2 w =    p - v[i];
        vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
        d = min( d, dot(b,b) );
        bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
        if( all(c) || all(not(c)) ) s*=-1.0;
    }
    return s*sqrt(d);
}

// all points are positions relative to the center of the hexagon with max diameter 1.
// Points are enumerated clockwise, starting at the "forward tip".
// NixOS branding guidelines page 09 (as of 2026-09-12)
// https://brand.nixos.org/documents/nixos-branding-guide.pdf

const float DEG30 = TAU/12.;
const float DEG60 = TAU/6.;

// some vertices that can be computed directly
const vec2 FORWARD_FOOT = 1./2. * vec2(cos(-DEG60), sin(-DEG60)); // not an actual named vertex but made to mirror "rear foot"
const vec2 REAR_FOOT = 1./2. * vec2(cos(-2.*DEG60), sin(-2.*DEG60));
const vec2 MIDPOINT_JOINT = vec2(-1./8., 0.);

// then vertices derived from direct ones
const vec2 FORWARD_TIP = FORWARD_FOOT + vec2(1./8., 0.);
const vec2 FORWARD_HEEL = FORWARD_FOOT - vec2(1./8., 0.);

const vec2 REAR_HEEL = vec2(-1., 1) * FORWARD_HEEL;

const vec2 JOINT_CROTCH = vec2(0., - 1./8. / tan(DEG30)); // Page 08
const vec2 UPPER_NOTCH = MIDPOINT_JOINT + 11./32. * vec2(cos(2.*DEG60), sin(2.*DEG60));
const vec2 REAR_NOTCH = MIDPOINT_JOINT + 3./8. * vec2(cos(-2.*DEG60), sin(-2.*DEG60));
const vec2 UPPER_APEX = UPPER_NOTCH + 1./4. * vec2(cos(DEG60), sin(DEG60));

const vec2[N] lambda =  vec2[](
            FORWARD_TIP,
            FORWARD_HEEL,
            JOINT_CROTCH,
            REAR_HEEL,
            REAR_FOOT,
            REAR_NOTCH,
            MIDPOINT_JOINT,
            UPPER_NOTCH,
            UPPER_APEX
        );

vec2 rot(float rad, in vec2 uv) {
  float theta = atan(uv.y, uv.x);
  float rho = length(uv);

  theta += rad;

  return vec2(rho*cos(theta), rho*sin(theta));
}

vec4 shape() {

    float theta = 0.;
    for(int i = 0; i < 6; i ++) {
        vec2 pos = vPosition;
        const float dist = 2.;
        float ix_x = floor((pos.x + dist/2.)/dist);
        float ix_y = floor((pos.y + dist/2.)/dist);

        if (ix_x < -3. || ix_x > 3. || ix_y < -3. || ix_y > 3.) {
            return vec4(0.);

        }
        pos.x = mod(pos.x + dist/2., dist) - dist/2.;
        pos.y = mod(pos.y + dist/2., dist) - dist/2.;
        pos /= dist/2.5;
        float theta = float(i) * TAU/6. + uTime/2. + ix_x / 5.;

        pos = rot(theta, pos);
        pos += - 9./8.*vec2(cos(-2.*DEG60), sin(-2.*DEG60)) + REAR_FOOT;

        float op = sqrt(1./(1. + abs(ix_x)) * 1./(1. + abs(ix_y)));


        if(sdPolygon(lambda, pos) < 0.) {
            vec4 col = uColor;
            if(i == 0 || i == 2 || i == 4) {
                col *= 0.6;
            }

            col *= op;
            return col;
        }
    }


    return vec4(0.);
}



void main() {
    float fadeIn = smoothstep(0., 1., uTime);
    outputColor = fadeIn * shape();
}
