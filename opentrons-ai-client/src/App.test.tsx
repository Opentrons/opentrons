import { screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

import { renderWithProviders } from './__testing-utils__'
import { i18n } from './i18n'

import { App } from './App'
import { OpentronsAI } from './OpentronsAI'

vi.mock('./OpentronsAI')

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<App />, {
    i18nInstance: i18n,
  })
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(OpentronsAI).mockReturnValue(<div>mock OpentronsAI</div>)
  })

  it('should render OpentronsAI', () => {
    render()
    expect(screen.getByText('mock OpentronsAI')).toBeInTheDocument()
  })
})
