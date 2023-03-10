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
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { Carriage } from '../Carriage'

import type { AttachedPipette } from '../../../redux/pipettes/types'

const render = (props: React.ComponentProps<typeof Carriage>) => {
  return renderWithProviders(<Carriage {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('Carriage', () => {
  let props: React.ComponentProps<typeof Carriage>
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
      flowType: FLOWS.ATTACH,
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      isRobotMoving: false,
      selectedPipette: NINETY_SIX_CHANNEL,
      isOnDevice: false,
    }
  })
  it('returns the correct information, buttons work as expected when flow is attach', () => {
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Unscrew Z-axis Carriage')
    getByText(
      'Loosen the captive screw on the top right of the gantry carriage. This will release the right pipette mount, which should then freely move up and down.'
    )
    getByAltText('Unscrew gantry')
    getByRole('button', { name: 'Continue' })
    getByLabelText('back').click()
    expect(props.goBack).toHaveBeenCalled()
  })
  it('renders the correct button when is the on device display', () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByLabelText } = render(props)
    getByLabelText('SmallButton_default')
  })
  it('returns the correct information, buttons work as expected when flow is detach', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByAltText, getByRole, getByLabelText } = render(props)
    getByText('Reattach Z-axis Carriage')
    getByText(
      'Push the right pipette mount up to the top of the z-axis. Then tighten the captive screw at the top right of the gantry carriage.'
    )
    getByText(
      'When reattached, the right mount should no longer freely move up and down.'
    )
    getByAltText('Reattach carriage')
    getByRole('button', { name: 'Continue' })
    getByLabelText('back').click()
    expect(props.goBack).toHaveBeenCalled()
  })
  it('renders null if a single mount pipette is attached', () => {
    props = {
      ...props,
      selectedPipette: SINGLE_MOUNT_PIPETTES,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('renders null if flow is calibrate is attached', () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
    }
    const { container } = render(props)
    expect(container.firstChild).toBeNull()
  })
  it('clicking on continue button executes the commands correctly', async () => {
    const { getByRole } = render(props)
    const contBtn = getByRole('button', { name: 'Continue' })
    fireEvent.click(contBtn)
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home',
          params: {
            axes: 'rightZ',
          },
        },
      ],
      false
    )
    await waitFor(() => {
      expect(props.proceed).toHaveBeenCalled()
    })
  })
})
