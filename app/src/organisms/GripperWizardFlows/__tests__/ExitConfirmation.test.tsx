import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { ExitConfirmation } from '../ExitConfirmation'
import { GRIPPER_FLOW_TYPES } from '../constants'

describe('ExitConfirmation', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ExitConfirmation>>
  ) => ReturnType<typeof renderWithProviders>

  const mockBack = jest.fn()
  const mockExit = jest.fn()

  beforeEach(() => {
    render = (props = {}) => {
      return renderWithProviders(
        <ExitConfirmation
          handleExit={mockExit}
          handleGoBack={mockBack}
          flowType={GRIPPER_FLOW_TYPES.ATTACH}
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

  it('clicking confirm exit calls exit', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Exit' }).click()
    expect(mockExit).toHaveBeenCalled()
  })

  it('clicking back calls back', () => {
    const { getByRole } = render()[0]
    getByRole('button', { name: 'Go back' }).click()
    expect(mockBack).toHaveBeenCalled()
  })

  it('renders correct text for attach flow', () => {
    const { getByText } = render({
      flowType: GRIPPER_FLOW_TYPES.ATTACH,
    })[0]
    getByText('Attach Gripper progress will be lost')
    getByText('Are you sure you want to exit before completing Attach Gripper?')
  })

  it('renders correct text for detach flow', () => {
    const { getByText } = render({
      flowType: GRIPPER_FLOW_TYPES.DETACH,
    })[0]
    getByText('Detach Gripper progress will be lost')
    getByText('Are you sure you want to exit before completing Detach Gripper?')
  })

  it('renders correct text for recalibrate flow', () => {
    const { getByText } = render({
      flowType: GRIPPER_FLOW_TYPES.RECALIBRATE,
    })[0]
    getByText('Gripper Recalibration progress will be lost')
    getByText(
      'Are you sure you want to exit before completing Gripper Recalibration?'
    )
  })
})
