'use strict';

var regl = require('regl')({});
var camera2d = require('./lib/camera-2d');
var glslify = require('glslify');

var frag = glslify(__dirname + '/recip.glsl');

var camera = camera2d(regl, {
  xmin: -2,
  xmax: 2,
  ymin: -2,
  ymax: 2,
  aspectRatio: 1,
  constrain: 'y'
});

const complexMap = regl({
  frag: frag,
  vert: `
    precision highp float;
    attribute vec2 position;
    uniform mat4 view, projection;
    uniform mat4 viewInverse, projectionInverse;
    varying highp vec2 z;
    void main () {
      z = (viewInverse * projectionInverse * vec4(position, 0, 1)).xy;
      gl_Position = vec4(position, 0, 1);
    }
  `,
  attributes: {position: [[-2, -2], [2, -2], [0, 4]]},
  depth: {enable: false},
  count: 3,
});

regl.frame(() => {
  camera(({dirty}) => {
    if (dirty) complexMap();
  });
});
