import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PromptGuide } from '../../../molecules/PromptGuide'
import { ChatFooter } from '../../../molecules/ChatFooter'
import { MainContentContainer } from '../index'

vi.mock('../../../molecules/PromptGuide')
vi.mock('../../../molecules/ChatFooter')
// Note (kk:05/20/2024) to avoid TypeError: scrollRef.current.scrollIntoView is not a function
window.HTMLElement.prototype.scrollIntoView = vi.fn()

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<MainContentContainer />, {
    i18nInstance: i18n,
  })
}

describe('MainContentContainer', () => {
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
