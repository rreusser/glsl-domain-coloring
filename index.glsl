#pragma glslify: hsv2rgb = require(glsl-hsv2rgb)


#define M_PI 3.1415926535897932384626433832795

vec4 domainColoring (vec2 z, vec2 gridSpacing, float saturation, float gridStrength, float magStrength) {
  float carg = atan(z.y, z.x);
  float cmod = sqrt(z.x * z.x + z.y * z.y);

  float rebrt = (fract(z.x / gridSpacing.x) - 0.5) * 2.0;
  rebrt *= rebrt;

  float imbrt = (fract(z.y / gridSpacing.y) - 0.5) * 2.0;
  imbrt *= imbrt;

  float grid = 1.0 - (1.0 - rebrt) * (1.0 - imbrt);
  grid *= grid;
  grid *= grid;
  grid *= grid;

  float circ = (fract(log2(cmod)) - 0.5) * 2.0;
  circ *= circ;
  circ *= circ;
  circ *= circ;

  circ *= magStrength;

  vec3 rgb = hsv2rgb(vec3(carg * 0.5 / M_PI, saturation, 0.5 + 0.5 * saturation - gridStrength * grid));
  rgb *= (1.0 - circ);
  rgb += circ * vec3(1.0);
  return vec4(rgb, 1.0);
}

#pragma glslify: export(domainColoring)
