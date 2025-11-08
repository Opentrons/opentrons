import { FormProvider, useForm } from 'react-hook-form'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'

import { ChatDisplay } from '../index'

import type { ComponentProps } from 'react'

const mockUseTrackEvent = vi.fn()

vi.mock('/ai-client/resources/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

vi.mock('/ai-client/hooks/useTrackEvent', () => ({
  useTrackEvent: () => mockUseTrackEvent,
}))

const RenderChatDisplay = (props: ComponentProps<typeof ChatDisplay>) => {
  const methods = useForm({
    defaultValues: {},
  })

  return (
    <FormProvider {...methods}>
      <ChatDisplay {...props} />
    </FormProvider>
  )
}

const render = (props: ComponentProps<typeof ChatDisplay>) => {
  return renderWithProviders(<RenderChatDisplay {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ChatDisplay', () => {
  let props: ComponentProps<typeof ChatDisplay>

  beforeEach(() => {
    props = {
      chat: {
        role: 'assistant',
        reply: 'mock text from the backend',
        requestId: '12351234',
      },
      chatId: 'mockId',
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should display response from the backend and label', () => {
    render(props)
    screen.getByText('OpentronsAI')
    screen.getByText('mock text from the backend')
    // ToDO (kk:04/16/2024) activate the following when jsdom's issue is solved
    // const display = screen.getByTextId('ChatDisplay_from_backend')
    // expect(display).toHaveStyle(`background-color: ${COLORS.grey30}`)
  })
  it('should display input from use and label', () => {
    props = {
      chat: {
        role: 'user',
        reply: 'mock text from user input',
        requestId: '12351234',
      },
      chatId: 'mockId',
    }
    render(props)
    screen.getByText('You')
    screen.getByText('mock text from user input')
    // ToDO (kk:04/16/2024) activate the following when jsdom's issue is solved
    // const display = screen.getByTextId('ChatDisplay_from_user')
    // expect(display).toHaveStyle(`background-color: ${COLORS.blue}`)
  })

  it('should call trackEvent when regenerate button is clicked', () => {
    render(props)
    // eslint-disable-next-line testing-library/no-node-access, @typescript-eslint/non-nullable-type-assertion-style
    const regeneratePath = document.querySelector(
      '[aria-roledescription="reload"]'
    ) as Element
    fireEvent.click(regeneratePath)

    expect(mockUseTrackEvent).toHaveBeenCalledWith({
      name: 'regenerate-protocol',
      properties: {},
    })
  })

  // Note: Download functionality has been moved to individual code blocks in EnhancedMarkdown
  // These tests are removed as the main ChatDisplay no longer has a download button

  it('should call trackEvent when copy button is clicked', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {},
      },
    })

    render(props)
    // eslint-disable-next-line testing-library/no-node-access, @typescript-eslint/non-nullable-type-assertion-style
    const copyPath = document.querySelector(
      '[aria-roledescription="content-copy"]'
    ) as Element
    fireEvent.click(copyPath)

    await waitFor(() => {
      expect(mockUseTrackEvent).toHaveBeenCalledWith({
        name: 'copy-protocol',
        properties: {},
      })
    })
  })

  it('should render markdown content with EnhancedMarkdown', () => {
    const markdownContent =
      '# Protocol\n\nThis is **bold** text with a [link](https://opentrons.com)'
    props.chat.reply = markdownContent
    render(props)

    // Verify markdown is rendered properly
    screen.getByRole('heading', { level: 1, name: 'Protocol' })
    screen.getByText(/This is/)
    screen.getByText(/bold/)
    screen.getByRole('link', { name: 'link' })
  })

  it('should render code blocks with syntax highlighting', () => {
    const codeContent = '```python\ndef transfer():\n    return True\n```'
    props.chat.reply = codeContent
    render(props)

    // Verify code block UI elements are rendered
    screen.getByText('Python')
    screen.getByRole('button', { name: 'Copy code' })
    screen.getByRole('button', { name: 'Download as .py file' })
  })
})
