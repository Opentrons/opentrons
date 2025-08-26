import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { InputPrompt } from '/ai-client/components/molecules/InputPrompt'
import { i18n } from '/ai-client/i18n'

import { ChatFooter } from '../index'

vi.mock('/ai-client/components/molecules/InputPrompt')

const render = () => {
  return renderWithProviders(<ChatFooter />, { i18nInstance: i18n })
}

describe('ChatFooter', () => {
  beforeEach(() => {
    vi.mocked(InputPrompt).mockReturnValue(<div>mock InputPrompt</div>)
  })

  it('should render mock InputPrompt component', () => {
    render()
    screen.getByText('mock InputPrompt')
  })

  it('should render disclaimer text', () => {
    render()
    screen.getByText(
      'OpentronsAI can make mistakes. Review your protocol before running it on an Opentrons robot.'
    )
  })
})
