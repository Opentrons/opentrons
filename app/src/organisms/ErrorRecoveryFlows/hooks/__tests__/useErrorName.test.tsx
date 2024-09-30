import { describe, it } from 'vitest'
import { renderHook, render, screen } from '@testing-library/react'

import { useErrorName } from '../useErrorName'
import { ERROR_KINDS } from '../../constants'

describe('useErrorName', () => {
  const testCases = Object.keys(ERROR_KINDS)

  testCases.forEach(errorKind => {
    it(`returns the correct translation for ${errorKind}`, () => {
      const { result } = renderHook(() => useErrorName(errorKind as any))
      const translatedText = result.current

      render(<div>{translatedText}</div>)

      screen.getByText(translatedText)
    })
  })
})
