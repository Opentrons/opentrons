import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { InputPrompt } from '../index'

import type { ReactNode } from 'react'

const mockSubmitChat = vi.fn()
const mockHandleFileSelect = vi.fn()
const mockHandleRemoveFile = vi.fn()

vi.mock('/ai-client/resources/hooks', async () => {
  const actual = await vi.importActual<object>('/ai-client/resources/hooks')
  return {
    ...actual,
    useInputPromptController: vi.fn(() => ({
      submitChat: mockSubmitChat,
      isLoading: false,
      errorMessage: null,
      attachedFiles: [],
      handleFileSelect: mockHandleFileSelect,
      handleRemoveFile: mockHandleRemoveFile,
    })),
  }
})

const WrappingForm = ({ children }: { children: ReactNode }): JSX.Element => {
  const methods = useForm({
    defaultValues: {
      userPrompt: '',
    },
  })

  return <FormProvider {...methods}>{children}</FormProvider>
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

  it('should render textarea and disabled send button initially', () => {
    render()
    screen.getByRole('textbox')
    screen.getByRole('button', { name: 'Send' })
  })

  it('should enable send button when user types in textarea', () => {
    render()
    const textbox = screen.getByRole('textbox')
    fireEvent.change(textbox, { target: { value: 'test' } })
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled()
  })

  it('should call submitChat when send button is clicked', () => {
    render()
    const textbox = screen.getByRole('textbox')
    fireEvent.change(textbox, { target: { value: 'test' } })

    const sendButton = screen.getByRole('button', { name: 'Send' })
    fireEvent.click(sendButton)

    expect(mockSubmitChat).toHaveBeenCalledTimes(1)
  })

  it('should show error message when errorMessage is provided', async () => {
    const { useInputPromptController } =
      await import('/ai-client/resources/hooks')
    ;(useInputPromptController as any).mockImplementation(() => ({
      submitChat: mockSubmitChat,
      isLoading: false,
      errorMessage: 'Something went wrong',
      attachedFiles: [],
      handleFileSelect: mockHandleFileSelect,
      handleRemoveFile: mockHandleRemoveFile,
    }))

    render()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should render attached files when provided by controller', async () => {
    const { useInputPromptController } =
      await import('/ai-client/resources/hooks')
    ;(useInputPromptController as any).mockImplementation(() => ({
      submitChat: mockSubmitChat,
      isLoading: false,
      errorMessage: null,
      attachedFiles: [
        new File(['hello'], 'example.txt', { type: 'text/plain' }),
      ],
      handleFileSelect: mockHandleFileSelect,
      handleRemoveFile: mockHandleRemoveFile,
    }))

    render()
    expect(screen.getByText('example.txt')).toBeInTheDocument()
  })

  it('should disable attach button when loading', async () => {
    const { useInputPromptController } =
      await import('/ai-client/resources/hooks')
    ;(useInputPromptController as any).mockImplementation(() => ({
      submitChat: mockSubmitChat,
      isLoading: true,
      errorMessage: null,
      attachedFiles: [],
      handleFileSelect: mockHandleFileSelect,
      handleRemoveFile: mockHandleRemoveFile,
    }))

    render()
    const attachButton = screen.getByRole('button', { name: /attach/i })
    expect(attachButton).toBeDisabled()
  })
})
