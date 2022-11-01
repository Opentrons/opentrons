import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import {
  useCreateRunMutation,
  useDeleteRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'
import { i18n } from '../../../i18n'
import { getAttachedPipettes } from '../../../redux/pipettes'
import { useChainRunCommands } from '../../../resources/runs/hooks'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { useCloseCurrentRun } from '../../ProtocolUpload/hooks'
import { getPipetteWizardSteps } from '../getPipetteWizardSteps'
import { ExitModal } from '../ExitModal'
import { FLOWS, SECTIONS } from '../constants'
import { PipetteWizardFlows } from '..'

import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('../../../redux/pipettes')
jest.mock('../getPipetteWizardSteps')
jest.mock('../../../resources/runs/hooks')
jest.mock('@opentrons/react-api-client')
jest.mock('../ExitModal')
jest.mock('../../ProtocolUpload/hooks')

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
const mockUseDeleteRunMutation = useDeleteRunMutation as jest.MockedFunction<
  typeof useDeleteRunMutation
>
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
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('PipetteWizardFlows', () => {
  let props: React.ComponentProps<typeof PipetteWizardFlows>
  const mockCreateRun = jest.fn()
  const mockDeleteRun = jest.fn()
  const mockStopRun = jest.fn()
  const mockCloseCurrentRun = jest.fn()
  const mockChainRunCommands = jest
    .fn()
    .mockImplementation(() => Promise.resolve())
  beforeEach(() => {
    props = {
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
    mockUseDeleteRunMutation.mockReturnValue({
      deleteRun: mockDeleteRun,
    } as any)
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
        section: SECTIONS.ATTACH_STEM,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.DETACH_STEM,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
      {
        section: SECTIONS.RESULTS,
        mount: LEFT,
        flowType: FLOWS.CALIBRATE,
      },
    ])
  })
  it('renders the correct information, calling the correct commands for the calibration flow', async () => {
    const { getByText, getByRole, getByLabelText } = render(props)
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
      expect(mockChainRunCommands).toHaveBeenCalledWith([
        {
          commandType: 'home',
          params: {},
        },
        {
          commandType: 'loadPipette',
          params: {
            mount: LEFT,
            pipetteId: 'abc',
            pipetteName: 'p300_single_gen2',
          },
        },
        {
          commandType: 'calibration/moveToLocation',
          params: { pipetteId: 'abc', location: 'attachOrDetach' },
        },
      ])
      expect(mockCreateRun).toHaveBeenCalled()
    })
    // second page
    getByText('Step 1 / 3')
    getByText('Attach Calibration Stem')
    getByText('Grab your calibration probe, install')
    const initiate = getByRole('button', { name: 'Initiate calibration' })
    fireEvent.click(initiate)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith([
        {
          commandType: 'calibration/moveToLocation',
          params: { pipetteId: 'abc', location: 'probePosition' },
        },
        {
          commandType: 'calibration/calibratePipette',
          params: { mount: 'left' },
        },
        {
          commandType: 'home',
          params: { axes: ['leftZ'] },
        },
        {
          commandType: 'calibration/moveToLocation',
          params: { pipetteId: 'abc', location: 'attachOrDetach' },
        },
      ])
    })
    //  third page
    getByText('Step 2 / 3')
    getByText('Remove Calibration Stem')
    getByText(
      'Now you’ll be guided through removing your calibration stem. Undo the latch to remove the stem'
    )
    const complete = getByRole('button', { name: 'Complete calibration' })
    fireEvent.click(complete)
    await waitFor(() => {
      expect(mockChainRunCommands).toHaveBeenCalledWith([
        {
          commandType: 'home',
          params: {},
        },
      ])
      expect(mockStopRun).toHaveBeenCalled()
    })
    //  last page
    getByText('Step 3 / 3')
    getByText('Pipette Successfully Calibrated')
    const exitButton = getByLabelText('Results_exit')
    fireEvent.click(exitButton)
    await waitFor(() => {
      expect(props.closeFlow).toHaveBeenCalled()
    })
  })
})
