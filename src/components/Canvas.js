import uiState from 'app/uiState';
import islands from 'app/data/islands';

const Canvas = function(map) {
  const canvasEl = document.getElementById('map-canvas');
  // document.body.appendChild(canvasEl);
  // canvasEl.setAttribute('id', 'map-canvas');
  canvasEl.width = 500;
  canvasEl.height = 500;
  canvasEl.style.width = 500;
  canvasEl.style.height = 500;
  const ctx = canvasEl.getContext('2d');
  ctx.fillStyle = '#f00';
  ctx.fillRect(0, 0, 500, 500);
  ctx.fill();

  map.on('load', () => {
    const layers = map.getStyle().layers;
    const bottomLayer = layers[0];
    console.log(bottomLayer.id);
    //map.setPaintProperty('background', 'fill-color', '#ffff00');
    map.addSource('map-canvas', {
      type: 'canvas',
      canvas: 'map-canvas',
      animate: false,
      coordinates: [[-0, 0], [20, 0], [20, 20], [0, 20]],
    });
    map.addLayer(
      {
        id: 'my-canvas',
        type: 'raster',
        source: 'map-canvas',
      },
      bottomLayer.id,
    );
  });

  const _canvas = function(parent) {};
  return _canvas;
};

export default Canvas;
