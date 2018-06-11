import { autorun, when } from 'mobx';
import uiState from 'app/uiState';
import { Marker, Popup } from 'mapbox-gl';
import { select as d3_select, event as d3_event } from 'd3-selection';
import { easePolyInOut as d3EasePolyInOut } from 'd3-ease';
import cruisePath from 'data/cruisePath.json';
import _minBy from 'lodash.minBy';

class Cruiser {
  constructor(map) {
    this.map = map;
    this.step = 0;
    this.isCruising = false;
    this.waypoints = [];
    this.cruiseDuration = 15;
    this.pauseDuration = 2;
  }

  start() {
    this.isCruising = true;
    this.waypoints = uiState.islands
      .slice()
      .sort((a, b) => a.cruiseIndex - b.cruiseIndex);
    const startPoint = _minBy(this.waypoints, 'dist');
    this.step = this.waypoints.indexOf(startPoint);

    this.map.flyTo(
      {
        center: startPoint.location,
        zoom: 7,
      },
      {
        initiator: 'cruiser',
      },
    );

    this.map.once('moveend', e => {
      if (e.initiator === 'cruiser') this.moveToNextPoint();
    });
  }

  moveToNextPoint = () => {
    this.step += 1;
    const duration =
      this.waypoints[this.step].cruiseDuration || this.cruiseDuration;
    this.stepDuration = duration * 1000; // 100 seconds in milliseconds
    this.startTime = new Date();
    this.nextAnimationStep();
  };

  nextAnimationStep = () => {
    if (!this.isCruising) return;
    const ellapsed = new Date() - this.startTime;
    const progress = ellapsed / this.stepDuration;
    const easedProgress = d3EasePolyInOut(progress, 2);
    const startIndex =
      this.step === 0 ? this.waypoints.length - 1 : this.step - 1;
    const start = this.waypoints[startIndex].location;
    const endWaypoint = this.waypoints[this.step];
    const end = endWaypoint.location;
    const dLng = end.lng + 0.002 - (start.lng + 0.002);
    const dLat = end.lat + 0.03 - (start.lat + 0.03);

    const lng = start.lng + dLng * easedProgress;
    const lat = start.lat + dLat * easedProgress;
    this.map.jumpTo(
      {
        center: { lng, lat },
      },
      { initiator: 'cruiser' },
    );

    if (progress < 1) {
      window.setTimeout(this.nextAnimationStep, 16);
    } else if (this.step < this.waypoints.length - 1) {
      window.setTimeout(
        this.moveToNextPoint,
        endWaypoint.pauseDuration || this.pauseDuration * 1000,
      );
    } else {
      this.step = 0;
      window.setTimeout(
        this.moveToNextPoint,
        endWaypoint.pauseDuration || this.pauseDuration * 1000,
      );
    }
  };

  stop = () => {
    this.isCruising = false;
  };
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
