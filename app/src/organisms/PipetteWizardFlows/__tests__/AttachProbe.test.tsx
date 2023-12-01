import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useDeckConfigurationQuery,
} from '@opentrons/react-api-client'
import { LEFT, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mock8ChannelAttachedPipetteInformation,
  mock96ChannelAttachedPipetteInformation,
  mockAttachedPipetteInformation,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { AttachProbe } from '../AttachProbe'

const render = (props: React.ComponentProps<typeof AttachProbe>) => {
  return renderWithProviders(<AttachProbe {...props} />, {
    i18nInstance: i18n,
  })[0]
}
jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseDeckConfigurationQuery = useDeckConfigurationQuery as jest.MockedFunction<
  typeof useDeckConfigurationQuery
>

describe('AttachProbe', () => {
  let props: React.ComponentProps<typeof AttachProbe>
  const refetch = jest.fn(() => Promise.resolve())
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
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [
          {
            ok: true,
            mount: LEFT,
            state: {
              tipDetected: true,
            },
          },
        ],
      } as any,
      refetch,
    } as any)
    mockUseDeckConfigurationQuery.mockReturnValue({
      data: [
        {
          cutoutId: 'cutoutD3',
        } as any,
      ],
    } as any)
  })
  it('returns the correct information, buttons work as expected', async () => {
    const { getByText, getByTestId, getByRole, getByLabelText } = render(props)
    getByText('Attach calibration probe')
    getByText(
      'Take the calibration probe from its storage location. Ensure its collar is unlocked. Push the pipette ejector up and press the probe firmly onto the pipette nozzle. Twist the collar to lock the probe. Test that the probe is secure by gently pulling it back and forth.'
    )
    getByTestId('Pipette_Attach_Probe_1.webm')
    const proceedBtn = getByRole('button', { name: 'Begin calibration' })
    fireEvent.click(proceedBtn)
    expect(refetch).toHaveBeenCalled()
    await waitFor(() => {
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'home',
            params: { axes: ['leftZ'] },
          },
          {
            commandType: 'home',
            params: { skipIfMountPositionOk: 'left' },
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
        'Take the calibration probe from its storage location. Ensure its collar is unlocked. Push the pipette ejector up and press the probe firmly onto the backmost pipette nozzle. Twist the collar to lock the probe. Test that the probe is secure by gently pulling it back and forth.'
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
      'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position.'
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
      'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position.'
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
        'The calibration probe will touch the sides of the calibration square in slot C2 to determine its exact position.'
      )
    ).not.toBeInTheDocument()
  })

  it('renders the error modal screen when errorMessage is true', () => {
    props = {
      ...props,
      errorMessage: 'error shmerror',
    }
    const { getByText } = render(props)
    getByText(
      'Return the calibration probe to its storage location before exiting.'
    )
    getByText('error shmerror')
  })

  it('renders the correct text when is on device', async () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByText, getByTestId, getByRole, getByLabelText } = render(props)
    getByText('Attach calibration probe')
    getByText(
      'Take the calibration probe from its storage location. Ensure its collar is unlocked. Push the pipette ejector up and press the probe firmly onto the pipette nozzle. Twist the collar to lock the probe. Test that the probe is secure by gently pulling it back and forth.'
    )
    getByTestId('Pipette_Attach_Probe_1.webm')
    getByRole('button', { name: 'Begin calibration' }).click()
    expect(refetch).toHaveBeenCalled()
    await waitFor(() => {
      expect(props.chainRunCommands).toHaveBeenCalledWith(
        [
          {
            commandType: 'home',
            params: { axes: ['leftZ'] },
          },
          {
            commandType: 'home',
            params: { skipIfMountPositionOk: 'left' },
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

  it('renders a waste chute warning when 96 channel and waste chute are attached', () => {
    props = {
      ...props,
      attachedPipettes: {
        left: mock96ChannelAttachedPipetteInformation,
        right: null,
      },
    }
    const { getByText } = render(props)
    getByText(
      'Remove the waste chute from the deck plate adapter before proceeding.'
    )
  })
})
