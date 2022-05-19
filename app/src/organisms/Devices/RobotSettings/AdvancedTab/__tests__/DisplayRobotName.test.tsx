import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { UseQueryResult } from 'react-query'

import { renderWithProviders } from '@opentrons/components'
import { useAllSessionsQuery } from '@opentrons/react-api-client'

import { i18n } from '../../../../../i18n'
import { useCurrentRunId } from '../../../../ProtocolUpload/hooks'

import { DisplayRobotName } from '../DisplayRobotName'

import type { Sessions } from '@opentrons/api-client'

const mockUpdateIsEXpanded = jest.fn()
const mockUpdateIsRobotBusy = jest.fn()

const mockUseAllSessionsQuery = useAllSessionsQuery as jest.MockedFunction<
  typeof useAllSessionsQuery
>

jest.mock('../../../../ProtocolUpload/hooks')
jest.mock('@opentrons/react-api-client')

const mockUseCurrentRunId = useCurrentRunId as jest.MockedFunction<
  typeof useCurrentRunId
>

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <DisplayRobotName
        robotName="otie"
        updateIsExpanded={mockUpdateIsEXpanded}
        updateIsRobotBusy={mockUpdateIsRobotBusy}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisplayRobotName', () => {
  beforeEach(() => {
    mockUseCurrentRunId.mockReturnValue(null)
    mockUseAllSessionsQuery.mockReturnValue({
      data: {},
    } as UseQueryResult<Sessions, Error>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and butoon', () => {
    const [{ getByText, getByRole }] = render()
    getByText('About')
    getByText('Robot Name')
    getByText('otie')
    getByRole('button', { name: 'Rename robot' })
  })

  it('should render a slideout when clicking the button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Rename robot' })
    fireEvent.click(button)
    expect(mockUpdateIsEXpanded).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', () => {
    mockUseCurrentRunId.mockReturnValue('runId')
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Rename robot' })
    fireEvent.click(button)
    expect(mockUpdateIsRobotBusy).toHaveBeenCalled()
  })
})
