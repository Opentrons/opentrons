import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { LEFT, SINGLE_MOUNT_PIPETTES } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockGen3P1000Pipette8ChannelSpecs,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { AttachProbe } from '../AttachProbe'
import type { AttachedPipette } from '../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof AttachProbe>) => {
  return renderWithProviders(<AttachProbe {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
const mock8ChannelPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000Pipette8ChannelSpecs,
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
      runId: RUN_ID_1,
      attachedPipettes: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      isExiting: false,
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      isOnDevice: false,
    }
  })
  it('returns the correct information, buttons work as expected', async () => {
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Attach Calibration Probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the A1 (back left corner) pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByAltText('Attach probe')
    const proceedBtn = getByRole('button', { name: 'Begin calibration' })
    fireEvent.click(proceedBtn)
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
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
      attachedPipettes: { left: mock8ChannelPipette, right: null },
    }
    const { getByText } = render(props)
    getByText(
      nestedTextMatcher(
        'backmost pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
      )
    )
  })

  it('returns the correct information when robot is in motion', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText, getByAltText } = render(props)
    getByText(
      'Stand back, connect and secure, Flex 1-Channel 1000 μL is calibrating'
    )
    getByText(
      'The calibration probe will touch the sides of the calibration square in slot 2 to determine its exact position'
    )
    getByAltText('Pipette is calibrating')
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

  it('renders the correct text when is on device', async () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Attach Calibration Probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the A1 (back left corner) pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByAltText('Attach probe')
    getByRole('button', { name: 'Begin calibration' }).click()
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
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
})
