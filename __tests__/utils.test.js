/* eslint-env jest */
import { makeFilename } from '../src/utils.js'

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
