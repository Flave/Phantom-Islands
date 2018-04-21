import { observable, action, computed } from 'mobx';
import {
  addEvent,
  windowWidth,
  windowHeight,
  getDistances,
  getTranslate,
  getLocationString,
} from './utils';
import { scaleLinear as d3_scaleLinear } from 'd3';
import { scaleQuantize as d3_scaleQuantize } from 'd3';
import _minBy from 'lodash/minBy';
import _sortBy from 'lodash/sortBy';
import { LngLatBounds, LngLat, Marker } from 'mapbox-gl';
import islands from 'app/data/islands';

class UiState {
  @observable mapCenter = { lng: 177, lat: 0 };
  @observable mapZoom = 5;
  @observable mapInitialized = false;
  @observable
  mapBounds = new LngLatBounds(
    new LngLat(-73.9876, 40.7661),
    new LngLat(-73.9397, 40.8002),
  );
  @observable loadingProgress = 0;
  @observable isOverWater = false;
  @observable.struct
  windowDimensions = {
    width: windowWidth(),
    height: windowHeight(),
  };

  constructor() {
    addEvent(window, 'resize', () => {
      this.windowDimensions = {
        width: windowWidth(),
        height: windowHeight(),
      };
    });
  }

  setMap(map) {
    this.map = map;
  }

  @action
  setMapCenter(center) {
    this.mapCenter = center;
  }

  @action
  setMapZoom(zoom) {
    this.mapZoom = zoom;
  }

  @action
  setMapBounds(bounds) {
    this.mapBounds = bounds;
  }

  @action
  setMapParams(center, zoom, bounds) {
    this.mapBounds = bounds;
    this.mapZoom = zoom;
    this.mapCenter = center;
    this.mapInitialized = true;
  }

  @action
  setLoadingProgress(progress) {
    this.loadingProgress = progress;
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
      const locationPx = this.getLocationPx(island.location);
      const { dLng, dLat, dist } = getDistances(
        island.location,
        this.mapCenter,
      );
      return {
        ...island,
        locationString: getLocationString(island.location),
        locationPx,
        dLng,
        dLat,
        dist,
        dNormal: this.dist2Normalized(dist),
        volume: this.dist2Volume(dist),
      };
    });
  }

  @computed
  get popupCandidate() {
    if (this.mapZoom < 7) return;
    const candidate = _minBy(this.islands, 'dist');
    if (candidate.dNormal < 0.2) return candidate;
    return;
  }

  @computed
  get islandMarkers() {}

  @computed
  get islandHints() {
    let candidates = _sortBy(this.islands, 'dist');
    return candidates
      .slice(0, 4)
      .map(island => {
        if (this.isPointInsideView(island.locationPx)) return;
        const borderPos = this.getHintPos(island.locationPx);
        const side = this.getHintSide(island.locationPx);
        const { angle, dist } = this.getPolarPosition(island.locationPx);
        return {
          ...island,
          borderPos,
          side,
          angle,
          dist,
        };
      })
      .filter(d => d);
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

  @computed
  get distPx2Val() {
    return d3_scaleLinear()
      .domain([0, this.maxDistancePx])
      .range([0, 1]);
  }

  // An scale to convert lat/lng distances to a range between 0 and 1.
  // The value is normalized where everything above the domain max will drop to 0.
  // The scale is absolute (not relative to screen size or zoom level)
  @computed
  get dist2Normalized() {
    return d3_scaleLinear()
      .domain([0, 15])
      .range([0, 1])
      .clamp(true);
  }

  @computed
  get dist2Volume() {
    return d3_scaleLinear()
      .domain([0, 15])
      .range([0, -70])
      .clamp(true);
  }

  // Calculates the angle
  @computed
  get sideCenterAngles() {
    const sideSum = this.windowDimensions.width + this.windowDimensions.height;
    const topBottom = this.windowDimensions.width / sideSum * Math.PI;
    const leftRigth = Math.abs(topBottom - Math.PI);
    return { topBottom, leftRigth };
  }

  getLocationPx(location) {
    const mockMarker = new Marker().setLngLat(location).addTo(this.map);
    const translate = getTranslate(mockMarker.getElement());
    mockMarker.remove();
    return { x: translate[0], y: translate[1] };
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

  isPointInsideView(point) {
    return (
      point.x > 0 &&
      point.x < this.windowDimensions.width &&
      point.y > 0 &&
      point.y < this.windowDimensions.height
    );
  }
}

export default new UiState();
