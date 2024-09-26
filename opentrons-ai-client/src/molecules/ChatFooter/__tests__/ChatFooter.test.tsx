import { describe, it, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { InputPrompt } from '../../InputPrompt'
import { ChatFooter } from '../index'

vi.mock('../../InputPrompt')

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
