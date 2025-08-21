const makeFilename = (link) => {
  const { hostname, pathname } = new URL(link)
  const base = `${hostname}${pathname}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}.html`
}

export { makeFilename }
