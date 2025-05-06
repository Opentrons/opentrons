import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TestProvider } from '../../../__testing-utils__'
import { trackEvent } from '../../../analytics/mixpanel'
import { mixpanelAtom } from '../../atoms'
import { useTrackEvent } from '../useTrackEvent'

import type { ReactNode } from 'react'
import type { AnalyticsEvent } from '../../../analytics/mixpanel'
import type { Mixpanel } from '../../types'

vi.mock('../../../analytics/mixpanel', () => ({
  trackEvent: vi.fn(),
}))

const mockMixpanelAtom: Mixpanel = {
  analytics: {
    hasOptedIn: true,
  },
  isInitialized: false,
}

const wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <TestProvider initialValues={[[mixpanelAtom, mockMixpanelAtom]]}>
      {children}
    </TestProvider>
  )
}

describe('useTrackEvent', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should call trackEvent with the correct arguments when hasOptedIn is true', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
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
    mockMixpanelAtom.analytics.hasOptedIn = false

    const { result } = renderHook(() => useTrackEvent(), { wrapper })

    const event: AnalyticsEvent = { name: 'test_event', properties: {} }
    result.current(event)

    expect(trackEvent).toHaveBeenCalledWith(event, false)
  })
})
