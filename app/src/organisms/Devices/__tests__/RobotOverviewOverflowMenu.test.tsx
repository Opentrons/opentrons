import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import { i18n } from '../../../i18n'
import { home } from '../../../redux/robot-controls'
import { restartRobot } from '../../../redux/robot-admin'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { useCurrentRunStatus } from '../../RunTimeControl/hooks'
import { RobotOverviewOverflowMenu } from '../RobotOverviewOverflowMenu'

jest.mock('../../RunTimeControl/hooks')
jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/robot-admin')

const mockUseCurrentRunStatus = useCurrentRunStatus as jest.MockedFunction<
  typeof useCurrentRunStatus
>
const mockHome = home as jest.MockedFunction<typeof home>
const mockRestartRobot = restartRobot as jest.MockedFunction<
  typeof restartRobot
>

const render = (
  props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
) => {
  return renderWithProviders(
    <MemoryRouter>
      <RobotOverviewOverflowMenu {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('RobotOverviewOverflowMenu', () => {
  let props: React.ComponentProps<typeof RobotOverviewOverflowMenu>
  beforeEach(() => {
    props = { robot: mockConnectableRobot }
    when(mockUseCurrentRunStatus).calledWith().mockReturnValue(RUN_STATUS_IDLE)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should render enabled buttons in the menu when the status is idle', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const updateRobotSoftwareBtn = getByRole('button', {
      name: 'Update robot software',
    })
    const restartBtn = getByRole('button', { name: 'restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })
    const settingsBtn = getByRole('link', { name: 'robot settings' })

    expect(updateRobotSoftwareBtn).toBeEnabled()
    expect(restartBtn).toBeEnabled()
    expect(homeBtn).toBeEnabled()
    expect(settingsBtn).toBeEnabled()
  })

  it('should render disabled buttons in the menu when the run status is running', () => {
    when(mockUseCurrentRunStatus)
      .calledWith()
      .mockReturnValue(RUN_STATUS_RUNNING)

    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const updateRobotSoftwareBtn = getByRole('button', {
      name: 'Update robot software',
    })
    const restartBtn = getByRole('button', { name: 'restart robot' })
    const homeBtn = getByRole('button', { name: 'Home gantry' })

    expect(updateRobotSoftwareBtn).toBeDisabled()
    expect(restartBtn).toBeDisabled()
    expect(homeBtn).toBeDisabled()
  })

  it('clicking home gantry should home the gantry', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const homeBtn = getByRole('button', { name: 'Home gantry' })
    fireEvent.click(homeBtn)

    expect(mockHome).toBeCalled()
  })

  it('clicking the restart robot button should restart the robot', () => {
    const { getByRole } = render(props)

    const btn = getByRole('button')
    fireEvent.click(btn)

    const restartBtn = getByRole('button', { name: 'restart robot' })
    fireEvent.click(restartBtn)

    expect(mockRestartRobot).toBeCalled()
  })
})
