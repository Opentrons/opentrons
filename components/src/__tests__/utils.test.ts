import { truncateString } from '../utils'

describe('truncateString', () => {
  it('when an input string less than max length, return the original input', () => {
    // Note (kj:05/03/2023) the max length and breakPoints are the same as what we use for the Desktop app
    const str = 'opentrons-dev'
    const result = truncateString(str, 80, 65)
    expect(result).toEqual(str)
  })

  it('when an input string is more than 80 characters, return the truncated string', () => {
    const str = `Lorem Ipsum Is Simply Dummy Text Of The Printing And Typesetting Industry. Lorem Ipsum Has Been The Industry's Standard Dummy Text Ever Since The 1500s, When An Unknown Printer Took A Galley Of Type And Scrambled It To Make A Type Specimen Book.Py`
    const result = truncateString(str, 80, 65)
    const truncatedStr =
      'Lorem Ipsum Is Simply Dummy Text Of The Printing And Typesetting ...imen Book.Py'
    expect(result).toEqual(truncatedStr)
  })

  it('when an input string is more than 80 characters without specifying the break point, return the truncated string', () => {
    const str = `Lorem Ipsum Is Simply Dummy Text Of The Printing And Typesetting Industry. Lorem Ipsum Has Been The Industry's Standard Dummy Text Ever Since The 1500s, When An Unknown Printer Took A Galley Of Type And Scrambled It To Make A Type Specimen Book.Py`
    const result = truncateString(str, 80)
    const truncatedStr =
      'Lorem Ipsum Is Simply Dummy Text Of The Printing And Typesetting Industry. Lo...'
    expect(result).toEqual(truncatedStr)
  })
})
