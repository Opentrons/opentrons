import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { when } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { getAttachedPipettes } from '../../../redux/pipettes'
import { i18n } from '../../../i18n'
import { getHasCalibrationBlock, useFeatureFlag } from '../../../redux/config'
import { getMovementStatus } from '../../../redux/robot-controls'
import { getCalibrationForPipette } from '../../../redux/calibration'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
import {
  getRequestById,
  SUCCESS,
  useDispatchApiRequests,
} from '../../../redux/robot-api'
import { useDeprecatedCalibratePipetteOffset } from '../../DeprecatedCalibratePipetteOffset/useDeprecatedCalibratePipetteOffset'
import { PipetteSelection } from '../PipetteSelection'
import { ExitModal } from '../ExitModal'
import { ConfirmPipette } from '../ConfirmPipette'
import { ChangePipette } from '..'

import type { PipetteNameSpecs, PipetteName } from '@opentrons/shared-data'
import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

const mockPush = jest.fn()

jest.mock('react-router-dom', () => {
  const reactRouterDom = jest.requireActual('react-router-dom')
  return {
    ...reactRouterDom,
    useHistory: () => ({ push: mockPush } as any),
  }
})

jest.mock('@opentrons/shared-data', () => {
  const actualSharedData = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualSharedData,
    getPipetteNameSpecs: jest.fn(),
  }
})
jest.mock('../../../redux/config')
jest.mock('../../../redux/pipettes')
jest.mock('../../../redux/robot-controls')
jest.mock('../../../redux/calibration')
jest.mock(
  '../../DeprecatedCalibratePipetteOffset/useDeprecatedCalibratePipetteOffset'
)
jest.mock('../../../redux/robot-api')
jest.mock('../PipetteSelection')
jest.mock('../ExitModal')
jest.mock('../../../molecules/InProgressModal/InProgressModal')
jest.mock('../ConfirmPipette')

const mockUseFeatureFlag = useFeatureFlag as jest.MockedFunction<
  typeof useFeatureFlag
>
const mockGetPipetteNameSpecs = getPipetteNameSpecs as jest.MockedFunction<
  typeof getPipetteNameSpecs
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockGetMovementStatus = getMovementStatus as jest.MockedFunction<
  typeof getMovementStatus
>
const mockGetCalibrationForPipette = getCalibrationForPipette as jest.MockedFunction<
  typeof getCalibrationForPipette
>
const mockUseDeprecatedCalibratePipetteOffset = useDeprecatedCalibratePipetteOffset as jest.MockedFunction<
  typeof useDeprecatedCalibratePipetteOffset
>
const mockGetHasCalibrationBlock = getHasCalibrationBlock as jest.MockedFunction<
  typeof getHasCalibrationBlock
>
const mockGetRequestById = getRequestById as jest.MockedFunction<
  typeof getRequestById
>
const mockUseDispatchApiRequests = useDispatchApiRequests as jest.MockedFunction<
  typeof useDispatchApiRequests
>
const mockPipetteSelection = PipetteSelection as jest.MockedFunction<
  typeof PipetteSelection
>
const mockInProgress = InProgressModal as jest.MockedFunction<
  typeof InProgressModal
>
const mockConfirmPipette = ConfirmPipette as jest.MockedFunction<
  typeof ConfirmPipette
>

const mockExitModal = ExitModal as jest.MockedFunction<typeof ExitModal>

const render = (props: React.ComponentProps<typeof ChangePipette>) => {
  return renderWithProviders(<ChangePipette {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockP300PipetteNameSpecs = {
  name: 'p300_single_gen2' as const,
  displayName: 'P300 Single GEN2',
  channels: 1,
  displayCategory: 'GEN2',
} as any as (PipetteNameSpecs & {name: PipetteName})

const mockAttachedPipettes = {
  id: 'abc',
  name: 'p300_single_gen2',
  model: 'p300_single_v2.0',
  tip_length: 42,
  mount_axis: 'c',
  plunger_axis: 'd',
  modelSpecs: mockP300PipetteNameSpecs,
}

describe('ChangePipette', () => {
  let props: React.ComponentProps<typeof ChangePipette>
  let dispatchApiRequest: DispatchApiRequestType
  let startWizard: any

  beforeEach(() => {
    props = {
      robotName: 'otie',
      mount: 'left',
      closeModal: jest.fn(),
    }
    startWizard = jest.fn()
    dispatchApiRequest = jest.fn()
    mockUseFeatureFlag.mockReturnValue(true)
    mockGetAttachedPipettes.mockReturnValue({ left: null, right: null })
    mockGetRequestById.mockReturnValue(null)
    mockGetCalibrationForPipette.mockReturnValue(null)
    mockGetHasCalibrationBlock.mockReturnValue(false)
    mockGetMovementStatus.mockReturnValue(null)
    mockGetPipetteNameSpecs.mockReturnValue(mockP300PipetteNameSpecs)

    when(mockUseDeprecatedCalibratePipetteOffset).mockReturnValue([
      startWizard,
      null,
    ])
    when(mockUseDispatchApiRequests).mockReturnValue([
      dispatchApiRequest,
      ['id'],
    ])
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders the in progress modal when the movement status is moving', () => {
    mockGetMovementStatus.mockReturnValue('moving')
    mockInProgress.mockReturnValue(<div>mock in progress modal</div>)
    const { getByText } = render(props)
    getByText('Attach a pipette')
    getByText('mock in progress modal')
  })

  it('renders the wizard pages for attaching a pipette and clicking on the exit button will render the exit modal', () => {
    mockPipetteSelection.mockReturnValue(<div>mock pipette selection</div>)
    mockExitModal.mockReturnValue(<div>mock exit modal</div>)

    const { getByText, getByLabelText, getByRole } = render(props)
    //  Clear deck modal page
    let exit = getByLabelText('Exit')
    getByText('Attach a pipette')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    fireEvent.click(exit)
    expect(props.closeModal).toHaveBeenCalled()

    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    getByText('Attach a pipette')
    getByText('mock pipette selection')
    exit = getByLabelText('Exit')
    fireEvent.click(exit)

    //  Exit modal page
    getByText('mock exit modal')
    getByText('Attach a pipette')
  })

  it('the go back button functions as expected', () => {
    mockPipetteSelection.mockReturnValue(<div>mock pipette selection</div>)

    const { getByText, getByRole } = render(props)
    //  Clear deck modal page
    getByText('Before you begin')
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    const goBack = getByRole('button', { name: 'Go back' })
    fireEvent.click(goBack)
    getByText('Before you begin')
  })

  it('renders the wizard pages for attaching a pipette and goes through flow', () => {
    mockPipetteSelection.mockReturnValue(<div>mock pipette selection</div>)
    const { getByText, getByRole } = render(props)
    //  Clear deck modal page
    const cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page
    getByText('Attach a pipette')
  })

  it('renders the wizard pages for detaching a single channel pipette and exits on the 2nd page rendering exit modal', () => {
    mockExitModal.mockReturnValue(<div>mock exit modal</div>)
    mockGetRequestById.mockReturnValue({
      status: SUCCESS,
      response: {
        method: 'POST',
        ok: true,
        path: '/',
        status: 200,
      },
    })
    mockGetAttachedPipettes.mockReturnValue({
      left: mockAttachedPipettes as AttachedPipette,
      right: null,
    })
    const { getByText, getByLabelText, getByRole } = render(props)

    //  Clear deck modal page
    getByLabelText('Exit')
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Before you begin')
    getByText(
      'Before starting, remove all labware from the deck and all tips from pipettes. The gantry will move to the front of the robot.'
    )
    let cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page 1
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 1 / 3')
    getByText('Loosen the screws')
    getByText(
      'Using a 2.5 mm screwdriver, loosen the three screws on the back of the pipette that is currently attached.'
    )
    cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)

    //  Instructions page 2
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 2 / 3')
    getByText('Remove the pipette')
    getByText(
      'Hold onto the pipette so it does not fall. Disconnect the pipette from the robot by pulling the white connector tab.'
    )
    getByLabelText('Confirm')
    const exit = getByLabelText('Exit')
    fireEvent.click(exit)

    //  Exit modal page
    getByText('Detach P300 Single GEN2 from Left Mount')
    getByText('Step 2 / 3')
    getByText('mock exit modal')
  })

  it('renders the wizard pages for detaching a single channel pipette and goes through the whole flow', () => {
    mockConfirmPipette.mockReturnValue(<div>mock confirm pipette</div>)
    mockGetAttachedPipettes.mockReturnValue({
      left: mockAttachedPipettes as AttachedPipette,
      right: null,
    })
    const { getByLabelText, getByRole } = render(props)

    //  Clear deck modal page
    let cont = getByRole('button', { name: 'Get started' })
    fireEvent.click(cont)

    //  Instructions page 1
    cont = getByRole('button', { name: 'Continue' })
    fireEvent.click(cont)

    //  Instructions page 2
    getByLabelText('Confirm')
  })
})
