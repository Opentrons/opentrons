import React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { PromptGuide } from '../../../molecules/PromptGuide'
import { ChatContainer } from '../index'

vi.mock('../../../molecules/PromptGuide')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ChatContainer />, {
    i18nInstance: i18n,
  })
}

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.mocked(PromptGuide).mockReturnValue(<div>mock PromptGuide</div>)
  })
  it('should render prompt guide and text', () => {
    render()
    screen.getByText('OpentronsAI')
    screen.getByText('mock PromptGuide')
  })

  // ToDo (kk:04/16/2024) Add more test cases
})
