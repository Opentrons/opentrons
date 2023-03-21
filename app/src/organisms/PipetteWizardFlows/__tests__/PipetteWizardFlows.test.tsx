import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import {
  useCreateRunMutation,
  useStopRunMutation,
  useDeleteRunMutation,
  usePipettesQuery,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { useChainRunCommands } from '../../../resources/runs/hooks'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import * as RobotApi from '../../../redux/robot-api'
import { getIsOnDevice } from '../../../redux/config'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import { ExitModal } from '../ExitModal'
import { FLOWS, SECTIONS } from '../constants'
import { UnskippableModal } from '../UnskippableModal'
import { PipetteWizardFlows } from '..'

import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../../../redux/pipettes')
jest.mock('../getPipetteWizardSteps')
jest.mock('../../../resources/runs/hooks')
jest.mock('@opentrons/react-api-client')
jest.mock('../ExitModal')
jest.mock('../../ProtocolUpload/hooks')
jest.mock('../../RunTimeControl/hooks')
jest.mock('../../../redux/robot-api')
jest.mock('../UnskippableModal')
jest.mock('../../../redux/config')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
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
const mockUseDeleteRunMutation = useDeleteRunMutation as jest.MockedFunction<
  typeof useDeleteRunMutation
>
const mockUseStopRunMutation = useStopRunMutation as jest.MockedFunction<
  typeof useStopRunMutation
>
const mockUseCloseCurrentRun = useCloseCurrentRun as jest.MockedFunction<
  typeof useCloseCurrentRun
>
const mockUseRunStatus = useRunStatus as jest.MockedFunction<
  typeof useRunStatus
>
const mockExitModal = ExitModal as jest.MockedFunction<typeof ExitModal>
const mockUnskippableModal = UnskippableModal as jest.MockedFunction<
  typeof UnskippableModal
>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>
const render = (props: React.ComponentProps<typeof PipetteWizardFlows>) => {
  return renderWithProviders(<PipetteWizardFlows {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: {
    ...mockGen3P1000PipetteSpecs,
    maxVolume: 50,
  },
}
describe('PipetteWizardFlows', () => {
  let props: React.ComponentProps<typeof PipetteWizardFlows>
  let mockCreateRun: jest.Mock
  let mockStopRun: jest.Mock
  let mockCloseCurrentRun: jest.Mock
  let mockDeleteRun: jest.Mock
  let refetchPromise: Promise<void>
  let mockRefetch: jest.Mock
  let mockChainRunCommands: jest.Mock
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      flowType: FLOWS.CALIBRATE,
      mount: LEFT,
      closeFlow: jest.fn(),
      setSelectedPipette: jest.fn(),
    }
    mockCreateRun = jest.fn()
    mockStopRun = jest.fn()
    mockCloseCurrentRun = jest.fn()
    mockDeleteRun = jest.fn()
    refetchPromise = Promise.resolve()
    mockRefetch = jest.fn(() => refetchPromise)
    mockChainRunCommands = jest.fn().mockImplementation(() => Promise.resolve())
    mockUsePipettesQuery.mockReturnValue({
      data: { left: mockPipette, right: null },
      refetch: mockRefetch,
    } as any)
    mockUseStopRunMutation.mockReturnValue({ stopRun: mockStopRun } as any)
    mockUseDeleteRunMutation.mockReturnValue({
      deleteRun: mockDeleteRun,
    } as any)
    mockExitModal.mockReturnValue(<div>mock exit modal</div>)
    mockUseCreateRunMutation.mockReturnValue({
      createRun: mockCreateRun,
    } as any)
    mockUseChainRunCommands.mockReturnValue({
      chainRunCommands: mockChainRunCommands,
      isCommandMutationLoading: false,
    })
    mockUseCloseCurrentRun.mockReturnValue({
      closeCurrenRun: mockCloseCurrentRun,
    } as any)
    mockUseRunStatus.mockReturnValue('idle')
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
    mockGetRequestById.mockReturnValue(null)
    mockUnskippableModal.mockReturnValue(<div>mock unskippable modal</div>)
    mockGetIsOnDevice.mockReturnValue(false)
  })
  it('renders the correct information, calling the correct commands for the calibration flow', async () => {
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('Recalibrate Left Pipette')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
    )
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
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
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the A1 (back left corner) pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    const initiate = getByRole('button', { name: 'Begin calibration' })
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
      //  TODO(sb, 3/21/23): rewire this when home issue is sorted
      // expect(mockChainRunCommands).toHaveBeenCalledWith(
      //   [
      //     {
      //       commandType: 'home',
      //       params: {},
      //     },
      //   ],
      //   false
      // )
      //  TODO(jr, 11/2/22): wire this up when stop run logic is figured out
      expect(mockStopRun).toHaveBeenCalled()
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
  it('renders the correct first page for calibrating single mount when rendering from on device display', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    const { getByText } = render(props)
    getByText('Recalibrate Left Pipette')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
    )
  })
  it('renders 3rd page and clicking back button redirects to the first page', async () => {
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('Before you begin')
    getByRole('button', { name: 'Move gantry to front' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // second page
    getByText('Attach Calibration Probe')
    getByRole('button', { name: 'Begin calibration' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
    })
    //  third page
    getByText('Remove Calibration Probe')
    getByRole('button', { name: 'back' }).click()
    //   first page
    getByText('Before you begin')
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
    getByText('Detach Left Pipette')
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
    getByText('Attach Left Pipette')
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
  })
  it('renders the correct information, calling the correct commands for the attach flow 96 channel', async () => {
    mockUsePipettesQuery.mockReturnValue({
      data: { left: null, right: null },
    } as any)
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
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
          {
            commandType: 'calibration/moveToMaintenancePosition' as const,
            params: { mount: RIGHT },
          },
        ],
        false
      )
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew Z-axis Carriage')
    // TODO wait until commands are wired up to write out more of this test!
  })
  it('renders the correct information, calling the correct commands for the detach flow 96 channel', async () => {
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: 'abc',
          name: 'p1000_96',
          model: 'p1000_96_v1',
          tip_length: 42,
          mount_axis: 'c',
          plunger_axis: 'd',
          modelSpecs: {
            ...mockGen3P1000PipetteSpecs,
            maxVolume: 50,
            displayName: 'mock display name',
          },
        },
        right: null,
      },
      refetch: mockRefetch,
    } as any)
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
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'loadPipette',
            params: {
              mount: LEFT,
              pipetteId: 'abc',
              pipetteName: 'p1000_96',
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
    getByText('Loosen Screws and Detach 96-Channel Pipette')
    const continueBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(continueBtn)
  })
  it('renders the correct information, calling the correct commands for the attach flow 96 channel with gantry not empty', async () => {
    mockUsePipettesQuery.mockReturnValue({
      data: { left: null, right: mockPipette },
    } as any)
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
        section: SECTIONS.DETACH_PIPETTE,
        mount: LEFT,
        flowType: FLOWS.ATTACH,
      },
      { section: SECTIONS.RESULTS, mount: LEFT, flowType: FLOWS.ATTACH },
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
    getByText('Detach Flex 1-Channel 1000 μL and Attach 96-Channel Pipette')
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
    getByText(
      'Hold the pipette in place and loosen the pipette screws. (The screws are captive and will not come apart from the pipette.) Then carefully remove the pipette.'
    )
    getByText('Continue')
  })
  it('renders the correct information, calling the correct commands for the 96-channel calibration flow', async () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('Calibrate 96-Channel pipette')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
    )
    getByRole('button', { name: 'Move gantry to front' }).click()
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
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the A1 (back left corner) pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByRole('button', { name: 'Begin calibration' }).click()
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
    getByRole('button', { name: 'Complete calibration' }).click()
    //  TODO(sb, 3/21/23): rewire this when home issue is sorted
    // await waitFor(() => {
    //   expect(mockChainRunCommands).toHaveBeenCalledWith(
    //     [
    //       {
    //         commandType: 'home',
    //         params: {},
    //       },
    //     ],
    //     false
    //   )
    // })
  })
  it('renders the unskippable modal when you try to exit out of a 96 channel detach flow from a the detach pipette unskippable page', async () => {
    mockUsePipettesQuery.mockReturnValue({
      data: {
        left: {
          id: 'abc',
          name: 'p1000_96',
          model: 'p1000_96_v1',
          tip_length: 42,
          mount_axis: 'c',
          plunger_axis: 'd',
          modelSpecs: mockGen3P1000PipetteSpecs,
        },
        right: null,
      },
    } as any)
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
    const { getByText, getByRole, getByLabelText } = render(props)
    // page 1
    getByRole('button', { name: 'Move gantry to front' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Loosen Screws and Detach 96-Channel Pipette')
    getByLabelText('Exit').click()
    getByText('mock unskippable modal')
  })
  it('renders the 96 channel attach flow carriage unskippable step page', async () => {
    mockUsePipettesQuery.mockReturnValue({
      data: { left: null, right: null },
    } as any)
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
    const { getByText, getByRole, getByLabelText } = render(props)
    // page 1
    getByRole('button', { name: 'Move gantry to front' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew Z-axis Carriage')
    getByLabelText('Exit').click()
    getByText('mock unskippable modal')
  })
})
