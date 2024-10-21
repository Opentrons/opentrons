import { describe, it, vi, expect, afterEach } from 'vitest'
import { trackEvent } from '../../../analytics/mixpanel'
import { useTrackEvent } from '../useTrackEvent'
import { renderHook } from '@testing-library/react'
import { mixpanelAtom } from '../../atoms'
import type { AnalyticsEvent } from '../../../analytics/mixpanel'
import type { Mixpanel } from '../../types'
import { TestProvider } from '../../utils/testUtils'

vi.mock('../../../analytics/mixpanel', () => ({
  trackEvent: vi.fn(),
}))

describe('useTrackEvent', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should call trackEvent with the correct arguments when hasOptedIn is true', () => {
    const mockMixpanelAtom: Mixpanel = {
      analytics: {
        hasOptedIn: true,
      },
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestProvider initialValues={[[mixpanelAtom, mockMixpanelAtom]]}>
        {children}
      </TestProvider>
    )

    const { result } = renderHook(() => useTrackEvent(), { wrapper })

    const event: AnalyticsEvent = { name: 'test_event', properties: {} }
    result.current(event)

    expect(trackEvent).toHaveBeenCalledWith(event, true)
  })

  it('should call trackEvent with the correct arguments when hasOptedIn is false', () => {
    const mockMixpanelAtomFalse: Mixpanel = {
      analytics: {
        hasOptedIn: false,
      },
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TestProvider initialValues={[[mixpanelAtom, mockMixpanelAtomFalse]]}>
        {children}
      </TestProvider>
    )

    const { result } = renderHook(() => useTrackEvent(), { wrapper })

    const event: AnalyticsEvent = { name: 'test_event', properties: {} }
    result.current(event)

    expect(trackEvent).toHaveBeenCalledWith(event, false)
  })
})
