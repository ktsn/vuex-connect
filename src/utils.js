export function camelToKebab(str) {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

export function assign(target, ...args) {
  args.forEach(obj => {
    Object.keys(obj).forEach(key => {
      target[key] = obj[key];
    });
  });
  return target;
}

export function pick(obj, keys) {
  const res = {};
  keys.forEach(key => {
    if (obj[key] !== void 0) {
      res[key] = obj[key];
    }
  });
  return res;
}

export function omit(obj, keys) {
  const res = {};
  Object.keys(obj).forEach(key => {
    if (!includes(keys, key)) {
      res[key] = obj[key];
    }
  });
  return res;
}

export function mapValues(obj, f) {
  const res = {};
  Object.keys(obj).forEach(key => {
    res[key] = f(obj[key], key);
  });
  return res;
}

function includes(array, item) {
  return array.indexOf(item) > -1;
}
