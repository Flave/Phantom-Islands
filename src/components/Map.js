import { autorun, when } from 'mobx';
import uiState from 'app/uiState';
import { Marker, Popup } from 'mapbox-gl';
import { select as d3_select, event as d3_event } from 'd3';

const WorldMap = function(map) {
  const markers = [];

  const updateMapParams = () => {
    uiState.setMapParams(
      map.getCenter(),
      map.getZoom(),
      map.getBounds(),
      getSurfaceId(),
    );
  };

  const getSurfaceId = () => {
    const centerInPixels = map.project(map.getCenter());
    const feature = map.queryRenderedFeatures([
      centerInPixels.x,
      centerInPixels.y,
    ]);
    let surface;

    // there seems to be a gap at {180, 0} with no feature
    if (!feature.length) {
      surface = 'pacific';
    } else {
      const id = feature[0].properties.id;
      const type = feature[0].properties.type;
      surface = id ? id : 'land';
      surface = type ? type : surface;
    }
    return surface;
  };

  const handleZoom = () => {
    markers.forEach(marker => {
      d3_select(marker.getElement()).classed(
        'map__island--low-zoom',
        map.getZoom() < 5.5,
      );
    });
    updateMapParams();
  };

  const setMaxZoom = () => {
    // set min zoom to 4 after intro to prevent zooming out too much
    // if (!uiState.showIntro) {
    //   map.setMinZoom(4);
    // }
  };

  const selectIsland = island => {
    uiState.transitionMap(
      {
        lng: island.location.lng + 0.001,
        lat: island.location.lat + 0.001,
      },
      9,
    );
  };

  const deselectIsland = () => {
    uiState.setSelectedIsland();
  };

  const update = transition => {
    if (
      uiState.mapZoom !== map.getZoom() ||
      uiState.mapCenter !== map.getCenter()
    ) {
      map.flyTo({
        zoom: uiState.mapZoom,
        center: uiState.mapCenter,
        speed: 0.7,
        curve: 1.1,
      });
    }
    uiState.islands.forEach(island => {
      d3_select(`[data-island-id="${island.id}"]`).classed(
        'is-hidden',
        island.hide,
      );
    });
  };

  const initIslands = () => {
    uiState.islands.forEach(island => {
      const el = d3_select(document.body)
        .datum(island)
        .append('div')
        .attr('data-island-id', island.id)
        .classed('map__island--low-zoom', true)
        .html(
          `<div class="map__island-inner"><div class="map__island-name">${
            island.name
          }</div></div>`,
        )
        .on('click', function(e) {
          selectIsland(island);
          d3_event.stopPropagation();
        })
        .classed('map__island', true);

      const marker = new Marker(el.node())
        .setLngLat(island.location)
        .addTo(map);
      markers.push(marker);
    });
  };

  map.on('click', deselectIsland);
  map.on('zoom', handleZoom);
  map.on('move', updateMapParams);
  map.on('load', updateMapParams);
  map.on('zoomend', setMaxZoom);

  autorun(update);
  when(() => uiState.islands.length, initIslands);
};

export default WorldMap;
