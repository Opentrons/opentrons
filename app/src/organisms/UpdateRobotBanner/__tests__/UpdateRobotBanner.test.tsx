import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent, screen } from '@testing-library/react'
import { i18n } from '../../../i18n'
import * as Buildroot from '../../../redux/buildroot'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { UpdateRobotBanner } from '..'

jest.mock('../../../redux/buildroot')

const getBuildrootUpdateDisplayInfo = Buildroot.getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof Buildroot.getBuildrootUpdateDisplayInfo
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
      handleLaunchRobotUpdateModal: jest.fn(),
    }
    getBuildrootUpdateDisplayInfo.mockReturnValue({
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
    getByText('A software update is available for this robot.')
    const btn = getByRole('button', { name: 'View update' })
    fireEvent.click(btn)
    expect(props.handleLaunchRobotUpdateModal).toHaveBeenCalled()
  })

  it('should render nothing if update is not available when autoUpdateAction returns reinstall', () => {
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const bannerText = screen.queryByText(
      'A software update is available for this robot.'
    )
    expect(bannerText).toBeNull()
  })

  it('should render nothing if update is not available when autoUpdateAction returns downgrade', () => {
    getBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'downgrade',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    const { getByText } = render(props)
    getByText('A software update is available for this robot.')
  })
})
