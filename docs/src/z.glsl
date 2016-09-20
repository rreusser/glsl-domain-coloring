precision highp float;

#pragma glslify: domainColoring = require(../../index)

varying vec2 z;

uniform float saturation, gridStrength, magStrength, gridSpacing, contourPower;

void main () {
  gl_FragColor = domainColoring(z, vec2(gridSpacing), saturation, gridStrength, magStrength, contourPower);
}
