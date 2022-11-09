import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import {
  mockAttachedPipette,
  mockP300PipetteSpecs,
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
  modelSpecs: mockP300PipetteSpecs,
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
      attachedPipette: { left: mockPipette, right: null },
      flowType: FLOWS.CALIBRATE,
      setIsBetweenCommands: jest.fn(),
      isRobotMoving: false,
      isExiting: false,
    }
  })
  it('returns the correct information, buttons work as expected', async () => {
    const { getByText, getByAltText, getByRole } = render(props)
    getByText('Attach Calibration Probe')
    getByText(
      'Take the calibration probe from its storage location. Make sure its latch is in the unlocked (straight) position. Press the probe firmly onto the pipette nozzle and then lock the latch. Then test that the probe is securely attached by gently pulling it back and forth.'
    )
    getByAltText('Attach probe')
    const proceedBtn = getByRole('button', { name: 'Initiate calibration' })
    fireEvent.click(proceedBtn)
    expect(props.setIsBetweenCommands).toHaveBeenCalled()
    expect(props.chainRunCommands).toHaveBeenCalledWith([
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
    await waitFor(() => {
      expect(props.setIsBetweenCommands).toHaveBeenCalled()
      expect(props.proceed).toHaveBeenCalled()
    })

    const backBtn = getByRole('button', { name: 'Go back' })
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })

  it('returns the correct information when robot is in motion', () => {
    props = {
      ...props,
      isRobotMoving: true,
    }
    const { getByText, getByAltText } = render(props)
    getByText('Stand Back, Pipette is Calibrating')
    getByText(
      'The calibration probe will touch the sides of the calibration divot in slot 5 to determine its exact position'
    )
    getByAltText('Pipette is calibrating')
  })
})
