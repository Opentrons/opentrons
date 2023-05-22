import * as React from 'react'
import { fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, NINETY_SIX_CHANNEL, RIGHT } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { MountingPlate } from '../MountingPlate'

const render = (props: React.ComponentProps<typeof MountingPlate>) => {
  return renderWithProviders(<MountingPlate {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('MountingPlate', () => {
  let props: React.ComponentProps<typeof MountingPlate>
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
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      selectedPipette: NINETY_SIX_CHANNEL,
      isOnDevice: false,
    }
  })
  it('returns the correct information, buttons work as expected for attach flow', () => {
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Attach Mounting Plate')
    getByText(
      'Attach the mounting plate by aligning the pins on the plate to the slots on the gantry carriage. You may need to adjust the position of the right pipette mount to achieve proper alignment.'
    )
    getByAltText('Attach mounting plate')
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.proceed).toHaveBeenCalled()
    const backBtn = getByLabelText('back')
    fireEvent.click(backBtn)
    expect(props.goBack).toHaveBeenCalled()
  })

  it('returns the correct information, buttons work as expected for detach flow', async () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Loosen Screws and Detach Mounting Plate')
    getByText(
      'Hold onto the plate so it does not fall. Then remove the pins on the plate from the slots on the gantry carriage.'
    )
    getByAltText('Detach mounting plate')
    const proceedBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(proceedBtn)
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'calibration/moveToMaintenancePosition',
          params: {
            mount: RIGHT,
          },
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
})
