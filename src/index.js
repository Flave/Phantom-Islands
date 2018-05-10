import 'html/index.html';
import 'style/index.scss';

import mapboxgl from 'mapbox-gl';

import WorldMap from 'components/Map';
import Canvas from 'components/Canvas';
import Popups from 'components/Popups';
import Intro from 'components/Intro';
import Hints from 'components/Hints';
import Muter from 'components/Muter';
import LoadingIndicator from 'components/LoadingIndicator';
import SoundManager from 'components/SoundManager';
import FrequencyVisualizer from 'components/FrequencyVisualizer';
import uiState from './uiState';
import { MAX_ZOOM, MIN_ZOOM } from './config';

mapboxgl.accessToken =
  'pk.eyJ1IjoiZmxhdmlvZ29ydGFuYSIsImEiOiJzalRHcS1JIn0.aeJmH09S2p_hjOSs3wuT3w';

// //Setup mapbox-gl map
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/flaviogortana/cjh0rd0ju002a2so0xcxii2bp',
  center: [uiState.mapCenter.lng, uiState.mapCenter.lat],
  zoom: uiState.mapZoom,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
});

uiState.setMap(map);

const soundManager = new SoundManager();

Intro();
WorldMap(map);
//Canvas(map);
Popups()(map);
Hints()(map);

LoadingIndicator();
Muter();
FrequencyVisualizer(soundManager)();
