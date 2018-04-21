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

export const getTranslate = el => {
  const transArr = [];
  if (!window.getComputedStyle) return;
  const style = getComputedStyle(el),
    transform = style.transform || style.webkitTransform || style.mozTransform;
  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) return parseFloat(mat[1].split(', ')[13]);
  mat = transform.match(/^matrix\((.+)\)$/);
  mat ? transArr.push(parseFloat(mat[1].split(', ')[4])) : 0;
  mat ? transArr.push(parseFloat(mat[1].split(', ')[5])) : 0;
  return transArr;
};
