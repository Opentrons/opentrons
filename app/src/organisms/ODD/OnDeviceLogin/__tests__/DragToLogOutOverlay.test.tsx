import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { getIsLoggedInToLocalRobot, useLogout } from '/app/redux/robot-auth'

import { DragToLogOutOverlay } from '../DragToLogOutOverlay'

import type * as ReactRedux from 'react-redux'
import type * as RobotAuth from '/app/redux/robot-auth'

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal<typeof RobotAuth>()
  return {
    ...actual,
    getIsLoggedInToLocalRobot: vi.fn(),
    useLogout: vi.fn(),
  }
})

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()
  return {
    ...actual,
    useSelector: vi.fn((selector: (state: unknown) => unknown) => selector({})),
  }
})

const WINDOW_HEIGHT = 600
const HOLD_DURATION_MS = 800

const render = (): ReturnType<typeof renderWithProviders>[0] =>
  renderWithProviders(<DragToLogOutOverlay />)[0]

/**
 * Dispatch a PointerEvent on `window`. jsdom does not implement PointerEvent,
 * so we build a plain Event and attach the pointer-specific properties.
 */
const dispatchPointerEvent = (
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  props: {
    clientX?: number
    clientY?: number
    pointerId?: number
    isPrimary?: boolean
  } = {}
): void => {
  const { clientX = 0, clientY = 0, pointerId = 1, isPrimary = true } = props
  const event = new Event(type, { bubbles: true }) as Event & {
    clientX: number
    clientY: number
    pointerId: number
    isPrimary: boolean
  }
  event.clientX = clientX
  event.clientY = clientY
  event.pointerId = pointerId
  event.isPrimary = isPrimary
  act(() => {
    window.dispatchEvent(event)
  })
}

/** Advance fake timers inside `act` so effect-synced refs and state flush. */
const advanceTimers = (ms: number): void => {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('DragToLogOutOverlay', () => {
  let mockLogout: () => void
  let mockSetPointerCapture: (pointerId: number) => void
  let mockReleasePointerCapture: (pointerId: number) => void

  beforeEach(() => {
    vi.useFakeTimers()
    mockLogout = vi.fn()
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(true)
    vi.mocked(useLogout).mockReturnValue(mockLogout)

    vi.stubGlobal('innerHeight', WINDOW_HEIGHT)

    // jsdom does not implement pointer capture APIs used by the component.
    mockSetPointerCapture = vi.fn()
    mockReleasePointerCapture = vi.fn()
    Element.prototype.setPointerCapture = mockSetPointerCapture
    Element.prototype.releasePointerCapture = mockReleasePointerCapture
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.resetAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders nothing when the user is not logged in', () => {
    vi.mocked(getIsLoggedInToLocalRobot).mockReturnValue(false)

    const { container } = renderWithProviders(<DragToLogOutOverlay />)[0]

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the overlay when the user is logged in', () => {
    const { container } = renderWithProviders(<DragToLogOutOverlay />)[0]

    // The overlay is a fixed-position div tree (no accessible role), so assert
    // that something rendered rather than the null / empty case.
    expect(container).not.toBeEmptyDOMElement()
  })

  it('does not start a hold when the pointer starts below the hold zone', () => {
    render()

    // clientY beyond the HOLD_ZONE (150) is ignored.
    dispatchPointerEvent('pointerdown', { clientY: 500 })
    advanceTimers(HOLD_DURATION_MS)
    dispatchPointerEvent('pointerup', { clientY: 500 })

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('ignores non-primary pointers', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10, isPrimary: false })
    advanceTimers(HOLD_DURATION_MS)

    // No pointer capture requested because the down handler bailed out.
    expect(mockSetPointerCapture).not.toHaveBeenCalled()
  })

  it('activates after a long press and captures the pointer', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10 })
    advanceTimers(HOLD_DURATION_MS)

    expect(mockSetPointerCapture).toHaveBeenCalled()
  })

  it('cancels the hold if the pointer moves too far before activating', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10 })
    // Move more than MOVE_THRESHOLD (10px) before the hold timer fires.
    dispatchPointerEvent('pointermove', { clientY: 30 })
    advanceTimers(HOLD_DURATION_MS)

    // The hold timer was cleared, so no activation / capture happened.
    expect(mockSetPointerCapture).not.toHaveBeenCalled()
  })

  it('logs out when released past the logout threshold', () => {
    render()

    // Activate via long press.
    dispatchPointerEvent('pointerdown', { clientY: 10 })
    advanceTimers(HOLD_DURATION_MS)

    // Drag down past 75% of the window height and release.
    dispatchPointerEvent('pointermove', {
      clientY: WINDOW_HEIGHT * 0.75 + 50,
    })
    dispatchPointerEvent('pointerup', { clientY: WINDOW_HEIGHT * 0.75 + 50 })

    // Logout is deferred behind a backup timer / transition.
    advanceTimers(3000)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('does not log out when released before the logout threshold', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10 })
    advanceTimers(HOLD_DURATION_MS)

    // Release well before the 75% threshold.
    dispatchPointerEvent('pointermove', { clientY: 100 })
    dispatchPointerEvent('pointerup', { clientY: 100 })

    advanceTimers(3000)

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('does not log out on a plain pointerup without an active long press', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10 })
    // Release before the hold timer fires.
    dispatchPointerEvent('pointerup', { clientY: 900 })

    advanceTimers(3000)

    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('releases the captured pointer on pointerup', () => {
    render()

    dispatchPointerEvent('pointerdown', { clientY: 10 })
    advanceTimers(HOLD_DURATION_MS)
    dispatchPointerEvent('pointerup', { clientY: 100 })

    expect(mockReleasePointerCapture).toHaveBeenCalled()
  })

  it('cleans up window event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderWithProviders(<DragToLogOutOverlay />)[0]
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith(
      'pointercancel',
      expect.any(Function)
    )
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function))

    removeSpy.mockRestore()
  })
})
