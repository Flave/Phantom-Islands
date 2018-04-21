import 'html/index.html';
import 'style/index.scss';

import mapboxgl from 'mapbox-gl';
import WorldMap from 'components/Map';
import Canvas from 'components/Canvas';
import Popups from 'components/Popups';
import Hints from 'components/Hints';
import SoundManager from 'components/SoundManager';
import uiState from './uiState';
import loadAudio from './Loader';
import samples from 'app/data/samples';

import { queue as d3_queue } from 'd3-queue';

mapboxgl.accessToken =
  'pk.eyJ1IjoiZmxhdmlvZ29ydGFuYSIsImEiOiJzalRHcS1JIn0.aeJmH09S2p_hjOSs3wuT3w';

// //Setup mapbox-gl map
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/flaviogortana/cj9wv1fat63yv2rpij16iayff',
  center: [uiState.mapCenter.lng, uiState.mapCenter.lat],
  zoom: uiState.mapZoom,
});

uiState.setMap(map);

const worldMap = WorldMap(map);
//Canvas(map);
Popups()(map);
Hints()(map);

const soundManager = new SoundManager();
