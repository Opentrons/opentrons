import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import head from 'lodash/head'

import { useDropTipRouting } from '../useDropTipRouting'
import { DT_ROUTES } from '../../constants'

describe('useDropTipRouting', () => {
  it('should initialize with the correct default values', () => {
    const { result } = renderHook(() => useDropTipRouting())

    expect(result.current.currentRoute).toBe(DT_ROUTES.BEFORE_BEGINNING)
    expect(result.current.currentStep).toBe(head(DT_ROUTES.BEFORE_BEGINNING))
    expect(result.current.currentStepIdx).toBe(0)
  })

  it('should move to the next step when proceed is called', async () => {
    const { result } = renderHook(() => useDropTipRouting())

    await act(async () => {
      await result.current.proceedToRoute(DT_ROUTES.BLOWOUT)
    })

    const initialStep = result.current.currentStep

    await act(async () => {
      await result.current.proceed()
    })
    expect(result.current.currentStep).not.toBe(initialStep)
    expect(result.current.currentStepIdx).toBe(1)
  })

  it('should move to the previous step when goBack is called', async () => {
    const { result } = renderHook(() => useDropTipRouting())

    await act(async () => {
      await result.current.proceedToRoute(DT_ROUTES.BLOWOUT)
    })

    await act(async () => {
      await result.current.proceed()
    })

    const initialStep = result.current.currentStep

    await act(async () => {
      await result.current.goBack()
    })
    expect(result.current.currentStep).not.toBe(initialStep)
    expect(result.current.currentStepIdx).toBe(0)
  })

  it('should reset to the first step of the BEFORE_BEGINNING route when proceeding from the last step', async () => {
    const { result } = renderHook(() => useDropTipRouting())

    await act(async () => {
      await result.current.proceed()
    })
    await act(async () => {
      await result.current.proceed()
    })
    expect(result.current.currentRoute).toBe(DT_ROUTES.BEFORE_BEGINNING)
    expect(result.current.currentStep).toBe(head(DT_ROUTES.BEFORE_BEGINNING))
    expect(result.current.currentStepIdx).toBe(0)
  })

  it('should reset to the first step of the BEFORE_BEGINNING route when going back from the first step', async () => {
    const { result } = renderHook(() => useDropTipRouting())

    await act(async () => {
      await result.current.goBack()
    })
    expect(result.current.currentRoute).toBe(DT_ROUTES.BEFORE_BEGINNING)
    expect(result.current.currentStep).toBe(head(DT_ROUTES.BEFORE_BEGINNING))
    expect(result.current.currentStepIdx).toBe(0)
  })

  it('should proceed to the specified route when proceedToRoute is called', async () => {
    const { result } = renderHook(() => useDropTipRouting())

    await act(async () => {
      await result.current.proceedToRoute(DT_ROUTES.BLOWOUT)
    })
    expect(result.current.currentRoute).toBe(DT_ROUTES.BLOWOUT)
    expect(result.current.currentStep).toBe(head(DT_ROUTES.BLOWOUT))
    expect(result.current.currentStepIdx).toBe(0)
  })
})
