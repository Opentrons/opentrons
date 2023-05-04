import { i18n } from '../../../../../i18n'
import { DisplayRobotName } from '../DisplayRobotName'
import { renderWithProviders } from '@opentrons/components'
import { fireEvent } from '@testing-library/react'
import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'

const mockUpdateIsEXpanded = jest.fn()
const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <DisplayRobotName
        robotName="otie"
        updateIsExpanded={mockUpdateIsEXpanded}
        isRobotBusy={isRobotBusy}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DisplayRobotName', () => {
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
    const [{ getByRole }] = render(true)
    const button = getByRole('button', { name: 'Rename robot' })
    expect(button).toBeDisabled()
  })
})
