precision mediump float;

#pragma glslify: domainColoring = require(../../index)

varying vec2 z;

float cosh (float x) {return 0.5 * (exp(x) + exp(-x));}
float sinh (float x) {return 0.5 * (exp(x) - exp(-x));}
float sqr (float x) {return x * x;}

uniform float w2cl2r, w2cl2i, w2ct2r, w2ct2i, h;
uniform sampler2D pqeval;
varying vec2 uv;

void main () {
  vec4 pq = texture2D(pqeval, uv);

  float k2r = z.x * z.x - z.y * z.y;
  float k2i = 2.0 * z.x * z.y;

  // (k^2 - q^2)^2:
  float q2r = pq.z * pq.z - pq.w * pq.w;
  float q2i = 2.0 * pq.z * pq.w;
  float numr = sqr(k2r - q2r) - sqr(k2i - q2i);
  float numi = 2.0 * (k2i - q2i) * (k2r - q2r);

  // 4 * k^2 * q * p:
  float denomr = 4.0 * (k2r * (pq.x * pq.z - pq.y * pq.w) - k2i * (pq.y * pq.z + pq.x * pq.w));
  float denomi = 4.0 * (k2i * (pq.x * pq.z - pq.y * pq.w) + k2r * (pq.y * pq.z + pq.x * pq.w));

  // tan qh:
  float tqhdenom = cosh(2.0 * pq.w * h) + cos(2.0 * pq.z * h);
  float tqhr = sin(2.0 * pq.z * h) / tqhdenom;
  float tqhi = sinh(2.0 * pq.w * h) / tqhdenom;

  float tphdenom = cosh(2.0 * pq.y * h) + cos(2.0 * pq.x * h);
  float tphr = sin(2.0 * pq.x * h) / tphdenom;
  float tphi = sinh(2.0 * pq.y * h) / tphdenom;

  gl_FragColor = domainColoring(vec2(
    denomr * tqhr - denomi * tqhi + numr * tphr - numi * tphi,
    denomi * tqhr + denomr * tqhi + numi * tphr + numr * tphi
  ), vec2(1.0), 0.7, 0.1, 0.2, 5.0);
}
