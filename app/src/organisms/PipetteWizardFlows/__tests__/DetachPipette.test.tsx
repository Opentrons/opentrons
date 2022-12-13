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
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { DetachPipette } from '../DetachPipette'
import { CheckPipetteButton } from '../CheckPipetteButton'
import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../CheckPipetteButton')
jest.mock('../../../molecules/InProgressModal/InProgressModal')

const mockInProgressModal = InProgressModal as jest.MockedFunction<
  typeof InProgressModal
>
const mockCheckPipetteButton = CheckPipetteButton as jest.MockedFunction<
  typeof CheckPipetteButton
>
const render = (props: React.ComponentProps<typeof DetachPipette>) => {
  return renderWithProviders(<DetachPipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('DetachPipette', () => {
  let props: React.ComponentProps<typeof DetachPipette>
  beforeEach(() => {
    props = {
      robotName: 'otie',
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
    }
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
    mockCheckPipetteButton.mockReturnValue(<div>mock check pipette button</div>)
  })
  it('returns the correct information, buttons work as expected for single mount pipettes', () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Loosen Screws and Detach')
    getByText(
      'Hold the pipette in place and loosen the pipette screws. (The screws are captive and will not come apart from the pipette.) Then carefully remove the pipette'
    )
    getByAltText('Detach pipette')
    getByText('mock check pipette button')
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
  it('returns the correct information for in progress modal when robot is moving', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText } = render(props)
    getByText('mock in progress')
  })
  it('returns the correct information, buttons work as expected for 96 channel pipettes', () => {
    props = {
      ...props,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Unscrew and Remove 96 Channel Pipette')
    getByText(
      'Place your hand onto the pipette so it does not fall. Begin by unscrewing the 4 captive screws found in the front of the 96 channel pipette. Once all the screws are lossened, proceed to slowly remove the pipette by sliding off the supporting pins.'
    )
    getByText(
      'The pipette is heavy so be cautious during uninstall. Having a helper near can be really helpful during this process.'
    )
    getByAltText('Unscrew 96 channel pipette')
    getByText('mock check pipette button')
    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
})
