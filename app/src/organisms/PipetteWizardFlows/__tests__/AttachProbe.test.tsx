import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { LEFT, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mock8ChannelAttachedPipetteInformation,
  mock96ChannelAttachedPipetteInformation,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { CalibrationErrorModal } from '../CalibrationErrorModal'
import { FLOWS } from '../constants'
import { AttachProbe } from '../AttachProbe'

jest.mock('../CalibrationErrorModal')

const mockCalibrationErrorModal = CalibrationErrorModal as jest.MockedFunction<
  typeof CalibrationErrorModal
>

const render = (props: React.ComponentProps<typeof AttachProbe>) => {
  return renderWithProviders(<AttachProbe {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachProbe', () => {
  let props: React.ComponentProps<typeof AttachProbe>
  beforeEach(() => {
    props = {
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      maintenanceRunId: RUN_ID_1,
      attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
      flowType: FLOWS.CALIBRATE,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      isExiting: false,
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      isOnDevice: false,
    }
    mockCalibrationErrorModal.mockReturnValue(
      <div>mock calibration error modal</div>
    )
  })
  it('returns the correct information, buttons work as expected', async () => {
    const { getByText, getByTestId, getByRole, getByLabelText } = render(props)
    getByText('Attach calibration probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByTestId('Pipette_Attach_Probe_1.webm')
    const proceedBtn = getByRole('button', { name: 'Begin calibration' })
    fireEvent.click(proceedBtn)
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home',
          params: { axes: ['leftZ'] },
        },
        {
          commandType: 'calibration/calibratePipette',
          params: { mount: 'left' },
        },
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: { mount: 'left' },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })

    const backBtn = getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })

  it('returns the correct info when the pipette is a 8 channel', () => {
    props = {
      ...props,
      attachedPipettes: {
        left: mock8ChannelAttachedPipetteInformation,
        right: null,
      },
    }
    const { getByText } = render(props)
    getByText(
      nestedTextMatcher(
        'backmost pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
      )
    )
  })

  it('returns the correct information when robot is in motion for single channel', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText, getByTestId } = render(props)
    getByText('Stand back, Flex 1-Channel 1000 μL is calibrating')
    getByText(
      'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position'
    )
    getByTestId('Pipette_Probing_1.webm')
  })

  it('returns the correct information when robot is in motion for 96 channel', () => {
    props = {
      ...props,
      attachedPipettes: {
        left: mock96ChannelAttachedPipetteInformation,
        right: null,
      },
      isRobotMoving: true,
    }
    const { getByText, getByTestId } = render(props)
    getByText('Stand back, Flex 96-Channel 1000 μL is calibrating')
    getByText(
      'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position'
    )
    getByTestId('Pipette_Probing_96.webm')
  })

  it('returns the correct information when robot is in motion during exiting', () => {
    props = {
      ...props,
      isRobotMoving: true,
      isExiting: true,
    }
    const { getByText } = render(props)
    getByText('Stand back, robot is in motion')
    expect(
      screen.queryByText(
        'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position'
      )
    ).not.toBeInTheDocument()
  })

  it('renders the error modal screen when errorMessage is true', () => {
    props = {
      ...props,
      errorMessage: 'error shmerror',
    }
    const { getByText } = render(props)
    getByText('mock calibration error modal')
  })

  it('renders the correct text when is on device', async () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByText, getByTestId, getByRole, getByLabelText } = render(props)
    getByText('Attach calibration probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByTestId('Pipette_Attach_Probe_1.webm')
    getByRole('button', { name: 'Begin calibration' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home',
          params: { axes: ['leftZ'] },
        },
        {
          commandType: 'calibration/calibratePipette',
          params: { mount: 'left' },
        },
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: { mount: 'left' },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
    getByLabelText('back').click()
    expect(props.goBack).toHaveBeenCalled()
  })

  it('does not render the goBack button when following a results screen from attach flow', () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
    }
    expect(screen.queryByLabelText('back')).not.toBeInTheDocument()
  })
})
