import path from 'path'

const makeFilename = (link) => {
  const { hostname, pathname } = new URL(link)
  const normalizedPath = pathname === '/' ? '' : pathname
  const base = `${hostname}${normalizedPath}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}.html`
}

const makeDirName = (url) => {
  const urlObj = new URL(url)
  const hostname = urlObj.hostname.replace(/\./g, '-')
  const pathname = urlObj.pathname === '/' ? '' : urlObj.pathname

  const normalizedPath = pathname.replace(/\//g, '-').replace(/^-|-$/g, '')

  return `${hostname}${normalizedPath ? '-' + normalizedPath : ''}_files`
}

const makeResourceName = (link) => {
  const { hostname, pathname } = new URL(link)
  const ext = path.extname(pathname)
  const withoutExt = pathname.replace(ext, '')
  const base = `${hostname}${withoutExt}`.replace(/[^a-zA-Z0-9]/g, '-')
  return `${base}${ext}`
}

const isResource = (resourceUrl, baseUrl) => {
  try {
    if (resourceUrl === baseUrl) return false

    const { pathname } = new URL(resourceUrl)
    const extension = path.extname(pathname).toLowerCase()

    if (!extension) return false

    const resourceExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.svg',
      '.css', '.js', '.ico', '.webp',
    ]

    return resourceExtensions.includes(extension)
  }
  catch (e) {
    console.warn(`Invalid URL: ${resourceUrl}`, e.message)
    return false
  }
}

export { makeFilename, makeDirName, makeResourceName, isResource }
