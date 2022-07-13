import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { getBuildrootUpdateDisplayInfo } from '../../../../../redux/buildroot'
import { useIsRobotBusy } from '../../../hooks'

import { UpdateRobotSoftware } from '../UpdateRobotSoftware'

jest.mock('../../../../../redux/robot-settings/selectors')
jest.mock('../../../../../redux/discovery')
jest.mock('../../../../../redux/buildroot/selectors')
jest.mock('../../../hooks')

const mockUpdateRobotStatus = jest.fn()
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>

const mockOnUpdateStart = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UpdateRobotSoftware
        robotName="otie"
        updateIsRobotBusy={mockUpdateRobotStatus}
        onUpdateStart={mockOnUpdateStart}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UpdateRobotSoftware', () => {
  beforeEach(() => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'update',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockUseIsRobotBusy.mockReturnValue(false)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText }] = render()
    getByText('Update robot software manually with a local file (.zip)')
    getByText(
      'Bypass the Opentrons App auto-update process and update the robot software manually.'
    )
    getByText('Browse file system')
    getByText('Launch Opentrons software update page')
  })

  it('should the link has the correct attribute', () => {
    const [{ getByText }] = render()
    const targetLink = 'https://opentrons.com/ot-app/'
    const link = getByText('Launch Opentrons software update page')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('should be disabled if updateFromFileDisabledReason is not null', () => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'update',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: 'mock reason',
    })
    const [{ getByText }] = render()
    const button = getByText('Browse file system')
    expect(button).toBeDisabled()
  })

  it('should not call update robot status if a robot is busy', () => {
    mockUseIsRobotBusy.mockReturnValue(false)
    const [{ getByText }] = render()
    const button = getByText('Browse file system')
    fireEvent.change(button)
    expect(mockUpdateRobotStatus).not.toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', async () => {
    mockUseIsRobotBusy.mockReturnValue(true)
    const [{ getByText }] = render()
    const button = getByText('Browse file system')
    fireEvent.click(button)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
