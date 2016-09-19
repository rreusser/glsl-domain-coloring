precision highp float;

#pragma glslify: domainColoring = require(./../../index)

varying vec2 z;

void main () {
  float denom = 1.0 / (z.x * z.x + z.y * z.y);
  vec2 f = vec2(z.y, -z.x) * denom;

  gl_FragColor = domainColoring(f, vec2(1.0), 0.9, 0.5, 0.7);
}
