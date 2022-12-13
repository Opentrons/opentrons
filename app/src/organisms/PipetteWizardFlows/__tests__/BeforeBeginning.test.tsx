import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedGen3Pipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
// import { NeedHelpLink } from '../../CalibrationPanels'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { BeforeBeginning } from '../BeforeBeginning'
import { FLOWS } from '../constants'
import type { AttachedPipette } from '../../../redux/pipettes/types'

//  TODO(jr, 11/3/22): uncomment out the get help link when we have
//  the correct URL to link it to
// jest.mock('../../CalibrationPanels')
jest.mock('../../../molecules/InProgressModal/InProgressModal')

const mockInProgressModal = InProgressModal as jest.MockedFunction<
  typeof InProgressModal
>
// const mockNeedHelpLink = NeedHelpLink as jest.MockedFunction<
//   typeof NeedHelpLink
// >

const render = (props: React.ComponentProps<typeof BeforeBeginning>) => {
  return renderWithProviders(<BeforeBeginning {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedGen3Pipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('BeforeBeginning', () => {
  let props: React.ComponentProps<typeof BeforeBeginning>
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      robotName: 'otie',
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      runId: RUN_ID_1,
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      createRun: jest.fn(),
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isCreateLoading: false,
      isRobotMoving: false,
    }
    // mockNeedHelpLink.mockReturnValue(<div>mock need help link</div>)
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
  })
  describe('calibrate flow single mount', () => {
    it('returns the correct information for calibrate flow', async () => {
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the rest of the deck and clean up the work area to make attachment and calibration easier. Also gather the needed equipment shown on the right hand side'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the right hand side of the door opening.'
      )
      getByText('You will need:')
      // getByText('mock need help link')
      getByAltText('Calibration Probe')
      const proceedBtn = getByRole('button', { name: 'Get started' })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
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
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
    it('returns the correct information for in progress modal when robot is moving', () => {
      props = {
        ...props,
        isRobotMoving: true,
      }
      const { getByText } = render(props)
      getByText('mock in progress')
    })

    it('continue button is disabled when isCreateLoading is true', () => {
      props = {
        ...props,
        isCreateLoading: true,
      }
      const { getByRole } = render(props)
      const proceedBtn = getByRole('button', { name: 'Get started' })
      expect(proceedBtn).toBeDisabled()
    })

    it('renders the error modal screen when errorMessage is true', () => {
      props = {
        ...props,
        errorMessage: 'error shmerror',
      }
      const { getByText } = render(props)
      getByText('Error encountered')
      getByText('error shmerror')
    })
  })
  describe('attach flow single mount', () => {
    it('renders the modal with all correct text. clicking on proceed button sends commands', async () => {
      props = {
        ...props,
        attachedPipette: { left: null, right: null },
        flowType: FLOWS.ATTACH,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the right-hand side of the door opening.'
      )
      getByAltText('GEN3 Pipette')
      getByText('You will need:')
      getByAltText('Calibration Probe')
      getByAltText('2.5 mm Hex Screwdriver')
      getByText(
        'Provided with robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
  })
  describe('detach flow single mount', () => {
    it('renders the modal with all correct text. clicking on proceed button sends commands for detach flow', async () => {
      props = {
        ...props,
        attachedPipette: { left: mockPipette, right: null },
        flowType: FLOWS.DETACH,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make detachment easier. Also gather the needed equipment shown to the right'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByText(
        'Provided with robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', { name: 'Get started' })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
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
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
  })
  describe('attach flow 96 channel', () => {
    it('renders the modal with all the correct text, clicking on proceed button sends commands for attach flow', async () => {
      props = {
        ...props,
        attachedPipette: { left: null, right: null },
        flowType: FLOWS.ATTACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the right-hand side of the door opening.'
      )
      getByText(
        'The 96-channel pipette is <weight> so be cautious during uninstall. Having a helper near by can be really useful for this process'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByAltText('Calibration Probe')
      getByAltText('96 Channel Pipette')
      getByAltText('96 Channel Mounting Plate')
      getByText(
        'Provided with robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', {
        name: 'Move gantry to front',
      })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: LEFT },
          },
        ],
        false
      )
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
  })
  describe('detach flow 96 channel', () => {
    it('renders the modal with all correct text. clicking on proceed button sends commands for detach flow', async () => {
      props = {
        ...props,
        attachedPipette: { left: mockPipette, right: null },
        flowType: FLOWS.DETACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'The 96-channel pipette is <weight> so be cautious during uninstall. Having a helper near by can be really useful for this process'
      )
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make detachment easier. Also gather the needed equipment shown to the right'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByAltText('Calibration Probe')
      const proceedBtn = getByRole('button', { name: 'Get started' })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
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
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
  })
})
