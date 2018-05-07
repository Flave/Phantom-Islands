import uiState from 'app/uiState';
import islands from 'app/data/islands';
import { autorun } from 'mobx';
import { Application, particles, Sprite, Texture, Rectangle } from 'pixi.js';

//const STEP_SIZE = 2; // Grid size to snap to, expressed in degrees
const radius = 2;
const resolution = 1;

const generateTexture = () => {
  const textureCanvas = document.createElement('canvas');
  const context = textureCanvas.getContext('2d');

  textureCanvas.width = textureCanvas.height = radius * 2;
  context.fillStyle = '#f00';

  context.scale(resolution, resolution);
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();

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
  const particleContainer = new particles.ParticleContainer(5000);
  let stepSize = 10;

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
    stepSize = Math.ceil(100 / Math.pow(Math.floor(mapZoom), 3.5));

    const lngStart = Math.round(bounds.left / stepSize) * stepSize;
    const lngEnd = Math.round(bounds.right / stepSize) * stepSize;
    const latStart = Math.round(bounds.top / stepSize) * stepSize;
    const latEnd = Math.round(bounds.bottom / stepSize) * stepSize;

    if (stepSize !== prevStepSize) particleContainer.removeChildren();
    else
      particleContainer.children.forEach(particle => {
        if (
          particle.x < 0 ||
          particle.x > windowDimensions.width ||
          particle.y < 0 ||
          particle.y > windowDimensions.height
        ) {
          particleContainer.removeChild(particle);
        }
      });

    for (var lng = lngStart; lng < lngEnd; lng = lng + stepSize) {
      for (var lat = latStart; lat > latEnd; lat = lat - stepSize) {
        const name = `${lng}__${lat}`;
        let particle = particleContainer.getChildByName(name);
        if (!particle) {
          particle = createParticle(name);
          particleContainer.addChild(particle);
        }
        const { x, y } = map.project({
          lat: lat,
          lng: lng,
        });

        particle.position.set(x, y);
      }
    }
    console.log(particleContainer.children.length);
  };

  map.on('load', update);

  //update();

  autorun(update);
};

export default Canvas;
