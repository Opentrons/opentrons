import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { screen, fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { getConfig, toggleConfigValue } from '../../../redux/config'
import { PreventRobotCaching } from '../PreventRobotCaching'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/config')

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>
const mockToggleConfigValue = toggleConfigValue as jest.MockedFunction<
  typeof toggleConfigValue
>

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
    when(mockGetConfig)
      .calledWith(MOCK_STATE)
      .mockReturnValue(MOCK_STATE.config)
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
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
    expect(mockToggleConfigValue).toHaveBeenCalledWith('discovery.disableCache')
  })
})
