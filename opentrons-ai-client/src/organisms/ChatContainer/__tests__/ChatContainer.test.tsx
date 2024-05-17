import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PromptGuide } from '../../../molecules/PromptGuide'
import { ChatFooter } from '../../../molecules/ChatFooter'
import { ChatContainer } from '../index'

vi.mock('../../../molecules/PromptGuide')
vi.mock('../../../molecules/ChatFooter')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ChatContainer />, {
    i18nInstance: i18n,
  })
}

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.mocked(PromptGuide).mockReturnValue(<div>mock PromptGuide</div>)
    vi.mocked(ChatFooter).mockReturnValue(<div>mock ChatFooter</div>)
  })

  it('should render prompt guide and text', () => {
    render()
    screen.getByText('OpentronsAI')
    screen.getByText('mock PromptGuide')
    screen.getByText('mock ChatFooter')
  })
})
