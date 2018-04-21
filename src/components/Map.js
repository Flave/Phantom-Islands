import uiState from 'app/uiState';
import islands from 'app/data/islands';
import { Marker, Popup } from 'mapbox-gl';
import { selection as d3_selection } from 'd3';

const WorldMap = function(map) {
  const _worldMap = function(parent) {};

  const updateMapParams = () => {
    const centerInPixels = map.project(map.getCenter());
    const feature = map.queryRenderedFeatures([
      centerInPixels.x,
      centerInPixels.y,
    ]);
    let isOverWater = false;
    if (feature.length) {
      isOverWater = feature[0].layer.id = 'water';
    }
    uiState.setMapParams(
      map.getCenter(),
      map.getZoom(),
      map.getBounds(),
      isOverWater,
    );
  };

  uiState.islands.forEach(island => {
    const el = d3_selection(document.body)
      .append('div')
      .html(`<div class="map__island-name">${island.name}</div>`)
      .classed('map__island', true);
    new Marker(el.node()).setLngLat(island.location).addTo(map);
  });

  map.on('zoom', updateMapParams);
  map.on('move', updateMapParams);
  map.on('load', updateMapParams);

  return _worldMap;
};

export default WorldMap;
