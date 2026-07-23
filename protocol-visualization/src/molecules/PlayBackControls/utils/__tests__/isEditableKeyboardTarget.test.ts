import { describe, expect, it } from 'vitest'

import { isEditableKeyboardTarget } from '../isEditableKeyboardTarget'

describe('isEditableKeyboardTarget', () => {
  it('returns false for null and non-elements', () => {
    expect(isEditableKeyboardTarget(null)).toBe(false)
    expect(isEditableKeyboardTarget(document)).toBe(false)
  })

  it('returns true for input, textarea, and select', () => {
    expect(isEditableKeyboardTarget(document.createElement('input'))).toBe(true)
    expect(isEditableKeyboardTarget(document.createElement('textarea'))).toBe(
      true
    )
    expect(isEditableKeyboardTarget(document.createElement('select'))).toBe(
      true
    )
  })

  it('returns true for contenteditable elements', () => {
    const div = document.createElement('div')
    Object.defineProperty(div, 'isContentEditable', {
      value: true,
    })
    expect(isEditableKeyboardTarget(div)).toBe(true)
  })

  it('returns false for ordinary elements', () => {
    expect(isEditableKeyboardTarget(document.createElement('button'))).toBe(
      false
    )
    expect(isEditableKeyboardTarget(document.createElement('div'))).toBe(false)
  })
})
