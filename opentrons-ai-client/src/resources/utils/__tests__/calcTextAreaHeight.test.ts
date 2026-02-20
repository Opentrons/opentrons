import { describe, expect, it } from 'vitest'

import { calcTextAreaHeight } from '../calcTextAreaHeight'

describe('calcTextAreaHeight', () => {
  it('should return the correct number of lines', () => {
    const input = 'Hello\nWorld\nThis is testing data.'
    const expectedOutput = 3
    const result = calcTextAreaHeight(input)
    expect(result).toEqual(expectedOutput)
  })
})
