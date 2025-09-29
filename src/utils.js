import path from 'path'

const makeFilename = (link) => {
  const { hostname, pathname } = new URL(link)
  const ext = path.extname(pathname)
  const normalizedPath = pathname === '/' ? '' : pathname

  let base = `${hostname}${normalizedPath}`.replace(/[^a-zA-Z0-9]/g, '-')
  base = base.replace(/^-+|-+$/g, '')

  return ext ? base : `${base}.html`
}

const makeDirName = (url) => {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace(/\./g, '-')
  const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname
  const normalizedPath = pathname.replace(/\//g, '-').replace(/^-+|-+$/g, '')
  return `${hostname}${normalizedPath ? '-' + normalizedPath : ''}_files`
}

const makeResourceName = (link) => {
  const { hostname, pathname } = new URL(link)
  const ext = path.extname(pathname) || '.html'
  const withoutExt = pathname.replace(path.extname(pathname), '')
  let base = `${hostname}${withoutExt}`.replace(/[^a-zA-Z0-9]/g, '-')
  base = base.replace(/^-+|-+$/g, '')
  return `${base}${ext}`
}

const isResource = (link, baseUrl) => {
  if (!link) return false

  try {
    const resourceUrl = baseUrl ? new URL(link, baseUrl) : new URL(link)

    if (baseUrl) {
      const pageUrl = new URL(baseUrl)
      if (resourceUrl.href === pageUrl.href) {
        return false
      }
    }

    return true
  }
  catch (e) {
    console.warn(`Invalid URL: ${e.message}`)
    return false
  }
}

export { makeFilename, makeDirName, makeResourceName, isResource }
