import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from './__testing-utils__'
import { App } from './App'
import { i18n } from './i18n'
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
