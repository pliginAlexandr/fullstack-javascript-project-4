const makeFilename = (link) => {
  const { hostname, pathname } = new URL(link)
  const normalizedPath = pathname === '/' ? '' : pathname
  const base = `${hostname}${normalizedPath}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}.html`
}

export { makeFilename }
