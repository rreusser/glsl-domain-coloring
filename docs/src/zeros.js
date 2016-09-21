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

var frag = glslify(__dirname + '/zeros.glsl');

var camera = camera2d(regl, {
  xmin: -2,
  xmax: 2,
  ymin: -2,
  ymax: 2,
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
  depth: {enable: false},
  count: 3,
});

var isDirty = true;

var timer = new ResetTimer(100).start();

function f (out, a, b) {
  var k1 = 3 * a * b * b - a * a * a;
  var k2 = b * b * b - 3 * a * a * b;
  out[0] = Math.cos(k1) * Math.cosh(k2);
  out[1] = -Math.sin(k1) * Math.sinh(k2);
}

function fp (out, a, b) {
  var df = deriv(f, 1, a, b);
  f(out, a, b);
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
  var zeros = findZeros(fp, null, [xcen, ycen], radius, 1e-5, 14);
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

    complexMap();
    drawZeros({count: numZeros});

    if (!newZeros) {
      timer.reset();
    }

    isDirty = false;
    newZeros = false;
  });
});
