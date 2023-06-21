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
  useCreateMaintenanceRunMutation,
  useDeleteMaintenanceRunMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { useChainMaintenanceCommands } from '../../../resources/runs/hooks'
import {
  mock96ChannelAttachedPipetteInformation,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import * as RobotApi from '../../../redux/robot-api'
import { getIsOnDevice } from '../../../redux/config'
import { useRunStatus } from '../../RunTimeControl/hooks'
import { useAttachedPipettesFromInstrumentsQuery } from '../../Devices/hooks/useAttachedPipettesFromInstrumentsQuery'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import { usePipetteFlowWizardHeaderText } from '../hooks'
import { ExitModal } from '../ExitModal'
import { FLOWS, SECTIONS } from '../constants'
import { UnskippableModal } from '../UnskippableModal'
import { PipetteWizardFlows } from '..'

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
jest.mock('../../Devices/hooks/useAttachedPipettesFromInstrumentsQuery')
jest.mock('../hooks')

const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>
const mockGetRequestById = RobotApi.getRequestById as jest.MockedFunction<
  typeof RobotApi.getRequestById
>
const mockGetPipetteWizardSteps = getPipetteWizardSteps as jest.MockedFunction<
  typeof getPipetteWizardSteps
>
const mockUseChainMaintenanceCommands = useChainMaintenanceCommands as jest.MockedFunction<
  typeof useChainMaintenanceCommands
>
const mockUseCreateMaintenanceRunMutation = useCreateMaintenanceRunMutation as jest.MockedFunction<
  typeof useCreateMaintenanceRunMutation
>
const mockUseDeleteMaintenanceRunMutation = useDeleteMaintenanceRunMutation as jest.MockedFunction<
  typeof useDeleteMaintenanceRunMutation
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
const mockUsePipetteFlowWizardHeaderText = usePipetteFlowWizardHeaderText as jest.MockedFunction<
  typeof usePipetteFlowWizardHeaderText
>

const render = (props: React.ComponentProps<typeof PipetteWizardFlows>) => {
  return renderWithProviders(<PipetteWizardFlows {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('PipetteWizardFlows', () => {
  let props: React.ComponentProps<typeof PipetteWizardFlows>
  let mockCreateMaintenanceRun: jest.Mock
  let mockDeleteMaintenanceRun: jest.Mock
  let mockChainRunCommands: jest.Mock
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      flowType: FLOWS.CALIBRATE,
      mount: LEFT,
      closeFlow: jest.fn(),
      onComplete: jest.fn(),
    }
    mockCreateMaintenanceRun = jest.fn()
    mockDeleteMaintenanceRun = jest.fn()
    mockChainRunCommands = jest.fn().mockImplementation(() => Promise.resolve())
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    mockUseDeleteMaintenanceRunMutation.mockReturnValue({
      deleteMaintenanceRun: mockDeleteMaintenanceRun,
    } as any)
    mockExitModal.mockReturnValue(<div>mock exit modal</div>)
    mockUseCreateMaintenanceRunMutation.mockReturnValue({
      createMaintenanceRun: mockCreateMaintenanceRun,
    } as any)
    mockUseChainMaintenanceCommands.mockReturnValue({
      chainRunCommands: mockChainRunCommands,
      isCommandMutationLoading: false,
    })
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
    mockUsePipetteFlowWizardHeaderText.mockReturnValue(
      'mock wizard header text'
    )
  })
  it('renders the correct information, calling the correct commands for the calibration flow', async () => {
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('mock wizard header text')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the deck and clean up the working area to make calibration easier. Also gather the needed equipment shown to the right.'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
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
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
    // second page
    getByText('Step 1 / 3')
    getByText('Attach calibration probe')
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
    getByText('Remove calibration probe')
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
    getByText('mock wizard header text')
    getByText('Before you begin')
    getByText(
      'To get started, remove labware from the deck and clean up the working area to make calibration easier. Also gather the needed equipment shown to the right.'
    )
    getByText(
      'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
    )
  })
  it('renders 3rd page and clicking back button redirects to the first page', async () => {
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('Before you begin')
    getByRole('button', { name: 'Move gantry to front' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
    // second page
    getByText('Attach calibration probe')
    getByRole('button', { name: 'Begin calibration' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalled()
    })
    //  third page
    getByText('Remove calibration probe')
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
    getByText('mock wizard header text')
    //  TODO(jr 11/11/22): finish the rest of the test
  })

  it('renders the correct information, calling the correct commands for the attach flow', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
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
    getByText('mock wizard header text')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
  })
  it('renders the correct information, calling the correct commands for the attach flow 96 channel', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
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
    getByText('mock wizard header text')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition' as const,
            params: { maintenancePosition: 'attachPlate', mount: RIGHT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew z-axis carriage')
    // TODO wait until commands are wired up to write out more of this test!
  })
  it('renders the correct information, calling the correct commands for the detach flow 96 channel', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mock96ChannelAttachedPipetteInformation,
      right: null,
    })
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
    getByText('mock wizard header text')
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
              pipetteId: 'cba',
              pipetteName: 'p1000_96',
            },
          },
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
  })
  it('renders the correct information, calling the correct commands for the attach flow 96 channel with gantry not empty', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: mockAttachedPipetteInformation,
    })
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
    getByText('mock wizard header text')
    getByText('Before you begin')
    // page 1
    const getStarted = getByRole('button', { name: 'Move gantry to front' })
    fireEvent.click(getStarted)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
  })
  it('renders the correct information, calling the correct commands for the 96-channel calibration flow', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mock96ChannelAttachedPipetteInformation,
      right: null,
    })
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole } = render(props)
    //  first page
    getByText('mock wizard header text')
    getByText('Before you begin')
    getByRole('button', { name: 'Move gantry to front' }).click()
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'loadPipette',
            params: {
              mount: LEFT,
              pipetteId: 'cba',
              pipetteName: 'p1000_96',
            },
          },
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
    // second page
    getByText('Step 1 / 3')
    getByText('Attach calibration probe')
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
    getByText('Remove calibration probe')
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
  it('renders the 96 channel attach flow carriage unskippable step page', async () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
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
      expect(mockCreateMaintenanceRun).toHaveBeenCalled()
    })
    // page 2
    getByText('Unscrew z-axis carriage')
    getByLabelText('Exit').click()
    getByText('mock unskippable modal')
  })
})
