'use strict';

var regl = window._regl = require('regl')({
  extensions: ['OES_texture_float']
});
var camera2d = require('./lib/camera-2d');
var glslify = require('glslify');
var controlPanel = require('control-panel');
var findZeros = require('complex-zeros-delves-lyness');
var ResetTimer = require('./lib/reset-timer');
var Complex = require('complex.js');
var deriv = require('complex-deriv-fornberg');
window.Complex = Complex;

var frag = glslify(__dirname + '/lamb.glsl');

var camera = camera2d(regl, {
  xmin: -10,
  xmax: 10,
  ymin: -10,
  ymax: 10,
  aspectRatio: 1,
  constrain: 'y'
});

var w = 1.0;
var E = Complex(0.5, 0.5);
var rho = 1.0;
var nu = 0.33;
var h = 0.1;
var cl = E.sqrt().mul(Math.sqrt((1 - nu) / rho / (1 + nu) / (1 - 2 * nu)));
var ct = E.sqrt().div(Math.sqrt(2 * rho * (1 + nu)));
var w2cl2, c2ct2;

var w2cl2 = cl.pow(-2).mul(w * w);
var w2ct2 = ct.pow(-2).mul(w * w);

var pq = regl.framebuffer({
  width: regl._gl.drawingBufferWidth,
  height: regl._gl.drawingBufferHeight,
  colorType: 'float',
  depth: false,
  stencil: false,
});

var computePr = regl({
  frag: `
    precision mediump float;
    varying vec2 z;
    uniform float w2cl2r, w2cl2i, w2ct2r, w2ct2i;
    void main () {
      float k2r = z.x * z.x - z.y * z.y;
      float k2i = 2.0 * z.x * z.y;

      float p2r = w2cl2r - k2r;
      float p2i = w2cl2i - k2i;
      float pmag = pow(p2r * p2r + p2i * p2i, 0.25);
      float parg = 0.5 * atan(p2i, p2r);

      float q2r = w2ct2r - k2r;
      float q2i = w2ct2i - k2i;
      float qmag = pow(q2r * q2r + q2i * q2i, 0.25);
      float qarg = 0.5 * atan(q2i, q2r);

      gl_FragColor = vec4(
        pmag * cos(parg),
        pmag * sin(parg),
        qmag * cos(qarg),
        qmag * sin(qarg)
      );
    }
  `,
  vert: `
    precision mediump float;
    attribute vec2 position;
    uniform mat4 viewInverse, projectionInverse;
    varying mediump vec2 z;
    void main () {
      z = (viewInverse * projectionInverse * vec4(position, 0, 1)).xy;
      gl_Position = vec4(position, 0, 1);
    }
  `,
  framebuffer: pq,
  attributes: {position: [[-2, -2], [2, -2], [0, 4]]},
  uniforms: {
    w2cl2r: function () { return w2cl2.re; },
    w2cl2i: function () { return w2cl2.im; },
    w2ct2r: function () { return w2ct2.re; },
    w2ct2i: function () { return w2ct2.im; }
  },
  depth: {enable: false},
  count: 3,
});

var complexMap = regl({
  frag: frag,
  vert: `
    precision mediump float;
    attribute vec2 position;
    uniform mat4 viewInverse, projectionInverse;
    varying mediump vec2 z;
    varying vec2 uv;
    void main () {
      z = (viewInverse * projectionInverse * vec4(position, 0, 1)).xy;
      uv = 0.5 * (position + 1.0);
      gl_Position = vec4(position, 0, 1);
    }
  `,
  attributes: {position: [[-2, -2], [2, -2], [0, 4]]},
  uniforms: {
    pqeval: pq,
    h: function () {return h;},
  },
  depth: {enable: false},
  count: 3,
});

var isDirty = true;

var timer = new ResetTimer(100).start();

function f (out, a, b) {
  var k = Complex(a, b);
  var k2 = k.mul(k);
  var p2 = w2cl2.sub(k2);
  var q2 = w2ct2.sub(k2);
  var q = q2.sqrt();
  var p = p2.sqrt();
  var ans = q.mul(h).tan().mul(k2.mul(q).mul(p).mul(4)).add(
    (k2.sub(q2)).pow(2).mul(p.mul(h).tan())
  );
  out[0] = ans.re;
  out[1] = ans.im;
}

function fp (out, a, b) {
  var df = deriv(f, 1, a, b);
  out[0] = df[0][0];
  out[1] = df[1][0];
  out[2] = df[0][1];
  out[3] = df[1][1];
}

var curZeros = regl.buffer({
  data: Array(400).fill(0),
  usage: 'dynamic'
});

var drawZeros = regl({
  vert: `
    precision mediump float;
    attribute vec2 position;
    uniform mat4 view, projection;
    void main () {
      gl_PointSize = 40.0;
      gl_Position = projection * view * vec4(position, 0, 1);
    }
  `,
  frag: `
    precision mediump float;
    void main () {
      float l = length(gl_PointCoord.xy - 0.5);
      if (l < 0.4 || l > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vec3(1.0), 1.0);
    }
  `,
  depth: {
    enable: false
  },
  attributes: {
    position: curZeros
  },
  primitive: 'points',
  offset: 0,
  count: regl.prop('count'),
});

var numZeros = 0;
var newZeros = false;

function computeZeros () {
  var bounds = camera.getBounds();
  var xcen = (bounds.x[1] + bounds.x[0]) * 0.5;
  var xdif = (bounds.x[1] - bounds.x[0]) * 0.5;
  var ycen = (bounds.y[1] + bounds.y[0]) * 0.5;
  var ydif = (bounds.y[1] - bounds.y[0]) * 0.5;
  var radius = Math.max(xdif, ydif);
  var zeros = findZeros(fp, null, [xcen, ycen], radius, 1e-5, 12);
  var unpacked = [];
  numZeros = zeros[0].length;
  for (var i = 0; i < zeros[0].length; i++) {
    unpacked[i * 2] = zeros[0][i];
    unpacked[i * 2 + 1] = zeros[1][i];
  }
  curZeros(unpacked);
}

timer.on('timeout', function () {
  computeZeros();
  newZeros = true;
});

computeZeros();

regl.frame(function() {
  camera(function(data) {
    isDirty = isDirty || data.dirty || newZeros;

    if (!isDirty) return;

    computePr();
    complexMap();
    drawZeros({count: numZeros});

    if (!newZeros) {
      timer.reset();
    }

    isDirty = false;
    newZeros = false;
  });
});
