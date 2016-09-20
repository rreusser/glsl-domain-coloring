precision highp float;

#pragma glslify: domainColoring = require(./../../index)

varying vec2 z;
uniform float saturation, gridStrength, magStrength, gridSpacing, linePower;

void main () {
  float denom = 1.0 / (z.x * z.x + z.y * z.y);
  vec2 f = vec2(z.y, -z.x) * denom;

  gl_FragColor = domainColoring(f, vec2(gridSpacing), saturation, gridStrength, magStrength, linePower);
}
