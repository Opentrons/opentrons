import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { ANALYTICS } from '/ai-client/analytics/constants'
import { feedbackModalAtom } from '/ai-client/resources/atoms'

import { FeedbackModal } from '..'
import { i18n } from '../../../i18n'

const mockUseTrackEvent = vi.fn()
const mockCallApi = vi.fn().mockResolvedValue({})

vi.mock('/ai-client/resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('/ai-client/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('/ai-client/resources/hooks', () => ({
  useApiCall: () => ({
    callApi: mockCallApi,
    error: null,
    isLoading: false,
    data: { success: true },
  }),
}))

const initialValues: Array<[any, any]> = [[feedbackModalAtom, true]]

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<FeedbackModal />, {
    i18nInstance: i18n,
    initialValues,
  })
}

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render Feedback modal', () => {
    render()
    screen.getByText('Send feedback to Opentrons')
    screen.getByText('Share why the response was not helpful')
    screen.getByText('Cancel')
    screen.getByText('Send feedback')
  })

  // should move this test to the chat page
  it.skip('should set the showFeedbackModel atom to be false when cancel button is clicked', () => {
    render()
    expect(feedbackModalAtom.init).toBe(true)

    const cancelButton = screen.getByText('Cancel')
    cancelButton.click()
    // check if the feedbackModalAtom is set to false
    expect(feedbackModalAtom.read).toBe(false)
  })

  it('should track event when feedback is sent', async () => {
    render()
    const feedbackInput = screen.getByRole('textbox')
    fireEvent.change(feedbackInput, {
      target: { value: 'This is a test feedback' },
    })
    const sendFeedbackButton = screen.getByRole('button', {
      name: 'Send feedback',
    })

    fireEvent.click(sendFeedbackButton)

    // First wait for the API call to be made
    await waitFor(() => {
      expect(mockCallApi).toHaveBeenCalled()
    })

    // Then wait for the tracking event to be triggered
    await waitFor(() => {
      expect(mockUseTrackEvent).toHaveBeenCalledWith({
        name: ANALYTICS.FEEDBACK_SENT,
        properties: {
          feedback: 'This is a test feedback',
        },
      })
    })
  })
})
