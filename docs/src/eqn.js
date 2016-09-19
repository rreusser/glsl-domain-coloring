'use strict';

var regl = require('regl')({});
var camera2d = require('./lib/camera-2d');
var glslify = require('glslify');
var controlPanel = require('control-panel');

var frag = glslify(__dirname + '/eqn.glsl');

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
  uniforms: {
    saturation: regl.prop('saturation'),
    gridSpacing: regl.prop('gridSpacing'),
    gridStrength: regl.prop('gridStrength'),
    magStrength: regl.prop('magStrength'),
  },
  attributes: {position: [[-2, -2], [2, -2], [0, 4]]},
  depth: {enable: false},
  count: 3,
});

var state = {
  saturation: 0.9,
  gridStrength: 0.5,
  magStrength: 0.7,
  gridSpacing: 1.0
};

controlPanel([
  {label: 'saturation', type: 'range', min: 0, max: 1, initial: state.saturation},
  {label: 'gridStrength', type: 'range', min: 0, max: 1, initial: state.gridStrength},
  {label: 'magStrength', type: 'range', min: 0, max: 1, initial: state.magStrength},
  {label: 'gridSpacing', type: 'range', min: 0.1, max: 10, initial: state.gridSpacing}
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

regl.frame(() => {
  camera(({dirty}) => {
    isDirty = isDirty || dirty;

    if (!isDirty) return;

    complexMap(state);
    isDirty = false;
  });
});
