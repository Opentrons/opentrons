import * as React from 'react'
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
  let render: (
    props?: Partial<React.ComponentProps<typeof Success>>
  ) => ReturnType<typeof renderWithProviders>

  const mockProceed = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm proceed calls proceed', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'exit' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('renders correct text for attached and calibrated', () => {
    const { getByRole, getByText } = render({
      successfulAction: SUCCESSFULLY_ATTACHED_AND_CALIBRATED,
    })[0]
    getByText('Flex Gripper Successfully Attached and Calibrated')
    getByRole('button', { name: 'exit' })
  })

  it('renders correct text for calibrated', () => {
    const { getByRole, getByText } = render({
      successfulAction: SUCCESSFULLY_CALIBRATED,
    })[0]
    getByText('Flex Gripper Successfully Calibrated')
    getByRole('button', { name: 'exit' })
  })

  it('renders correct text for attached', () => {
    const { getByRole, getByText } = render({
      successfulAction: SUCCESSFULLY_ATTACHED,
    })[0]
    getByText('Flex Gripper Successfully Attached')
    getByRole('button', { name: 'Calibrate gripper' })
  })

  it('renders correct text for detached', () => {
    const { getByText, getByRole } = render({
      successfulAction: SUCCESSFULLY_DETACHED,
    })[0]
    getByText('Flex Gripper Successfully Detached')
    getByRole('button', { name: 'exit' })
  })
})
