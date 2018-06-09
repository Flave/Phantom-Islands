import { autorun, when } from 'mobx';
import uiState from 'app/uiState';
import { Marker, Popup } from 'mapbox-gl';
import { select as d3_select, event as d3_event } from 'd3-selection';
import cruisePath from 'data/cruisePath.json';

class Cruiser {
  constructor(map) {
    this.map = map;
    this.step = 0;
    this.path = cruisePath.features[0].geometry.coordinates;
    this.isCruising = false;
  }

  start() {
    this.step = 0;
    const startPoint = this.path[this.step];
    this.isCruising = true;
    this.map.flyTo(
      {
        center: { lng: startPoint[0], lat: startPoint[1] },
        zoom: 8,
      },
      {
        initiator: 'cruiser',
      },
    );

    this.map.once('moveend', this.moveToNextPoint);
  }

  moveToNextPoint() {
    this.step += 1;
    let progress = 0;
    const start = this.path[this.step - 1];
    const end = this.path[this.step];
    const dLng = end[0] - start[0];
    const dLat = end[1] - start[1];
    const dist = Math.sqrt(dLng * dLng + dLat * dLat);
    const speed = 0.007;

    const nextStep = () => {
      if (!this.isCruising) return;

      const lng = start[0] + dLng * progress;
      const lat = start[1] + dLat * progress;
      this.map.jumpTo(
        {
          center: { lng, lat },
        },
        { initiator: 'cruiser' },
      );
      progress += speed;
      if (progress < 1) window.setTimeout(nextStep, 16);
      else if (this.step < this.path.length - 1) this.moveToNextPoint();
      else this.start();
    };
    nextStep();
  }

  stop() {
    this.isCruising = false;
  }
}

const WorldMap = function(map) {
  const markers = [];
  const cruiser = new Cruiser(map);

  const updateMapParams = e => {
    uiState.setMapParams(
      map.getCenter(),
      map.getZoom(),
      map.getBounds(),
      getSurfaceId(),
    );

    if (e.initiator !== 'cruiser') uiState.setCruiseMode(false);
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

  const handleZoom = e => {
    markers.forEach(marker => {
      d3_select(marker.getElement()).classed(
        'map__island--low-zoom',
        map.getZoom() < 5.5,
      );
    });
    updateMapParams(e);
  };

  const selectIsland = island => {
    uiState.transitionMap(island.location, 9);
  };

  const deselectIsland = () => {
    uiState.setSelectedIsland();
  };

  const update = transition => {
    if (uiState.cruiseMode && !cruiser.isCruising) {
      cruiser.start();
    } else if (
      uiState.mapZoom !== map.getZoom() ||
      uiState.mapCenter !== map.getCenter()
    ) {
      map.flyTo({
        zoom: uiState.mapZoom,
        center: uiState.mapCenter,
        speed: 0.7,
        curve: 1.1,
      });
    } else if (!uiState.cruiseMode && cruiser.isCruising) {
      cruiser.stop();
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

  autorun(update);
  when(() => uiState.islands.length, initIslands);
};

export default WorldMap;
