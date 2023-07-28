import * as React from 'react'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { LEFT, NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { FLOWS } from '../constants'
import { Carriage } from '../Carriage'

const render = (props: React.ComponentProps<typeof Carriage>) => {
  return renderWithProviders(<Carriage {...props} />, {
    i18nInstance: i18n,
  })[0]
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
  it('returns the correct information, buttons work as expected when flow is attach', () => {
    const { getByText, getByTestId, getByRole } = render(props)
    getByText('Unscrew z-axis carriage')
    getByTestId('Pipette_Zaxis_Attach_96.webm')
    getByRole('button', { name: 'Continue' })
    expect(screen.queryByLabelText('back')).not.toBeInTheDocument()
  })
  it('renders the correct button when is the on device display', () => {
    props = {
      ...props,
      isOnDevice: true,
    }
    const { getByLabelText } = render(props)
    getByLabelText('SmallButton_primary')
  })
  it('returns the correct information, buttons work as expected when flow is detach', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByTestId, getByText, getByRole, getByLabelText } = render(props)
    getByText('Reattach z-axis carriage')
    getByText(
      'Push the right pipette mount up to the top of the z-axis. Then tighten the captive screw at the top right of the gantry carriage.'
    )
    getByText(
      'When reattached, the right mount should no longer freely move up and down.'
    )
    getByTestId('Pipette_Zaxis_Detach_96.webm')
    getByRole('button', { name: 'Continue' })
    getByLabelText('back').click()
    expect(props.goBack).toHaveBeenCalled()
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
            axes: ['rightZ'],
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
