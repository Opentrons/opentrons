import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { RobotStorage } from '../RobotStorage'

import type { ComponentProps } from 'react'
import type { RobotServerAccessControlSettingsData } from '@opentrons/api-client'

const MOCK_ROBOT_SERVER_SETTINGS: RobotServerAccessControlSettingsData = {
  requireSignoffForProtocolLog: false,
  requireLogsToBeSavedInApp: false,
  deleteOverMaxOnDiskProtocols: true,
}

const render = (props: ComponentProps<typeof RobotStorage>): void => {
  renderWithProviders(<RobotStorage {...props} />, {
    i18nInstance: i18n,
  })
}

describe('RobotStorage', () => {
  let props: ComponentProps<typeof RobotStorage>

  beforeEach(() => {
    props = {
      robotServerSettings: MOCK_ROBOT_SERVER_SETTINGS,
      patchRobotServerSettings: vi.fn(),
      onClickBack: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the storage toggle', () => {
    render(props)

    screen.getByText('Robot storage')
    screen.getByText(
      'Automatically delete the oldest protocol run record when the robot reaches the maximum of 20 saved records'
    )
    screen.getByText('On')
  })

  it('calls onClickBack', () => {
    render(props)

    fireEvent.click(screen.getByTestId('ChildNavigation_Back_Button'))
    expect(props.onClickBack).toHaveBeenCalled()
  })

  it('patches inverted storage setting on click', () => {
    render(props)

    fireEvent.click(
      screen.getByText(
        'Automatically delete the oldest protocol run record when the robot reaches the maximum of 20 saved records'
      )
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      deleteOverMaxOnDiskProtocols: false,
    })
  })

  it('treats a missing storage setting key as off and toggles it on', () => {
    props.robotServerSettings = {}
    render(props)

    screen.getByText('Off')
    fireEvent.click(
      screen.getByText(
        'Automatically delete the oldest protocol run record when the robot reaches the maximum of 20 saved records'
      )
    )
    expect(props.patchRobotServerSettings).toHaveBeenCalledWith({
      deleteOverMaxOnDiskProtocols: true,
    })
  })
})
