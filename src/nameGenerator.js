export default function nameGenerator(url) {
  const { hostname, pathname } = new URL(url);
  const fullPath = `${hostname}${pathname}`;
  const result = fullPath
    .replace(/\/$/, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .concat('.html');
  return result;
}
