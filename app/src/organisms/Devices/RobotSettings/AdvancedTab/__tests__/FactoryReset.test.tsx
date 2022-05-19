import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { FactoryReset } from '../FactoryReset'

import type { Sessions } from '@opentrons/api-client'

const mockUpdateIsEXpanded = jest.fn()
const mockUpdateRobotStatus = jest.fn()

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../ProtocolUpload/hooks')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>
const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <FactoryReset
        updateIsExpanded={mockUpdateIsEXpanded}
        updateIsRobotBusy={mockUpdateRobotStatus}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings FactoryReset', () => {
  beforeEach(() => {
    mockUseCurrentRunId.mockReturnValue('123')
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and butoon', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Factory reset')
    getByText(
      'Reset labware calibration, boot scripts, and/or robot calibration to factory settings.'
    )
    expect(
      getByRole('button', { name: 'Choose reset settings' })
    ).toBeInTheDocument()
  })

  it('should render a slideout when clicking the button', () => {
    mockUseCurrentRunId.mockReturnValue(null)
    const [{ getByRole }] = render()
    const factoryResetChooseButton = getByRole('button', {
      name: 'Choose reset settings',
    })
    fireEvent.click(factoryResetChooseButton)
    expect(mockUpdateIsEXpanded).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', {
      name: 'Choose reset settings',
    })
    fireEvent.click(button)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
