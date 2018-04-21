import mapboxgl from 'mapbox-gl';
import uiState from './uiState';

// //Setup mapbox-gl map
export default new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/flaviogortana/cj8y8mhgfhscv2spffffazzwd',
  center: [13, 53],
  zoom: 9,
});
