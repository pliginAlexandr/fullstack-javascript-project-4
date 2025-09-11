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

const isResource = (resourceUrl, baseUrl) => {
  try {
    if (resourceUrl === baseUrl) return false

    const { pathname } = new URL(resourceUrl, baseUrl)
    const ext = (path.extname(pathname) || '.html').toLowerCase()

    const resourceExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg',
      '.css', '.js', '.ico', '.webp',
      '.html',
    ]

    return resourceExtensions.includes(ext)
  }
  catch (e) {
    console.warn(`Invalid URL: ${resourceUrl}`, e.message)
    return false
  }
}

const isLocal = (resourceUrl, baseUrl) => {
  const pageHost = new URL(baseUrl).hostname
  const resHost = new URL(resourceUrl, baseUrl).hostname
  return pageHost === resHost
}

export { makeFilename, makeDirName, makeResourceName, isResource, isLocal }
