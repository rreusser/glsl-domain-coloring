precision highp float;

#pragma glslify: domainColoring = require(../../index)

varying vec2 z;
uniform float saturation, gridStrength, magStrength, gridSpacing, contourPower;

float cosh (float x) {return 0.5 * (exp(x) + exp(-x));}
float sinh (float x) {return 0.5 * (exp(x) - exp(-x));}

void main () {
  float a = z.x;
  float b = z.y;

  float a2 = a * a;
  float a3 = a2 * a;
  float a4 = a2 * a2;

  float b2 = b * b;
  float b3 = b2 * b;
  float b4 = b2 * b2;

  vec2 f = vec2(
    (cos(a)*cosh(b)*cosh(4.0*a*b3-4.0*a3*b)*sin(b4-6.0*a2*b2+a4-1.0)+sin(a)*sinh(b)*sinh(4.0*a*b3-4.0*a3*b)*cos(b4-6.0*a2*b2+a4-1.0))/(pow(cosh(4.0*a*b3-4.0*a3*b), 2.0)*pow(sin(b4-6.0*a2*b2+a4-1.0), 2.0)+pow(sinh(4.0*a*b3-4.0*a3*b), 2.0)*pow(cos(b4-6.0*a2*b2+a4-1.0), 2.0)),
    (cos(a)*cosh(b)*sinh(4.0*a*b3-4.0*a3*b)*cos(b4-6.0*a2*b2+a4-1.0)-sin(a)*sinh(b)*cosh(4.0*a*b3-4.0*a3*b)*sin(b4-6.0*a2*b2+a4-1.0))/(pow(cosh(4.0*a*b3-4.0*a3*b), 2.0)*pow(sin(b4-6.0*a2*b2+a4-1.0), 2.0)+pow(sinh(4.0*a*b3-4.0*a3*b), 2.0)*pow(cos(b4-6.0*a2*b2+a4-1.0), 2.0))
  );

  gl_FragColor = domainColoring(f, vec2(gridSpacing), saturation, gridStrength, magStrength, contourPower);
}
