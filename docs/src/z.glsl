precision highp float;

#pragma glslify: domainColoring = require(../../index)

varying vec2 z;

void main () {
  gl_FragColor = domainColoring(z, vec2(1.0), 0.9, 0.5, 0.7);
}
