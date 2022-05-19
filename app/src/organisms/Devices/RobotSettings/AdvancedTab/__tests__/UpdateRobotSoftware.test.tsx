import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { getBuildrootUpdateDisplayInfo } from '../../../../../redux/buildroot'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { UpdateRobotSoftware } from '../UpdateRobotSoftware'

import type { Sessions } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../redux/robot-settings/selectors')
jest.mock('../../../../../redux/discovery')
jest.mock('../../../../../redux/buildroot/selectors')
jest.mock('../../../../ProtocolUpload/hooks')

const mockUpdateRobotStatus = jest.fn()
const mockGetBuildrootUpdateDisplayInfo = getBuildrootUpdateDisplayInfo as jest.MockedFunction<
  typeof getBuildrootUpdateDisplayInfo
>
const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <UpdateRobotSoftware
        robotName="otie"
        updateIsRobotBusy={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings UpdateRobotSoftware', () => {
  beforeEach(() => {
    mockGetBuildrootUpdateDisplayInfo.mockReturnValue({
      autoUpdateAction: 'reinstall',
      autoUpdateDisabledReason: null,
      updateFromFileDisabledReason: null,
    })
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description and toggle button', () => {
    const [{ getByText, getByLabelText }] = render()
    getByText('Update robot software manually with a local file (.zip)')
    getByText(
      'Bypass the Opentrons App auto-update process and update the robot software manually.'
    )
    getByLabelText('Browse file system')
    getByText('Launch Opentrons software update page')
  })

  it('should the link has the correct attribute', () => {
    mockUseCurrentRunId.mockReturnValue(null)
    const [{ getByText }] = render()
    const targetLink = 'https://opentrons.com/ot-app/'
    const link = getByText('Launch Opentrons software update page')
    expect(link.closest('a')).toHaveAttribute('href', targetLink)
  })

  it('should call robot status if a robot is busy', () => {
    const [{ getByLabelText }] = render()
    const button = getByLabelText('Browse file system')
    fireEvent.change(button)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
