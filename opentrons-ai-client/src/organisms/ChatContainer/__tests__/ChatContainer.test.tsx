import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PromptGuide } from '../../../molecules/PromptGuide'
import { InputPrompt } from '../../../molecules/InputPrompt'
import { ChatContainer } from '../index'

vi.mock('../../../molecules/PromptGuide')
vi.mock('../../../molecules/InputPrompt')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ChatContainer />, {
    i18nInstance: i18n,
  })
}

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.mocked(PromptGuide).mockReturnValue(<div>mock PromptGuide</div>)
    vi.mocked(InputPrompt).mockReturnValue(<div>mock InputPrompt</div>)
  })
  it('should render prompt guide and text', () => {
    render()
    screen.getByText('OpentronsAI')
    screen.getByText('mock PromptGuide')
    screen.getByText('mock InputPrompt')
    screen.getByText(
      'OpentronsAI can make mistakes. Review your protocol before running it on an Opentrons robot.'
    )
  })

  // ToDo (kk:04/16/2024) Add more test cases
})
