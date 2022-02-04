import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import { mockConnectableRobot } from '../../../../redux/discovery/__fixtures__'
import { mockFetchModulesSuccessActionPayloadModules } from '../../../../redux/modules/__fixtures__'
import {
  useAttachedModules,
  useRobot,
} from '../../../../organisms/Devices/hooks'
import { PipettesAndModules } from '../../../../organisms/Devices/PipettesAndModules'
import { RobotOverview } from '../../../../organisms/Devices/RobotOverview'
import { DeviceDetails } from '..'

jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../organisms/Devices/PipettesAndModules')
jest.mock('../../../../organisms/Devices/RobotOverview')

const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockRobotOverview = RobotOverview as jest.MockedFunction<
  typeof RobotOverview
>
const mockPipettesAndModules = PipettesAndModules as jest.MockedFunction<
  typeof PipettesAndModules
>

const render = (path = '/') => {
  return renderWithProviders(
    <MemoryRouter initialEntries={[path]} initialIndex={0}>
      <DeviceDetails />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('DeviceDetails', () => {
  beforeEach(() => {
    mockUseAttachedModules.mockReturnValue(
      mockFetchModulesSuccessActionPayloadModules
    )
    mockUseRobot.mockReturnValue(null)
    mockRobotOverview.mockReturnValue(<div>Mock RobotOverview</div>)
    mockPipettesAndModules.mockReturnValue(<div>Mock PipettesAndModules</div>)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('does not render a RobotOverview when a robot is not found', () => {
    const [{ queryByText }] = render('/devices/otie')

    expect(queryByText('Mock RobotOverview')).toBeFalsy()
  })

  it('renders a RobotOverview when a robot is found', () => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock RobotOverview')
  })

  it('renders PipettesAndModules when a robot is found', () => {
    mockUseRobot.mockReturnValue(mockConnectableRobot)
    const [{ getByText }] = render('/devices/otie')

    getByText('Mock PipettesAndModules')
  })
})
