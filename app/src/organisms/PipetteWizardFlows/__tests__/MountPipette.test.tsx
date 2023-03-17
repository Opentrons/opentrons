import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { CheckPipetteButton } from '../CheckPipetteButton'
import { MountPipette } from '../MountPipette'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../CheckPipetteButton')

const mockCheckPipetteButton = CheckPipetteButton as jest.MockedFunction<
  typeof CheckPipetteButton
>
const render = (props: React.ComponentProps<typeof MountPipette>) => {
  return renderWithProviders(<MountPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('MountPipette', () => {
  let props: React.ComponentProps<typeof MountPipette>
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipettes: { left: mockPipette, right: null },
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      isFetching: false,
      setFetching: jest.fn(),
      isOnDevice: false,
    }
    mockCheckPipetteButton.mockReturnValue(<div>mock check pipette button</div>)
  })
  it('returns the correct information, buttons work as expected for single mount pipettes', () => {
    const { getByText, getByAltText, getByLabelText } = render(props)
    getByText('Connect and screw in pipette')
    getByText(
      'Attach the pipette to the robot by aligning the connector and pressing to ensure a secure connection. Hold the pipette in place and use the hex screwdriver to tighten the pipette screws. Then test that the pipette is securely attached by gently pulling it side to side.'
    )

    getByAltText('Screw pattern')

    const backBtn = getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
    getByText('mock check pipette button')
  })

  it('returns the correct information, buttons work as expected for 96 channel pipettes', () => {
    props = {
      ...props,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByAltText, getByLabelText } = render(props)
    getByText('Connect and Attach 96 Channel Pipette')
    getByText(
      'Attach the pipette to the robot by aligning the connector and pressing to ensure a secure connection. Hold the pipette in place and use the hex screwdriver to tighten the pipette screws. Then test that the pipette is securely attached by gently pulling it side to side.'
    )
    getByAltText('Attach 96 channel pipette')
    const backBtn = getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
    getByText('mock check pipette button')
  })
  it('returns skeletons and disabled buttons when isFetching is true', () => {
    props = {
      ...props,
      isFetching: true,
    }
    const { getAllByTestId, getByLabelText } = render(props)
    getAllByTestId('Skeleton')
    const backBtn = getByLabelText('back')
    expect(backBtn).toBeDisabled()
  })
})
