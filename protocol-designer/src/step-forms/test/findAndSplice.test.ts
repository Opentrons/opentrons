import { describe, expect, test } from 'vitest'

import { findAndSplice } from '../utils/findAndSplice'

describe('findAndSplice', () => {
  test('removal and reinsertion ', () => {
    const result = findAndSplice({
      source: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      elementToRemove: 'c',
      elementToInsertAfter: 'e',
      elementsToInsert: ['c', 'c2'],
    })
    expect(result).toStrictEqual({
      success: true,
      result: ['a', 'b', 'd', 'e', 'c', 'c2', 'f', 'g'],
    } satisfies typeof result)
  })
})
