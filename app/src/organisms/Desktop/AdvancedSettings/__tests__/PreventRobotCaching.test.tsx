import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

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
    screen.getByRole('switch', { name: 'disable_robot_cache' })
  })

  it('should call mock toggleConfigValue when clicking the toggle button', () => {
    render()
    const toggleButton = screen.getByRole('switch', {
      name: 'disable_robot_cache',
    })
    fireEvent.click(toggleButton)
    expect(vi.mocked(toggleConfigValue)).toHaveBeenCalledWith(
      'discovery.disableCache'
    )
  })
})
