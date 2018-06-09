import 'html/index.html';
import 'style/index.scss';

import mapboxgl from 'mapbox-gl';
import { autorun } from 'mobx';

import WorldMap from 'components/Map';
import Popups from 'components/Popups';
import Intro from 'components/Intro';
import Hints from 'components/Hints';
import Muter from 'components/Muter';
import AboutButton from 'components/AboutButton';
import CruiseButton from 'components/CruiseButton';
import LoadingIndicator from 'components/LoadingIndicator';
import SoundManager from 'components/SoundManager';
import FrequencyVisualizer from 'components/FrequencyVisualizer';
import OldBrowserInfo from 'components/OldBrowserInfo';

import uiState from './uiState';
import { MAX_ZOOM, MIN_ZOOM, MAX_LAT, MIN_LAT } from './config';
import { USER_AGENT, HAS_WEB_AUDIO } from './utils';

mapboxgl.accessToken =
  'pk.eyJ1IjoiZmxhdmlvZ29ydGFuYSIsImEiOiJzalRHcS1JIn0.aeJmH09S2p_hjOSs3wuT3w';

// //Setup mapbox-gl map
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/flaviogortana/cji1nmfus51rx2sm53ewcslu0',
  center: [uiState.mapCenter.lng, uiState.mapCenter.lat],
  zoom: uiState.mapZoom,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  maxBounds: [[-Infinity, MIN_LAT], [Infinity, MAX_LAT]],
});
map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.addControl(new mapboxgl.ScaleControl(), 'top-left');
map.addControl(new mapboxgl.NavigationControl(), 'top-left');

if (HAS_WEB_AUDIO) {
  uiState.setMap(map);

  const soundManager = new SoundManager();

  Intro();
  WorldMap(map);
  Popups()(map);
  Hints()(map);

  LoadingIndicator();
  FrequencyVisualizer(soundManager)();
  Muter();
  CruiseButton();
  AboutButton();

  autorun(() => {
    if (uiState.readyToPlay) window.removeInitialLoader();
  });
} else {
  window.removeInitialLoader();
  OldBrowserInfo();
}
