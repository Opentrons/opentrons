import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { MountGripper } from '../MountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'

describe('MountGripper', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof MountGripper>>
  ) => ReturnType<typeof renderWithProviders>

  const mockGoBack = jest.fn()
  const mockProceed = jest.fn()
  const mockChainRunCommands = jest.fn()
  const mockSetIsBetweenCommands = jest.fn()
  const mockRunId = 'fakeRunId'

  beforeEach(() => {
    render = (props = {}) => {
      return renderWithProviders(
        <MountGripper
          runId={mockRunId}
          flowType={GRIPPER_FLOW_TYPES.ATTACH}
          proceed={mockProceed}
          attachedGripper={{}}
          chainRunCommands={mockChainRunCommands}
          isRobotMoving={false}
          goBack={mockGoBack}
          setIsBetweenCommands={mockSetIsBetweenCommands}
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
    getByRole('button', { name: 'continue' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking go back calls back', () => {
    const { getByLabelText } = render()[0]
    getByLabelText('back').click()
    expect(mockGoBack).toHaveBeenCalled()
  })

  it('renders correct text', () => {
    const { getByText } = render()[0]
    getByText('Connect and Screw In Gripper')
    getByText(
      'Attach the gripper to the robot by alinging the connector and ensuring a secure connection. Hold the gripper in place and use the hex screwdriver to tighten the gripper screws. Then test that the gripper is securely attached by gently pulling it side to side.'
    )
  })
})
