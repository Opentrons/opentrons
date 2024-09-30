import { when } from 'vitest-when'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { getConfig, toggleConfigValue } from '/app/redux/config'
import { PreventRobotCaching } from '../PreventRobotCaching'

import type { State } from '/app/redux/types'

vi.mock('/app/redux/config')

const MOCK_STATE: State = {
  config: {
    discovery: {
      disableCache: false,
    },
  },
} as any

const render = () => {
  return renderWithProviders(<PreventRobotCaching />, {
    i18nInstance: i18n,
  })
}

describe('PreventRobotCaching', () => {
  beforeEach(() => {
    when(getConfig).calledWith(MOCK_STATE).thenReturn(MOCK_STATE.config)
  })

  it('should render text and toggle button', () => {
    render()
    screen.getByText('Prevent Robot Caching')
    screen.queryByText(
      'The app will immediately clear unavailable robots and will not remember unavailable robots while this is enabled. On networks with many robots, preventing caching may improve network performance at the expense of slower and less reliable robot discovery on app launch.'
    )
    screen.getByRole('switch', { name: 'display_unavailable_robots' })
  })

  it('should call mock toggleConfigValue when clicking the toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'display_unavailable_robots',
    })
    fireEvent.click(toggleButton)
    expect(vi.mocked(toggleConfigValue)).toHaveBeenCalledWith(
      'discovery.disableCache'
    )
  })
})
