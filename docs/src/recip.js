'use strict';

var regl = require('regl')({});
var camera2d = require('./lib/camera-2d');
var glslify = require('glslify');
var controlPanel = require('control-panel');

var frag = glslify(__dirname + '/recip.glsl');

var camera = camera2d(regl, {
  xmin: -2,
  xmax: 2,
  ymin: -2,
  ymax: 2,
  aspectRatio: 1,
  constrain: 'y'
});

var complexMap = regl({
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
  uniforms: {
    saturation: regl.prop('saturation'),
    gridSpacing: regl.prop('gridSpacing'),
    gridStrength: regl.prop('gridStrength'),
    magStrength: regl.prop('magStrength'),
    linePower: regl.prop('linePower'),
  },
  attributes: {position: [[-2, -2], [2, -2], [0, 4]]},
  depth: {enable: false},
  count: 3,
});

var state = {
  saturation: 0.9,
  gridStrength: 0.5,
  magStrength: 0.7,
  gridSpacing: 1.0,
  linePower: 8.0
};

controlPanel([
  {label: 'saturation', type: 'range', min: 0, max: 1, initial: state.saturation, step: 0.01},
  {label: 'gridStrength', type: 'range', min: 0, max: 1, initial: state.gridStrength, step: 0.01},
  {label: 'magStrength', type: 'range', min: 0, max: 1, initial: state.magStrength, step: 0.01},
  {label: 'gridSpacing', type: 'range', min: 0.1, max: 10, initial: state.gridSpacing, step: 0.01},
  {label: 'linePower', type: 'range', min: 1, max: 16, initial: state.linePower, step: 0.1}
], {theme: 'dark', position: 'top-left'}).on('input', function (data) {
  Object.assign(state, data);
  isDirty = true;
});

var el = document.querySelector('.control-panel');

var events = ['mousemove', 'click', 'mousedown', 'mouseup'];
for (var i = 0; i < events.length; i++) {
  el.addEventListener(events[i], function(ev) {
    ev.stopPropagation();
  });
}

var isDirty = true;

regl.frame(function() {
  camera(function(data) {
    isDirty = isDirty || data.dirty;

    if (!isDirty) return;

    complexMap(state);
    isDirty = false;
  });
});
