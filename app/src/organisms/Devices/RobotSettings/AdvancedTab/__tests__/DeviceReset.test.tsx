import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../../i18n'

import { DeviceReset } from '../DeviceReset'

const mockUpdateIsEXpanded = jest.fn()

jest.mock('../../../../ProtocolUpload/hooks')

const render = (isRobotBusy = false) => {
  return renderWithProviders(
    <MemoryRouter>
      <DeviceReset
        updateIsExpanded={mockUpdateIsEXpanded}
        isRobotBusy={isRobotBusy}
      />
    </MemoryRouter>,
    { i18nInstance: i18n }
  )
}

describe('RobotSettings DeviceReset', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render title, description, and butoon', () => {
    const [{ getByText, getByRole }] = render()
    getByText('Device Reset')
    getByText(
      'Reset labware calibration, boot scripts, and/or robot calibration to factory settings.'
    )
    expect(
      getByRole('button', { name: 'Choose reset settings' })
    ).toBeInTheDocument()
  })

  it('should render a slideout when clicking the button', () => {
    const [{ getByRole }] = render()
    const button = getByRole('button', {
      name: 'Choose reset settings',
    })
    fireEvent.click(button)
    expect(mockUpdateIsEXpanded).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy', () => {
    const [{ getByRole }] = render(true)
    const button = getByRole('button', {
      name: 'Choose reset settings',
    })
    expect(button).toBeDisabled()
  })
})
