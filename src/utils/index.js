export const addEvent = (object, type, callback) => {
  if (object == null || typeof object == 'undefined') return;
  if (object.addEventListener) {
    object.addEventListener(type, callback, false);
  } else if (object.attachEvent) {
    object.attachEvent('on' + type, callback);
  } else {
    object['on' + type] = callback;
  }
};

export const windowWidth = () => {
  const w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0];
  return w.innerWidth || e.clientWidth || g.clientWidth;
};

export const windowHeight = () => {
  const w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0];
  return w.innerHeight || e.clientHeight || g.clientHeight;
};

export const getDistances = (l1, l2) => {
  const dLat = l1.lat - l2.lat;
  let dLng = l1.lng - l2.lng;
  // make sure that the distance is always the shorter way around the world
  dLng = Math.abs(Math.min(dLng, 360 - dLng));
  const dist = Math.sqrt(Math.pow(dLat, 2) + Math.pow(dLng, 2));
  return {
    dLat,
    dLng,
    dist,
  };
};

export const getDistancesPx = (p1, p2) => {
  const dX = p1.x - p2.x;
  let dY = p1.y - p2.y;
  const dist = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
  return {
    dX,
    dY,
    dist,
  };
};

export const getTranslate = transformString => {
  const pixelTranslation = transformString.match(
    /translate\((-?([0-9\.]+px))(,\s?(-?([0-9\.]+px)))?\)/,
  )[0];
  return pixelTranslation.match(/(-?[0-9\.]+)/g).slice(0, 2);
};

export const roundToDecimals = (value, decimals) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const decimalToMinutes = value => {
  let val = Math.abs(value);
  val = Math.round(val) - val;
  val = val * 60 / 100;
  return Math.round(val * 100);
};

export const getLocationString = location => {
  const lngSuffix = location.lng > 0 ? 'E' : 'W';
  const latSuffix = location.lat > 0 ? 'N' : 'S';
  const lngDegree = Math.abs(Math.round(location.lng));
  const latDegree = Math.abs(Math.round(location.lat));
  const lngMinutes = decimalToMinutes(location.lng);
  const latMinutes = decimalToMinutes(location.lat);
  //return `${lngDegree}°${lngMinutes}"${lngSuffix} ${latDegree}°${latMinutes}"${latSuffix}`;
  return `${lngDegree}°${lngSuffix} ${latDegree}°${latSuffix}`;
};

const hasWebAudio = () => {
  return !!(window.webkitAudioContext || window.AudioContext);
};

export const HAS_WEB_AUDIO = hasWebAudio();

const userAgent = {};

if (/(android)/i.test(navigator.userAgent)) {
  userAgent.android = true;
  userAgent.mobile = true;
  userAgent.androidVersion = parseFloat(
    navigator.userAgent.slice(navigator.userAgent.indexOf('Android') + 8),
  );
} else if (/iP(hone|od|ad)/.test(navigator.platform)) {
  const v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
  userAgent.iOS = true;
  userAgent.mobile = true;
  userAgent.iOSVersion = [
    parseInt(v[1], 10),
    parseInt(v[2], 10),
    parseInt(v[3] || 0, 10),
  ];
} else if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
  userAgent.firefox = true;
} else if (document.documentMode || /Edge/.test(navigator.userAgent)) {
  userAgent.ie = true;
}

export const USER_AGENT = {
  ...userAgent,
};
