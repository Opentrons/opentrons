import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { usePipettesQuery } from '@opentrons/react-api-client'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { i18n } from '../../../i18n'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { Results } from '../Results'
import { FLOWS } from '../constants'

import type { AttachedPipette } from '../../../redux/pipettes/types'

jest.mock('@opentrons/react-api-client')

const mockUsePipettesQuery = usePipettesQuery as jest.MockedFunction<
  typeof usePipettesQuery
>

const render = (props: React.ComponentProps<typeof Results>) => {
  return renderWithProviders(<Results {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockPipette: AttachedPipette = {
  ...mockAttachedPipette,
  modelSpecs: mockGen3P1000PipetteSpecs,
}
describe('Results', () => {
  let props: React.ComponentProps<typeof Results>
  let pipettePromise: Promise<void>
  let mockRefetchPipette: jest.Mock
  beforeEach(() => {
    props = {
      selectedPipette: SINGLE_MOUNT_PIPETTES,
      robotName: 'otie',
      mount: LEFT,
      goBack: jest.fn(),
      proceed: jest.fn(),
      chainRunCommands: jest.fn(),
      isRobotMoving: false,
      runId: RUN_ID_1,
      attachedPipettes: { left: mockPipette, right: null },
      errorMessage: null,
      setShowErrorMessage: jest.fn(),
      flowType: FLOWS.CALIBRATE,
      handleCleanUpAndClose: jest.fn(),
      currentStepIndex: 2,
      totalStepCount: 6,
    }
    pipettePromise = Promise.resolve()
    mockRefetchPipette = jest.fn(() => pipettePromise)
    mockUsePipettesQuery.mockReturnValue({ refetch: mockRefetchPipette } as any)
  })
  it('renders the correct information when pipette cal is a success for calibrate flow', () => {
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette Successfully Attached and Calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
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
    getByText('P1000 Single-Channel GEN3 Successfully Attached')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${String(COLORS.successEnabled)}`
    )
    getByText('Calibrate pipette')
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.proceed).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a fail for attach flow', async () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      flowType: FLOWS.ATTACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette failed to attach')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchPipette).toHaveBeenCalled()
  })
  it('renders the try again button when fail to attach and clicking on buton several times renders the warning subheader', async () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      flowType: FLOWS.ATTACH,
    }
    const { getByText, getByRole } = render(props)
    getByText('exit')
    getByText('Detach and retry')
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchPipette).toHaveBeenCalled()
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchPipette).toHaveBeenCalled()
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    //  warning subheader after clicking on try again 3 times
    getByText(
      'There may be a problem with your pipette. Exit setup and contact Opentrons Support for assistance.'
    )
    getByRole('button', { name: 'Results_errorExit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the try again button when fail to detach and clicking on buton several times renders the warning subheader', async () => {
    props = {
      ...props,
      attachedPipettes: { left: mockPipette, right: null },
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByRole } = render(props)
    getByText('exit')
    getByText('Attach and retry')
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchPipette).toHaveBeenCalled()
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    expect(mockRefetchPipette).toHaveBeenCalled()
    getByRole('button', { name: 'Results_tryAgain' }).click()
    await act(() => pipettePromise)
    //  warning subheader after clicking on try again 3 times
    getByText(
      'There may be a problem with your pipette. Exit setup and contact Opentrons Support for assistance.'
    )
    getByRole('button', { name: 'Results_errorExit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a success for detach flow', () => {
    props = {
      ...props,
      attachedPipettes: { left: null, right: null },
      currentStepIndex: 6,
      flowType: FLOWS.DETACH,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette Successfully Detached')
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
    getByText('Pipette Still Attached')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Results_tryAgain' })
  })
  it('renders the correct information when pipette wizard is a fail for 96 channel attach flow and gantry not empty', async () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette Still Attached')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    getByRole('button', { name: 'Results_tryAgain' }).click()
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
    getByText('All Pipettes Successfully Detached')
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
    getByText('Pipette Successfully Attached and Calibrated')
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
    getByText('Pipette Successfully Attached and Calibrated')
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
    getByText('Pipette Successfully Attached and Calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    getByRole('button', { name: 'Results_exit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
})
