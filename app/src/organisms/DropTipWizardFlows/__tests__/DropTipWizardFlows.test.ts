import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useDropTipWizardFlows } from '..'

vi.mock('../DropTipWizard')
vi.mock('../hooks')

describe('useDropTipWizardFlows', () => {
  it('should toggle showDTWiz state', () => {
    const { result } = renderHook(() => useDropTipWizardFlows())

    expect(result.current.showDTWiz).toBe(false)

    act(() => {
      result.current.toggleDTWiz()
    })

    expect(result.current.showDTWiz).toBe(true)
  })
})
