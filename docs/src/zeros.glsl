precision mediump float;

#pragma glslify: domainColoring = require(../../index)

varying vec2 z;

float cosh (float x) {return 0.5 * (exp(x) + exp(-x));}
float sinh (float x) {return 0.5 * (exp(x) - exp(-x));}
float sqr (float x) { return x * x; }
float cube (float x) {return x * x * x; }

void main () {
  float a = z.x;
  float b = z.y;
  float a2 = a * a;
  float a3 = a2 * a;
  float b2 = b * b;
  float b3 = b2 * b;

  float k1 = 3.0 * a * b2 - a3;
  float k2 = b3 - 3.0 * a2 * b;
  vec2 f = vec2(
    cos(k1) * cosh(k2),
    -sin(k1) * sinh(k2)
  );

  gl_FragColor = domainColoring(f, vec2(0.1), 0.8, 0.1, 0.2, 2.0);
}
