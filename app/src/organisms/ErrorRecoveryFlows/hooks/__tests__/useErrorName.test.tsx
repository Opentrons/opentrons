import { render, renderHook, screen } from '@testing-library/react'
import { describe, it } from 'vitest'

import { ERROR_KINDS } from '../../constants'
import { useErrorName } from '../useErrorName'

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
