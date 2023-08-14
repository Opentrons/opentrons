import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import * as Buildroot from '../../../redux/robot-update'
import {
  mockConnectableRobot,
  mockReachableRobot,
} from '../../../redux/discovery/__fixtures__'
import { UpdateBuildroot } from '../../Devices/RobotSettings/UpdateBuildroot'
import { UpdateRobotBanner } from '..'

jest.mock('../../../redux/robot-update')
jest.mock('../../Devices/RobotSettings/UpdateBuildroot')

const getRobotUpdateDisplayInfo = Buildroot.getRobotUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getRobotUpdateDisplayInfo
>
const mockUpdateBuildroot = UpdateBuildroot as jest.MockedFunction<
  typeof UpdateBuildroot
>
const render = (props: React.ComponentProps<typeof UpdateRobotBanner>) => {
  return renderWithProviders(<UpdateRobotBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UpdateRobotBanner', () => {
  let props: React.ComponentProps<typeof UpdateRobotBanner>

  beforeEach(() => {
    props = {
      robot: mockConnectableRobot,
    }
    mockUpdateBuildroot.mockReturnValue(<div>mockUpdateBuildroot</div>)
    getRobotUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'upgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should display correct information', () => {
    const { getByText, getByRole } = render(props)
    getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    const btn = getByRole('button', { name: 'View update' })
    fireEvent.click(btn)
    getByText('mockUpdateBuildroot')
  })

  it('should render nothing if update is not available when autoUpdateAction returns reinstall', () => {
    getRobotUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const bannerText = screen.queryByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    expect(bannerText).toBeNull()
  })

  it('should render nothing if update is not available when autoUpdateAction returns downgrade', () => {
    getRobotUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'downgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const { getByText } = render(props)
    getByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
  })

  it('should render nothing if robot health status is not ok', () => {
    props = {
      robot: mockReachableRobot,
    }
    const bannerText = screen.queryByText(
      'A robot software update is required to run protocols with this version of the Opentrons App.'
    )
    expect(bannerText).toBeNull()
  })
})
