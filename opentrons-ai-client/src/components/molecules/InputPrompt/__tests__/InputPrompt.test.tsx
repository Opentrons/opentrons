import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { InputPrompt } from '../index'

import type { ReactNode } from 'react'

const mockTrackEvent = vi.fn()
const mockCallApi = vi.fn().mockResolvedValue(undefined)

vi.mock('/ai-client/resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockTrackEvent,
}))

vi.mock('/ai-client/resources/hooks/useApiCall', () => ({
  useApiCall: () => ({
    data: null,
    error: null,
    isLoading: false,
    callApi: mockCallApi,
  }),
}))

const WrappingForm = (wrappedComponent: {
  children: ReactNode
}): JSX.Element => {
  const methods = useForm({
    defaultValues: {
      userPrompt: '',
    },
  })
  // eslint-disable-next-line testing-library/no-node-access
  return <FormProvider {...methods}>{wrappedComponent.children}</FormProvider>
}

const render = () => {
  return renderWithProviders(
    <WrappingForm>
      <InputPrompt />
    </WrappingForm>,
    { i18nInstance: i18n }
  )
}

describe('InputPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render textarea and disabled button', () => {
    render()
    screen.getByRole('textbox')
    screen.queryByPlaceholderText('Type your prompt...')
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()
  })

  it('should make send button not disabled when a user inputs something in textarea', () => {
    render()
    const textbox = screen.getByRole('textbox')
    fireEvent.change(textbox, { target: { value: ['test'] } })
    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).not.toBeDisabled()
  })

  // ToDo (kk:04/19/2024) add more test cases

  it('should track event when send button is clicked', async () => {
    render()
    const textbox = screen.getByRole('textbox')
    // Ensure the textbox change updates the state and enables the button
    fireEvent.change(textbox, { target: { value: 'test' } })

    // Add a small wait to ensure state updates propagate
    await waitFor(() => {
      const sendButton = screen.getByRole('button', { name: 'Send' })
      expect(sendButton).not.toBeDisabled()
    })

    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).not.toBeDisabled() // Double check before clicking
    fireEvent.click(sendButton)

    // Wait for callApi to be called first, since that happens before trackEvent
    await waitFor(() => {
      expect(mockCallApi).toHaveBeenCalled()
    })

    // Then check if trackEvent was called with the expected arguments
    expect(mockTrackEvent).toHaveBeenCalledWith({
      name: 'chat-submitted',
      properties: {
        chat: 'test',
        protocol_format: 'Python',
      },
    })
  })
})
