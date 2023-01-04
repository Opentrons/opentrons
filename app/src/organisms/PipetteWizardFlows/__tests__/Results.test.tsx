import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import {
  LEFT,
  NINETY_SIX_CHANNEL,
  SINGLE_MOUNT_PIPETTES,
} from '@opentrons/shared-data'
import { COLORS, renderWithProviders } from '@opentrons/components'
import {
  mockAttachedPipette,
  mockGen3P1000PipetteSpecs,
} from '../../../redux/pipettes/__fixtures__'
import { i18n } from '../../../i18n'
import { RUN_ID_1 } from '../../RunTimeControl/__fixtures__'
import { Results } from '../Results'
import { FLOWS } from '../constants'

import type { AttachedPipette } from '../../../redux/pipettes/types'

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
  })
  it('renders the correct information when pipette cal is a success for calibrate flow', () => {
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette Successfully Calibrated')
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
  it('renders the correct information when pipette wizard is a fail for attach flow', () => {
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
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
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
    getByText('Pipette failed to detach')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a fail for 96 channel attach flow and gantry not empty', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette failed to detach')
    expect(getByLabelText('ot-alert')).toHaveStyle(
      `color: ${String(COLORS.errorEnabled)}`
    )
    const exit = getByRole('button', { name: 'Results_exit' })
    fireEvent.click(exit)
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
  it('renders the correct information when pipette wizard is a success for 96 channel attach flow and gantry not empty', () => {
    props = {
      ...props,
      flowType: FLOWS.DETACH,
      attachedPipettes: { left: null, right: null },
      selectedPipette: NINETY_SIX_CHANNEL,
    }
    const { getByText, getByRole, getByLabelText } = render(props)
    getByText('Pipette Successfully Detached')
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
    getByText('Pipette Successfully Calibrated')
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
    getByText('Pipette Successfully Calibrated')
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
    getByText('Pipette Successfully Calibrated')
    expect(getByLabelText('ot-check')).toHaveStyle(
      `color: ${COLORS.successEnabled}`
    )
    getByRole('button', { name: 'Results_exit' }).click()
    expect(props.handleCleanUpAndClose).toHaveBeenCalled()
  })
})
