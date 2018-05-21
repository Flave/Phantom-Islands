import uiState from 'app/uiState';
import { autorun } from 'mobx';
import { range as d3_range } from 'd3-array';
import {
  Application,
  particles as pixiParticles,
  Sprite,
  Texture,
  Rectangle,
} from 'pixi.js';

//const STEP_SIZE = 2; // Grid size to snap to, expressed in degrees
const radius = 1;
const resolution = 1;

const generateTexture = () => {
  const textureCanvas = document.createElement('canvas');
  const context = textureCanvas.getContext('2d');

  textureCanvas.width = textureCanvas.height = radius * 2;
  context.fillStyle = '#000';

  context.scale(resolution, resolution);
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2);
  context.fill();

  const texture = Texture.fromCanvas(textureCanvas);
  const baseTexture = texture.baseTexture;
  baseTexture.resolution = resolution;
  baseTexture.realWidth = textureCanvas.width;
  baseTexture.realHeight = textureCanvas.height;
  baseTexture.width = textureCanvas.width / resolution;
  baseTexture.height = textureCanvas.height / resolution;

  texture.trim = new Rectangle();
  texture.trim.width = texture._frame.width = textureCanvas.width / resolution;
  texture.trim.height = texture._frame.height =
    textureCanvas.height / resolution;
  texture.trim.x = 0;
  texture.trim.y = 0;
  texture.orig.width = texture._frame.width;
  texture.orig.height = texture._frame.height;

  return texture;
};

const Canvas = function(map) {
  const { windowDimensions } = uiState;
  const canvasEl = document.getElementById('map-canvas');
  const pixiApp = new Application({
    width: windowDimensions.width,
    height: windowDimensions.height,
    view: canvasEl,
    clearBeforeRender: true,
    backgroundColor: 0xffffff,
  });
  const particleTexture = generateTexture();
  const renderer = pixiApp.renderer;
  const stage = pixiApp.stage;
  const particleContainer = new pixiParticles.ParticleContainer(20000);
  let stepSize = 10;
  let particles = new Map();

  stage.addChild(particleContainer);
  pixiApp.start();

  const createParticle = name => {
    const particle = new Sprite();
    particle.anchor.set(0.5);
    particle.width = radius;
    particle.height = radius;
    particle.texture = particleTexture;
    particle.name = name;
    return particle;
  };

  const update = () => {
    const { windowDimensions, mapZoom, mapBoundsAsObject: bounds } = uiState;
    const prevStepSize = stepSize;
    stepSize = 300 / Math.pow(Math.round(mapZoom), 3.65);

    const lngStart = Math.floor(bounds.left / stepSize) * stepSize;
    const lngEnd = Math.ceil(bounds.right / stepSize) * stepSize;
    const latStart = Math.floor(bounds.top / stepSize) * stepSize;
    const latEnd = Math.ceil(bounds.bottom / stepSize) * stepSize;

    const cols = d3_range(lngStart, lngEnd, stepSize).map(lng => ({
      lng,
      x: map.project({
        lng,
        lat: latStart,
      }).x,
    }));

    const rows = d3_range(latEnd, latStart, stepSize).map(lat => ({
      lat,
      y: map.project({
        lng: lngStart,
        lat,
      }).y,
    }));

    if (stepSize !== prevStepSize) {
      particleContainer.removeChildren();
      particles = new Map();
    } else
      particleContainer.children.forEach(particle => {
        if (
          particle.lng < lngStart ||
          particle.lng > lngEnd ||
          particle.lat < latStart ||
          particle.lat > latEnd
        ) {
          particleContainer.removeChild(particle);
          particles.delete(particle.name);
        }
      });

    cols.forEach(col => {
      rows.forEach(row => {
        const name = `${col.lng}__${row.lat}`;
        let particle = particles.get(name);
        if (!particle) {
          particle = createParticle(name);
          particles.set(name, particle);
          particleContainer.addChild(particle);
        }
        particle.lng = col.lng;
        particle.lat = row.lat;
        particle.position.set(col.x, row.y);
      });
    });
  };

  map.on('load', update);

  //update();

  autorun(update);
};

export default Canvas;
