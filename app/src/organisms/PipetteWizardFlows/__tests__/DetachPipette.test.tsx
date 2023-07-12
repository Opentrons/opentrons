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
  mock96ChannelAttachedPipetteInformation,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { DetachPipette } from '../DetachPipette'
import { CheckPipetteButton } from '../CheckPipetteButton'

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

describe('DetachPipette', () => {
  let props: React.ComponentProps<typeof DetachPipette>
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      maintenanceRunId: RUN_ID_1,
      attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
      flowType: FLOWS.DETACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      isFetching: false,
      setFetching: jest.fn(),
      isOnDevice: false,
    }
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
    mockCheckPipetteButton.mockReturnValue(<div>mock check pipette button</div>)
  })
  it('returns the correct information, buttons work as expected for single mount pipettes', () => {
    const { getByText, getByTestId, getByLabelText } = render(props)
    getByText('Loosen screws and detach Flex 1-Channel 1000 μL')
    getByText(
      'Hold the pipette in place and loosen the pipette screws. (The screws are captive and will not come apart from the pipette.) Then carefully remove the pipette.'
    )
    getByTestId('Pipette_Detach_1_L.webm')
    getByText('mock check pipette button')
    const backBtn = getByLabelText('back')
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
      flowType: FLOWS.ATTACH,
      selectedPipette: NINETY_SIX_CHANNEL,
      attachedPipettes: {
        left: mock96ChannelAttachedPipetteInformation,
        right: null,
      },
    }
    const { getByText, getByTestId, getByLabelText } = render(props)
    getByText('Loosen screws and detach Flex 96-Channel 1000 μL')
    getByText(
      'Hold the pipette in place and loosen the pipette screws. (The screws are captive and will not come apart from the pipette.) Then carefully remove the pipette.'
    )
    getByTestId('Pipette_Detach_96.webm')
    getByText('mock check pipette button')
    const backBtn = getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })
  it('returns skeletons and disabled buttons when isFetching is true', () => {
    props = {
      ...props,
      selectedPipette: NINETY_SIX_CHANNEL,
      isFetching: true,
    }
    const { getAllByTestId, getByLabelText } = render(props)
    getAllByTestId('Skeleton')
    const backBtn = getByLabelText('back')
    expect(backBtn).toBeDisabled()
  })
  it('returns the correct information, buttons work as expected for 96 channel pipette flow when single mount is attached', () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByTestId, getByLabelText } = render(props)
    getByText('Loosen screws and detach Flex 1-Channel 1000 μL')
    getByText(
      'Hold the pipette in place and loosen the pipette screws. (The screws are captive and will not come apart from the pipette.) Then carefully remove the pipette.'
    )
    getByTestId('Pipette_Detach_1_L.webm')
    getByText('mock check pipette button')
    getByLabelText('back').click()
    expect(props.goBack).toHaveBeenCalled()
  })
})
