import { describe, expect, test } from 'vitest'

import { findAndSplice } from '../utils/findAndSplice'

describe('findAndSplice', () => {
  test('insertion point after removal point', () => {
    const result = findAndSplice({
      source: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      elementToRemove: 'c',
      elementToInsertAfter: 'e',
      elementsToInsert: ['inserted-1', 'inserted-2'],
    })
    expect(result).toStrictEqual({
      success: true,
      result: ['a', 'b', 'd', 'e', 'inserted-1', 'inserted-2', 'f', 'g'],
    } satisfies typeof result)
  })

  test('removal point after insertion point', () => {
    const result = findAndSplice({
      source: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      elementToRemove: 'e',
      elementToInsertAfter: 'c',
      elementsToInsert: ['inserted-1', 'inserted-2'],
    })
    expect(result).toStrictEqual({
      success: true,
      result: ['a', 'b', 'c', 'inserted-1', 'inserted-2', 'd', 'f', 'g'],
    } satisfies typeof result)
  });

  test('insertion point not found', () => {
    const result = findAndSplice({
      source: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      elementToRemove: 'z',
      elementToInsertAfter: 'a',
      elementsToInsert: ['inserted-1', 'inserted-2'],
    })
    expect(result).toStrictEqual({
      success: false,
      result: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    } satisfies typeof result)
  });

  test('removal point not found', () => {
    const result = findAndSplice({
      source: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      elementToRemove: 'a',
      elementToInsertAfter: 'z',
      elementsToInsert: ['inserted-1', 'inserted-2'],
    })
    expect(result).toStrictEqual({
      success: false,
      result: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    } satisfies typeof result)
  });
})
