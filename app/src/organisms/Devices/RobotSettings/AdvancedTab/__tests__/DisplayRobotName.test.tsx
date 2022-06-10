import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { useIsRobotBusy } from '../../../hooks'

import { DisplayRobotName } from '../DisplayRobotName'

const mockUpdateIsEXpanded = jest.fn()
const mockUpdateIsRobotBusy = jest.fn()
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>

jest.mock('../../../hooks')

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
    mockUseIsRobotBusy.mockReturnValue(false)
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
    mockUseIsRobotBusy.mockReturnValue(true)
    const [{ getByRole }] = render()
    const button = getByRole('button', { name: 'Rename robot' })
    fireEvent.click(button)
    expect(mockUpdateIsRobotBusy).toHaveBeenCalled()
  })
})
