import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'

import { MountGripper } from '../MountGripper'
import { GRIPPER_FLOW_TYPES } from '../constants'
import { instrumentsResponseFixture } from '@opentrons/api-client'

describe('MountGripper', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof MountGripper>>
  ) => ReturnType<typeof renderWithProviders>

  const mockGoBack = jest.fn()
  const mockProceed = jest.fn()
  const mockChainRunCommands = jest.fn()
  const mockRunId = 'fakeRunId'

  beforeEach(() => {
    render = (props = {}) => {
      return renderWithProviders(
        <MountGripper
          runId={mockRunId}
          flowType={GRIPPER_FLOW_TYPES.ATTACH}
          proceed={mockProceed}
          attachedGripper={props?.attachedGripper ?? null}
          chainRunCommands={mockChainRunCommands}
          isRobotMoving={false}
          goBack={mockGoBack}
          {...props}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('clicking confirm calls proceed if attached gripper', () => {
    const { getByRole } = render({
      attachedGripper: instrumentsResponseFixture.data[0],
    })[0]
    getByRole('button', { name: 'continue' }).click()
    expect(mockProceed).toHaveBeenCalled()
  })

  it('clicking confirm shows unable to detect if no gripper attached', () => {
    const { getByRole, getByText } = render({ attachedGripper: null })[0]
    getByRole('button', { name: 'continue' }).click()
    expect(mockProceed).not.toHaveBeenCalled()
    getByText('Unable to detect Gripper')
    const tryAgainButton = getByRole('button', { name: 'try again' })
    tryAgainButton.click()
    expect(mockProceed).not.toHaveBeenCalled()
    getByRole('button', { name: 'continue' }).click()
    expect(mockProceed).not.toHaveBeenCalled()
    const goBackButton = getByRole('button', { name: 'Go back' })
    goBackButton.click()
    expect(mockGoBack).toHaveBeenCalled()
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
