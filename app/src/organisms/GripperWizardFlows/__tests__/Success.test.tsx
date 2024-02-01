import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { Success } from '../Success'
import {
  SECTIONS,
  SUCCESSFULLY_ATTACHED,
  SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
  SUCCESSFULLY_CALIBRATED,
  SUCCESSFULLY_DETACHED,
} from '../constants'

describe('Success', () => {
  const mockProceed = jest.fn()
  const render = (
    props: Partial<React.ComponentProps<typeof Success>> = {}
  ) => {
    return renderWithProviders(
      <Success
        proceed={mockProceed}
        section={SECTIONS.SUCCESS}
        successfulAction={SUCCESSFULLY_ATTACHED_AND_CALIBRATED}
        isRobotMoving={false}
        {...props}
      />,
      { i18nInstance: i18n }
    )
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls proceed', () => {
    render()
    const exitButton = screen.getByRole('button', { name: 'Exit' })
    fireEvent.click(exitButton)
    expect(mockProceed).toHaveBeenCalled()
  })

  it('renders correct text for attached and calibrated', () => {
    render({ successfulAction: SUCCESSFULLY_ATTACHED_AND_CALIBRATED })
    screen.getByText('Flex Gripper successfully attached and calibrated')
    screen.getByRole('button', { name: 'Exit' })
  })

  it('renders correct text for calibrated', () => {
    render({ successfulAction: SUCCESSFULLY_CALIBRATED })
    screen.getByText('Flex Gripper successfully calibrated')
    screen.getByRole('button', { name: 'Exit' })
  })

  it('renders correct text for attached', () => {
    render({ successfulAction: SUCCESSFULLY_ATTACHED })
    screen.getByText('Gripper successfully attached')
    screen.getByRole('button', { name: 'Calibrate Gripper' })
  })

  it('renders correct text for detached', () => {
    render({ successfulAction: SUCCESSFULLY_DETACHED })
    screen.getByText('Flex Gripper successfully detached')
    screen.getByRole('button', { name: 'Exit' })
  })
})
