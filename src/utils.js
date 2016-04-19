export function camelToKebab(str) {
  return str.replace(/([a-z])([A-Z])/g, (match, pre, post) => {
    return `${pre}-${post.toLowerCase()}`;
  });
}
