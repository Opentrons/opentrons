import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import head from 'lodash/head'

import { getInitialRouteAndStep, useDropTipRouting } from '../useDropTipRouting'
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

describe('useExternalMapUpdates', () => {
  it('should call trackCurrentMap when the drop tip flow map updates', async () => {
    const mockTrackCurrentMap = vi.fn()

    const mockFixitUtils = {
      trackCurrentMap: mockTrackCurrentMap,
    } as any

    const { result } = renderHook(() => useDropTipRouting(mockFixitUtils))

    await act(async () => {
      await result.current.proceedToRoute(DT_ROUTES.BLOWOUT)
    })

    expect(mockTrackCurrentMap).toHaveBeenCalledWith({
      currentRoute: DT_ROUTES.BLOWOUT,
      currentStep: expect.any(String),
    })

    await act(async () => {
      await result.current.proceed()
    })

    expect(mockTrackCurrentMap).toHaveBeenCalledWith({
      currentRoute: DT_ROUTES.BLOWOUT,
      currentStep: expect.any(String),
    })
  })
})

describe('getInitialRouteAndStep', () => {
  it('should return the default initial route and step when fixitUtils is not provided', () => {
    const [initialRoute, initialStep] = getInitialRouteAndStep()

    expect(initialRoute).toBe(DT_ROUTES.BEFORE_BEGINNING)
    expect(initialStep).toBe(DT_ROUTES.BEFORE_BEGINNING[0])
  })

  it('should return the default initial route and step when fixitUtils.routeOverride is not provided', () => {
    const fixitUtils = {
      routeOverride: undefined,
    } as any

    const [initialRoute, initialStep] = getInitialRouteAndStep(fixitUtils)

    expect(initialRoute).toBe(DT_ROUTES.BEFORE_BEGINNING)
    expect(initialStep).toBe(DT_ROUTES.BEFORE_BEGINNING[0])
  })

  it('should return the overridden route and step when fixitUtils.routeOverride is provided', () => {
    const fixitUtils = {
      routeOverride: DT_ROUTES.DROP_TIP,
    } as any

    const [initialRoute, initialStep] = getInitialRouteAndStep(fixitUtils)

    expect(initialRoute).toBe(DT_ROUTES.DROP_TIP)
    expect(initialStep).toBe(DT_ROUTES.DROP_TIP[0])
  })
})
