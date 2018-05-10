import { observable, action, computed } from 'mobx';
import {
  addEvent,
  windowWidth,
  windowHeight,
  getDistances,
  getDistancesPx,
  getTranslate,
  getLocationString,
} from './utils';
import { scaleLinear as d3_scaleLinear } from 'd3';
import { scaleQuantize as d3_scaleQuantize } from 'd3';
import { selectAll as d3_selectAll } from 'd3';
import _maxBy from 'lodash/maxBy';
import _minBy from 'lodash/minBy';
import _sortBy from 'lodash/sortBy';
import _find from 'lodash/find';
import _debounce from 'lodash/debounce';
import _negate from 'lodash/negate';
import _groupBy from 'lodash/groupBy';
import _map from 'lodash/map';
import { LngLatBounds, LngLat, Marker } from 'mapbox-gl';
import islands from 'app/data/islands';
import oceans from 'app/data/oceans';
import { MAX_ZOOM, MIN_ZOOM } from './config';

const SURFACE_CACHE_SIZE = 100;
const MIN_VOLUME = -75;

class UiState {
  @observable mapCenter = { lng: 178, lat: 0 };
  @observable mapZoom = 4;
  @observable mapInitialized = false;
  @observable mapSurfacesCache = [];
  @observable
  mapBounds = new LngLatBounds(new LngLat(0, 0), new LngLat(50, 50));
  @observable selectedIsland;

  @observable mouse = { x: 0, y: 0 };
  @observable.struct
  windowDimensions = {
    width: windowWidth(),
    height: windowHeight(),
  };

  @observable muted = false;
  @observable pendingRequests = [];
  @observable showIntro = false;

  constructor() {
    addEvent(
      window,
      'resize',
      _debounce(() => {
        this.windowDimensions = {
          width: windowWidth(),
          height: windowHeight(),
        };
      }),
      500,
    );

    document.addEventListener('mousemove', e => {
      this.mouse.x = e.pageX;
      this.mouse.y = e.pageY;
    });
  }

  setMap(map) {
    this.map = map;
  }

  @action
  setShowIntro(show) {
    this.showIntro = show;
  }

  @action
  setMuted(mute) {
    this.muted = mute;
  }

  @action
  setMapZoom(zoom) {
    this.mapZoom = zoom;
  }

  @action
  setMapParams(center, zoom, bounds, surface) {
    this.mapBounds = bounds;
    this.mapZoom = zoom;
    this.mapCenter = center;
    this.mapSurfacesCache = [
      surface,
      ...this.mapSurfacesCache.slice(0, SURFACE_CACHE_SIZE - 1),
    ];
    this.mapInitialized = true;
    this.selectedIsland = undefined;
  }

  @action
  setSelectedIsland(id) {
    this.selectedIsland = id;
  }

  @action
  addPendingRequest(id) {
    this.pendingRequests.push(id);
  }

  @action
  removePendingRequest(id) {
    const index = this.pendingRequests.indexOf(id);
    this.pendingRequests.splice(index, 1);
  }

  // COMPUTES

  @computed
  get loadingProgress() {
    this.pendingRequests;
  }

  // Utility function to simplify access to the corner points of the map
  @computed
  get mapBoundsAsObject() {
    const { lng: left, lat: top } = this.mapBounds.getNorthWest();
    const { lng: right, lat: bottom } = this.mapBounds.getSouthEast();
    return {
      left,
      top,
      right,
      bottom,
    };
  }

  // Returns an array of lat/lng coordinates for the four corners
  // of the map bounds (used manily to position the canvas source)
  @computed
  get mapBoundsAsArray() {
    const { left, top, right, bottom } = this.mapBoundsAsObject;
    return [[left, top], [right, top], [right, bottom], [left, bottom]];
  }

  // Retuns the width and height of the map in geographical distance (degrees)
  @computed
  get mapDimensions() {
    const { left, top, right, bottom } = this.mapBoundsAsObject;
    return {
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
    };
  }

  @computed
  get surfaces() {
    return this.mapSurfacesCache.slice();
  }

  @computed
  get mapCenterPx() {
    return this.map.project([this.mapCenter.lng, this.mapCenter.lat]);
  }

  @computed
  get mapBoundsPx() {
    return {
      sw: {
        lng: this.map.project(this.mapBounds.sw.lng),
        lat: this.map.project(this.mapBounds.sw.lat),
      },
      ne: {
        lng: this.map.project(this.mapBounds.ne.lng),
        lat: this.map.project(this.mapBounds.ne.lat),
      },
    };
  }

  @computed
  get islands() {
    return islands.map(island => {
      const locationPx = this.getLocationPx(island);
      const { dX, dY, dist } = getDistancesPx(locationPx, this.mapCenterPx);
      const volume = this.distPx2Volume(dist);
      const volNormal = 1 - volume / MIN_VOLUME;
      return {
        ...island,
        locationString: getLocationString(island.location),
        locationPx,
        dX,
        dY,
        dist,
        volNormal,
        volume,
        pan: Math.max(-1, Math.min(1, dX / this.mapCenterPx.x * 4)),
      };
    });
  }

  @computed
  get envParams() {
    const maxIslandVol = _maxBy(this.islands, 'volNormal').volNormal;
    let groupedSurfaces = _groupBy(this.mapSurfacesCache);
    const { land } = groupedSurfaces;
    // Number between 0 and 1 indicating the relative amount of hovered land
    const landFactor = land ? land.length / SURFACE_CACHE_SIZE : 0;
    // Get the number of occurences of oceans in the surfaces cache
    let oceanOccurences = this.mapSurfacesCache.filter(
      surface => surface !== 'land' && surface !== 'island',
    );
    const oceanValues = oceans.map(ocean => {
      const occurences = groupedSurfaces[ocean.id] || [];
      let value = occurences.length / oceanOccurences.length;
      value = isNaN(value) ? 0 : value;
      return {
        id: ocean.id,
        value: value,
      };
    });
    const vol = -20 * maxIslandVol + -30 * landFactor;
    return {
      volume: vol,
    };
  }

  @computed
  get popupCandidate() {
    if (this.selectedIsland) {
      return _find(this.islands, { id: this.selectedIsland });
    }
    const candidate = _minBy(this.islands, 'dist');
    if (this.mapZoom > 7 && candidate.volNormal < 0.2) {
      return candidate;
    }
    return undefined;
  }

  @computed
  get islandHints() {
    let candidates = _sortBy(this.islands, 'dist');
    candidates = candidates
      .filter(_negate(this.isIslandInView))
      .map(island => ({
        ...island,
        side: this.getHintSide(island.locationPx),
      }));
    candidates = _groupBy(candidates, 'side');
    return _map(candidates, sideGroup => {
      const island = sideGroup[0];
      const borderPos = this.getHintPos(island.locationPx);
      const { angle, dist } = this.getPolarPosition(island.locationPx);
      return {
        ...island,
        borderPos,
        angle,
        dist,
      };
    });
  }

  // The maximum visible distance from center of map. Depends on zoom level
  @computed
  get maxDistance() {
    const ne = this.mapBounds.getNorthEast();
    const sw = this.mapBounds.getSouthWest();
    const mapViewWidth = ne.lng - sw.lng;
    const mapViewHeight = ne.lat - sw.lat;
    return Math.max(mapViewWidth, mapViewHeight) / 2;
  }

  @computed
  get maxDistancePx() {
    return (
      Math.max(this.windowDimensions.width, this.windowDimensions.height) / 2
    );
  }

  // ZOOM SCALES
  @computed
  get zoom2Normalized() {
    return d3_scaleLinear()
      .domain([MIN_ZOOM, MAX_ZOOM])
      .range([0, 1])
      .clamp(true);
  }

  @computed
  get zoomNormal() {
    return this.zoom2Normalized(this.mapZoom);
  }

  @computed
  get zoom2Volume() {
    return d3_scaleLinear()
      .domain([MIN_ZOOM, MIN_ZOOM + 1])
      .range([-40, 0])
      .clamp(true);
  }

  @computed
  get zoomVolume() {
    return this.zoom2Volume(this.mapZoom);
  }

  // DIST SCALES

  @computed
  get distPx2Normalized() {
    return d3_scaleLinear()
      .domain([0, this.maxDistancePx])
      .range([0, 1])
      .clamp(true);
  }

  // An scale to convert lat/lng distances to a range between 0 and 1.
  // The value is normalized where everything above the domain max will drop to 0.
  // The scale is absolute (not relative to screen size or zoom level)
  @computed
  get dist2Normalized() {
    return d3_scaleLinear()
      .domain([0, 7])
      .range([1, 0])
      .clamp(true);
  }

  @computed
  get dist2Volume() {
    return d3_scaleLinear()
      .domain([0, 7])
      .range([0, -75])
      .clamp(true);
  }

  // Calculates the angle formed by the center and the corners of the screen
  @computed
  get sideCenterAngles() {
    const sideSum = this.windowDimensions.width + this.windowDimensions.height;
    const topBottom = this.windowDimensions.width / sideSum * Math.PI;
    const leftRigth = Math.abs(topBottom - Math.PI);
    return { topBottom, leftRigth };
  }

  @computed
  get relativeMousePos() {
    return {
      x: this.mouse.x / this.windowDimensions.width,
      y: this.mouse.y / this.windowDimensions.height,
    };
  }

  // HELPERS

  // Returns the volume of an island depending on distance to center and
  // zoom level, constrained to MIN_VOLUME
  distPx2Volume(dist) {
    const distNormal = this.distPx2Normalized(dist);
    return Math.max(
      distNormal * MIN_VOLUME + (1 - this.zoomNormal) * MIN_VOLUME,
      MIN_VOLUME,
    );
  }

  getLocationPx({ id }) {
    //const mockMarker = new Marker().setLngLat(location).addTo(this.map);
    const translate = { x: 0, y: 0 };
    d3_selectAll('.map__island').each(function(d) {
      if (d.id === id) {
        const _translations = getTranslate(this.style.transform);
        translate.x = _translations[0];
        translate.y = _translations[1];
      }
    });
    // const translate = getTranslate(mockMarker.getElement().style.transform);
    // mockMarker.remove();
    return translate; //{ x: translate[0], y: translate[1] };
  }

  getPolarPosition(p) {
    // Suuper ugly way of getting polar coordinates ranging from 0 to 2 * PI
    const angle1 = Math.atan2(
      this.mapCenterPx.y - p.y,
      this.mapCenterPx.x - p.x,
    );
    const angle2 = Math.atan2(
      p.y - this.mapCenterPx.y,
      p.x - this.mapCenterPx.x,
    );
    let angle = angle2 > angle1 ? Math.PI * 2 - angle2 : Math.PI - angle1;
    angle = Math.PI * 2 - angle;
    const dist = Math.sqrt(
      Math.pow(p.x - this.mapCenterPx.x, 2) +
        Math.pow(p.y - this.mapCenterPx.y, 2),
    );
    return { angle, dist };
  }

  // returns the name of the side at which the line containing the center of
  // the screen and the given point intersect the frame of the screen
  getHintSide(point) {
    const { angle } = this.getPolarPosition(point);
    const { topBottom, leftRigth } = this.sideCenterAngles;
    const right = leftRigth / 2;
    const bottom = right + topBottom;
    const left = bottom + leftRigth;
    const top = left + topBottom;
    let side = 'right';
    if (angle > right) side = 'bottom';
    if (angle > bottom) side = 'left';
    if (angle > left) side = 'top';
    if (angle > top) side = 'right';
    return side;
  }

  // given a screen point, returns a screen position at the intersection of the screen
  // and the line containing the center of the screen and the given point
  getHintPos(point) {
    const dX = point.x - this.mapCenterPx.x;
    const dY = point.y - this.mapCenterPx.y;
    const slope = dY / dX;
    const yPrefix = dY > 0 ? 1 : -1;
    const xPrefix = dX > 0 ? 1 : -1;
    const xIntersection =
      yPrefix * this.mapCenterPx.y / slope + this.mapCenterPx.x;
    const yIntersection =
      xPrefix * this.mapCenterPx.x * slope + this.mapCenterPx.y;
    return {
      x: Math.max(0, Math.min(xIntersection, this.windowDimensions.width)),
      y: Math.max(0, Math.min(yIntersection, this.windowDimensions.height)),
    };
  }

  isIslandInView = ({ locationPx }) => {
    return (
      locationPx.x > 0 &&
      locationPx.x < this.windowDimensions.width &&
      locationPx.y > -50 &&
      locationPx.y < this.windowDimensions.height
    );
  };
}

export default new UiState();
