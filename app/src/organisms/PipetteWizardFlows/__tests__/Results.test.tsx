import * as React from 'react'
import { act, fireEvent, screen } from '@testing-library/react'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { mockAttachedPipetteInformation } from '../../../redux/pipettes/__fixtures__'
import { i18n } from '../../../i18n'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { Results } from '../Results'
import { FLOWS } from '../constants'

jest.mock('@opentrons/react-api-client')

const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>

const render = (props: React.ComponentProps<typeof Results>) => {
  return renderWithProviders(<Results {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Results', () => {
  let props: React.ComponentProps<typeof Results>
  let pipettePromise: Promise<void>
  let mockRefetchInstruments: jest.Mock
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest
        .fn()
        .mockImplementationOnce(() => Promise.resolve()),
      isRobotMoving: false,
      maintenanceRunId: RUN_ID_1,
      attachedPipettes: { left: mockAttachedPipetteInformation, right: null },
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      flowType: FLOWS.CALIBRATE,
      handleCleanUpAndClose: jest.fn(),
      currentStepIndex: 2,
      totalStepCount: 6,
      isOnDevice: false,
      isFetching: false,
      setFetching: jest.fn(),
      hasCalData: false,
    }
    pipettePromise = Promise.resolve()
    mockRefetchInstruments = jest.fn(() => pipettePromise)
    mockUseInstrumentsQuery.mockReturnValue({
      refetch: mockRefetchInstruments,
    } as any)
  })
  it('renders the correct information when pipette cal is a success for calibrate flow', () => {
    props = {
      ...props,
      hasCalData: true,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully recalibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
    getByText('Exit')
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })

  it('renders the correct information when pipette wizard is a success for attach flow', () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully attached')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
    getByText('Calibrate pipette')
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.chainRunCommands).toHaveBeenCalledWith(
      [
        {
          commandType: 'home' as const,
          params: {
            axes: ['leftPlunger'],
          },
        },
        {
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: 'left',
          },
        },
      ],
      true
    )
  })
  it('renders the correct information when pipette wizard is a fail for attach flow', async () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      flowType: FLOWS.ATTACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Unable to detect pipette')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Try again' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchInstruments).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a success for detach flow', () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      currentStepIndex: 6,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette successfully detached')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a fail for detach flow', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL still attached')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Try again' })
  })
  it('renders the error exit as disabled when is Fetching is true', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      isFetching: true,
    }
    const { getByRole } = render(props)
    expect(getByRole('button', { name: 'Results_errorExit' })).toBeDisabled()
  })
  it('does not render error exit when is on device', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      isOnDevice: true,
      isFetching: true,
    }
    expect(
      screen.queryByRole('button', { name: 'Results_errorExit' })
    ).not.toBeInTheDocument()
  })
  it('renders the correct information when pipette wizard is a fail for 96 channel attach flow and gantry not empty', async () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL still attached')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Try again' }).click()
    await act(() => pipettePromise)
  })
  it('renders the correct information when pipette wizard is a success for 96 channel attach flow and gantry not empty', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      attachedPipettes: { left: null, right: null },
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('All pipettes successfully detached')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard succeeds to calibrate in attach flow 96-channel', () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully attached and calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    getByRole('button', { name: 'Results_exit' }).click()
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard succeeds to calibrate in attach flow 96-channel with pipette attached initially ', () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
      currentStepIndex: 9,
      totalStepCount: 9,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully attached and calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    getByRole('button', { name: 'Results_exit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard succeeds to calibrate in attach flow single mount', () => {
    props = {
      ...props,
      flowType: FLOWS.CALIBRATE,
      currentStepIndex: 5,
      totalStepCount: 5,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully attached and calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    getByRole('button', { name: 'Results_exit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information for success pipette cal on ODD', () => {
    props = {
      ...props,
      isOnDevice: true,
      hasCalData: true,
    }
    const { getByText, getByRole } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully recalibrated')
    getByRole('button', { name: 'SmallButton_primary' }).click()
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a fail for attach flow on ODD', async () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      flowType: FLOWS.ATTACH,
      isOnDevice: true,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Unable to detect pipette')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'SmallButton_primary' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchInstruments).toHaveBeenCalled()
  })
  it('renders the correct information when pipette succceeds to attach during run setup', () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
      requiredPipette: {
        id: 'mockId',
        pipetteName: 'p1000_single_gen3',
        mount: LEFT,
      },
    }
    const { getByText } = render(props)
    getByText('Flex 1-Channel 1000 μL successfully attached')
  })
  it('renders the correct information when attaching wrong pipette for run setup', async () => {
    props = {
      ...props,
      flowType: FLOWS.ATTACH,
      requiredPipette: {
        id: 'mockId',
        pipetteName: 'p50_multi_gen3',
        mount: LEFT,
      },
    }
    const { getByText, getByRole } = render(props)
    getByText('Wrong instrument installed')
    getByText('Install Flex 8-Channel 50 μL instead')
    getByRole('button', { name: 'Detach and retry' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchInstruments).toHaveBeenCalled()
  })
})
