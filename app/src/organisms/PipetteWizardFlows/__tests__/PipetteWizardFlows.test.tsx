import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import {
  useCreateRunMutation,
  // useDeleteRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { getAttachedPipettes, fetchPipettes } from '../../../redux/pipettes'
import { useChainRunCommands } from '../../../resources/runs/hooks'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import * as RobotApi from '../../../redux/robot-api'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import { ExitModal } from '../ExitModal'
import { FLOWS, SECTIONS } from '../constants'
import { PipetteWizardFlows } from '..'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { DispatchApiRequestType } from '../../../redux/robot-api'

jest.mock('../../../redux/pipettes')
jest.mock('../getPipetteWizardSteps')
jest.mock('../../../resources/runs/hooks')
jest.mock('@opentrons/react-api-client')
jest.mock('../ExitModal')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../../redux/robot-api')
jest.mock('../../../redux/pipettes')

const mockFetchPipettes = fetchPipettes as jest.MockedFunction<
  typeof fetchPipettes
>
const mockUseDispatchApiRequests = RobotApi.useDispatchApiRequests as jest.MockedFunction<
  typeof RobotApi.useDispatchApiRequests
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockGetAttachedPipettes = getAttachedPipettes as jest.MockedFunction<
  typeof getAttachedPipettes
>
const mockGetPipetteWizardSteps = getPipetteWizardSteps as jest.MockedFunction<
  typeof getPipetteWizardSteps
>
const mockUseChainRunCommands = useChainRunCommands as jest.MockedFunction<
  typeof useChainRunCommands
>
const mockUseCreateRunMutation = useCreateRunMutation as jest.MockedFunction<
  typeof useCreateRunMutation
>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>
// const mockUseDeleteRunMutation = useDeleteRunMutation as jest.MockedFunction<
//   typeof useDeleteRunMutation
// >
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>
const mockExitModal = ExitModal as jest.MockedFunction<typeof ExitModal>
const render = (props: React.ComponentProps<typeof PipetteWizardFlows>) => {
  return renderWithProviders(<PipetteWizardFlows {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('PipetteWizardFlows', () => {
  let props: React.ComponentProps<typeof PipetteWizardFlows>
  let dispatchApiRequest: DispatchApiRequestType
  const mockCreateRun = jest.fn()
  // const mockDeleteRun = jest.fn()
  const mockStopRun = jest.fn()
  const mockCloseCurrentRun = jest.fn()
  const mockChainRunCommands = jest
    .fn()
    .mockImplementation(() => Promise.resolve())
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      flowType: FLOWS.CALIBRATE,
      mount: LEFT,
      robotName: 'otie',
      closeFlow: jest.fn(),
    }
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)
    mockExitModal.mockReturnValue(<div>mock exit modal</div>)
    mockUseCreateRunMutation.mockReturnValue({
      createRun: mockCreateRun,
    } as any)
    // mockUseDeleteRunMutation.mockReturnValue({
    //   deleteRun: mockDeleteRun,
    // } as any)
    mockUseChainRunCommands.mockReturnValue({
      chainRunCommands: mockChainRunCommands,
      isCommandMutationLoading: false,
    })
    mockUseCloseCurrentRun.mockReturnValue({
      closeCurrenRun: mockCloseCurrentRun,
    } as any)
    mockGetAttachedPipettes.mockReturnValue({ left: mockPipette, right: null })
    mockGetPipetteWizardSteps.mockReturnValue([
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ])
    dispatchApiRequest = jest.fn()
    mockGetRequestById.mockReturnValue(null)
    mockUseDispatchApiRequests.mockReturnValue([dispatchApiRequest, ['id']])
  })
  it('renders the correct information, calling the correct commands for the calibration flow', async () => {
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('Calibrate a pipette')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
    )
    const getStarted = getByRole('button', { name: 'Get started' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'loadPipette',
            params: {
              mount: LEFT,
              pipetteId: 'abc',
              pipetteName: 'p1000_single_gen3',
            },
          },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // second page
    getByText('Step 1 / 3')
    getByText('Attach Calibration Probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    const initiate = getByRole('button', { name: 'Initiate calibration' })
    fireEvent.click(initiate)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'calibration/calibratePipette',
            params: { mount: LEFT },
          },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
    })
    //  third page
    getByText('Step 2 / 3')
    getByText('Remove Calibration Probe')
    getByText(
      'Unlatch the calibration probe, remove it from the pipette nozzle, and return it to its storage location.'
    )
    const complete = getByRole('button', { name: 'Complete calibration' })
    fireEvent.click(complete)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'home',
            params: {},
          },
        ],
        false
      )
      //  TODO(jr, 11/2/22): wire this up when stop run logic is figured out
      // expect(mockStopRun).toHaveBeenCalled()
    })
    //  last page
    //  TODO(jr, 11/2/22): wire this up when stop run logic is figured out
    // getByText('Step 3 / 3')
    // getByText('Pipette Successfully Calibrated')
    // const exitButton = getByLabelText('Results_exit')
    // fireEvent.click(exitButton)
    // await waitFor(() => {
    //   expect(props.closeFlow).toHaveBeenCalled()
    // })
  })
  it('renders the correct information, calling the correct commands for the detach flow', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    mockGetPipetteWizardSteps.mockReturnValue([
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
    ])
    const { getByText } = render(props)
    getByText('Detach a pipette')
    //  TODO(jr 11/11/22): finish the rest of the test
  })

  it('renders the correct information, calling the correct commands for the attach flow', async () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
    }
    mockGetPipetteWizardSteps.mockReturnValue([
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.ATTACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.DETACH_PROBE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
    ])
    const { getByText, getByRole } = render(props)
    getByText('Attach a pipette')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Connect and screw in pipette')
    const continueBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(continueBtn)
    await waitFor(() => {
      expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
    })
  })
  it('renders the correct information, calling the correct commands for the attach flow 96 channel', async () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    mockGetPipetteWizardSteps.mockReturnValue([
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.MOUNT_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
    ])
    const { getByText, getByRole } = render(props)
    getByText('Attach 96-Channel Pipette')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'home',
            params: {},
          },
        ],
        false
      )
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew Z Axis Carriage')
    // TODO wait until commands are wired up to write out more of this test!
  })
  it('renders the correct information, calling the correct commands for the detach flow 96 channel', async () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    mockGetPipetteWizardSteps.mockReturnValue([
      {
        section: SECTIONS.BEFORE_BEGINNING,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.MOUNTING_PLATE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.CARRIAGE,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.DETACH,
      },
    ])
    const { getByText, getByRole } = render(props)
    getByText('Detach 96-Channel Pipette')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Get started' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'loadPipette',
            params: {
              mount: LEFT,
              pipetteId: 'abc',
              pipetteName: 'p1000_single_gen3',
            },
          },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew and Remove 96 Channel Pipette')
    const continueBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(continueBtn)
    await waitFor(() => {
      expect(dispatchApiRequest).toBeCalledWith(mockFetchPipettes('otie'))
    })
  })
})
