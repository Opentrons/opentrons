import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  RIGHT,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import { InProgressModal } from '../../../molecules/InProgressModal/InProgressModal'
// import { NeedHelpLink } from '../../CalibrationPanels'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { BeforeBeginning } from '../BeforeBeginning'
import { FLOWS } from '../constants'
import { getIsGantryEmpty } from '../utils'

//  TODO(jr, 11/3/22): uncomment out the get help link when we have
//  the correct URL to link it to
// jest.mock('../../CalibrationPanels')
jest.mock('../../../molecules/InProgressModal/InProgressModal')
jest.mock('../utils')

const mockGetIsGantryEmpty = getIsGantryEmpty as jest.MockedFunction<
  typeof getIsGantryEmpty
>
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

describe('BeforeBeginning', () => {
  let props: React.ComponentProps<typeof BeforeBeginning>
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      maintenanceRunId: RUN_ID_1,
      attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
      flowType: FLOWS.CALIBRATE,
      createMaintenanceRun: jest.fn(),
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isCreateLoading: false,
      isRobotMoving: false,
      isOnDevice: false,
    }
    // mockNeedHelpLink.mockReturnValue(<div>mock need help link</div>)
    mockInProgressModal.mockReturnValue(<div>mock in progress</div>)
    mockGetIsGantryEmpty.mockReturnValue(false)
  })
  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('calibrate flow single mount', () => {
    it('returns the correct information for calibrate flow', async () => {
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
      )
      getByText('You will need:')
      // getByText('mock need help link')
      getByAltText('Calibration Probe')
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
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
          { commandType: 'home' as const, params: {} },
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
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
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
        attachedPipettes: { left: null, right: null },
        flowType: FLOWS.ATTACH,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
      )
      getByAltText('1- or 8-Channel Pipette')
      getByText('You will need:')
      getByAltText('Calibration Probe')
      getByAltText('2.5 mm Hex Screwdriver')
      getByText(
        'Provided with the robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          { commandType: 'home' as const, params: {} },
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
        attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
        flowType: FLOWS.DETACH,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make detachment easier. Also gather the needed equipment shown to the right.'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByText(
        'Provided with the robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
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
          { commandType: 'home' as const, params: {} },
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
    it('renders the modal with all the correct text, clicking on proceed button sends commands for attach flow with an empty gantry', async () => {
      mockGetIsGantryEmpty.mockReturnValue(true)
      props = {
        ...props,
        attachedPipettes: { left: null, right: null },
        flowType: FLOWS.ATTACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
      )
      getByText(
        'The 96-Channel Pipette is heavy (~10kg). Ask a labmate for help, if needed.'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByAltText('Calibration Probe')
      getByAltText('96-Channel Pipette')
      getByAltText('96-Channel Mounting Plate')
      getByText(
        'Provided with the robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', {
        name: 'Move gantry to front',
      })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: RIGHT },
          },
        ],
        false
      )
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
    it('renders the 96 channel flow when there is a pipette on the gantry on the right mount', async () => {
      mockGetIsGantryEmpty.mockReturnValue(false)
      props = {
        ...props,
        mount: RIGHT,
        attachedPipettes: { left: null, right: mockAttachedPipetteInformation },
        flowType: FLOWS.ATTACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
      )
      getByText(
        'The 96-Channel Pipette is heavy (~10kg). Ask a labmate for help, if needed.'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByAltText('Calibration Probe')
      getByAltText('96-Channel Pipette')
      getByAltText('96-Channel Mounting Plate')
      getByText(
        'Provided with the robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', {
        name: 'Move gantry to front',
      })
      fireEvent.click(proceedBtn)
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'loadPipette',
            params: {
              mount: RIGHT,
              pipetteId: 'abc',
              pipetteName: 'p1000_single_gen3',
            },
          },
          { commandType: 'home' as const, params: {} },
          {
            commandType: 'calibration/moveToMaintenancePosition',
            params: { mount: RIGHT },
          },
        ],
        false
      )
      await waitFor(() => {
        expect(props.proceed).toHaveBeenCalled()
      })
    })
    it('renders the 96 channel flow when there is a pipette on the gantry on the left mount', async () => {
      mockGetIsGantryEmpty.mockReturnValue(false)
      props = {
        ...props,
        attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
        flowType: FLOWS.ATTACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make attachment and calibration easier. Also gather the needed equipment shown to the right.'
      )
      getByText(
        'The calibration probe is included with the robot and should be stored on the front pillar of the robot.'
      )
      getByText(
        'The 96-Channel Pipette is heavy (~10kg). Ask a labmate for help, if needed.'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      getByAltText('Calibration Probe')
      getByAltText('96-Channel Pipette')
      getByAltText('96-Channel Mounting Plate')
      getByText(
        'Provided with the robot. Using another size can strip the instruments’s screws.'
      )
      const proceedBtn = getByRole('button', {
        name: 'Move gantry to front',
      })
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
          { commandType: 'home' as const, params: {} },
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
    it('renders the banner for 96 channel with correct info for on device display', () => {
      props = {
        ...props,
        attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
        flowType: FLOWS.DETACH,
        selectedPipette: NINETY_SIX_CHANNEL,
        isOnDevice: true,
      }
      const { getByLabelText, getByText } = render(props)
      getByLabelText('icon_warning')
      getByText('Before you begin')
      getByText(
        'The 96-Channel Pipette is heavy (~10kg). Ask a labmate for help, if needed.'
      )
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make detachment easier. Also gather the needed equipment shown to the right.'
      )
    })
    it('renders the modal with all correct text. clicking on proceed button sends commands for detach flow', async () => {
      props = {
        ...props,
        attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
        flowType: FLOWS.DETACH,
        selectedPipette: NINETY_SIX_CHANNEL,
      }
      const { getByText, getByAltText, getByRole } = render(props)
      getByText('Before you begin')
      getByText(
        'The 96-Channel Pipette is heavy (~10kg). Ask a labmate for help, if needed.'
      )
      getByText(
        'To get started, remove labware from the deck and clean up the working area to make detachment easier. Also gather the needed equipment shown to the right.'
      )
      getByAltText('2.5 mm Hex Screwdriver')
      const proceedBtn = getByRole('button', { name: 'Move gantry to front' })
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
          { commandType: 'home' as const, params: {} },
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
