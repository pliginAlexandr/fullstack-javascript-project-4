import path from 'path'

const makeFilename = (link) => {
  const { hostname, pathname } = new URL(link)
  const normalizedPath = pathname === '/' ? '' : pathname
  const base = `${hostname}${normalizedPath}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}.html`
}

const makeDirName = (link) => {
  return makeFilename(link).replace(/\.html$/, '_files')
}

const makeResourceName = (link) => {
  const { hostname, pathname } = new URL(link)
  const ext = path.extname(pathname)
  const withoutExt = pathname.replace(ext, '')
  const base = `${hostname}${withoutExt}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}${ext}`
}

export { makeFilename, makeDirName, makeResourceName }
