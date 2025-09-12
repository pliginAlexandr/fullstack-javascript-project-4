import { jest } from '@jest/globals'
import { makeFilename, isResource } from '../src/utils.js'

describe('makeFilename', () => {
  test('name generator runs correct', () => {
    expect(makeFilename('https://ru.hexlet.io/courses'))
      .toBe('ru-hexlet-io-courses.html')

    expect(makeFilename('http://example.com/about'))
      .toBe('example-com-about.html')

    expect(makeFilename('https://my.site.com/some/path/'))
      .toBe('my-site-com-some-path.html')
  })

  test('name generator runs url without pathname', () => {
    expect(makeFilename('https://example.com'))
      .toBe('example-com.html')
  })
})

describe('isResource', () => {
  const baseUrl = 'https://example.com/page.html'

  test('returns false for same URL as base', () => {
    const result = isResource('https://example.com/page.html', baseUrl)
    expect(result).toBe(false)
  })

  test('returns true for different URL with resource extension', () => {
    const result = isResource('https://example.com/styles.css', baseUrl)
    expect(result).toBe(true)
  })

  test('returns true for relative URL with resource extension', () => {
    const result = isResource('/images/logo.png', baseUrl)
    expect(result).toBe(true)
  })
})

describe('isResource - error handling', () => {
  const baseUrl = 'https://example.com/page.html'

  test('handles completely malformed URLs', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    const result = isResource('http://', baseUrl)

    expect(result).toBe(false)
    expect(consoleWarnSpy).toHaveBeenCalled()

    consoleWarnSpy.mockRestore()
  })
})
