import * as React from 'react'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { screen, renderHook } from '@testing-library/react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_RUNNING,
  RUN_STATUS_STOP_REQUESTED,
} from '@opentrons/api-client'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../i18n'
import { ErrorRecoveryFlows, useErrorRecoveryFlows } from '..'
import { ErrorRecoveryWizard } from '../ErrorRecoveryWizard'
import { useCurrentlyFailedRunCommand } from '../utils'

import type { RunStatus } from '@opentrons/api-client'

vi.mock('../ErrorRecoveryWizard')
vi.mock('../utils')

describe('useErrorRecovery', () => {
  beforeEach(() => {
    vi.mocked(useCurrentlyFailedRunCommand).mockReturnValue(
      'mockCommand' as any
    )
  })

  it('should have initial state of isEREnabled as false', () => {
    const { result } = renderHook(() =>
      useErrorRecoveryFlows('MOCK_ID', RUN_STATUS_RUNNING)
    )

    expect(result.current.isERActive).toBe(false)
  })

  it('should toggle the value of isEREnabled properly when the run status is valid', () => {
    const { result } = renderHook(() =>
      useErrorRecoveryFlows('MOCK_ID', RUN_STATUS_AWAITING_RECOVERY)
    )

    expect(result.current.isERActive).toBe(true)

    const { result: resultStopRequested } = renderHook(() =>
      useErrorRecoveryFlows('MOCK_ID', RUN_STATUS_STOP_REQUESTED)
    )

    expect(resultStopRequested.current.isERActive).toBe(true)
  })

  it('should disable error recovery when runStatus is not a valid ER run status', () => {
    const { result } = renderHook(
      (runStatus: RunStatus) => useErrorRecoveryFlows('MOCK_ID', runStatus),
      {
        initialProps: RUN_STATUS_RUNNING,
      }
    )

    expect(result.current.isERActive).toBe(false)
  })

  it('should return the failed run command', () => {
    const { result } = renderHook(() =>
      useErrorRecoveryFlows('MOCK_ID', RUN_STATUS_RUNNING)
    )

    expect(result.current.failedCommand).toEqual('mockCommand')
  })
})

const render = (props: React.ComponentProps<typeof ErrorRecoveryFlows>) => {
  return renderWithProviders(<ErrorRecoveryFlows {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ErrorRecovery', () => {
  let props: React.ComponentProps<typeof ErrorRecoveryFlows>

  beforeEach(() => {
    props = {
      failedCommand: {} as any,
      runId: 'MOCK_RUN_ID',
    }
    vi.mocked(ErrorRecoveryWizard).mockReturnValue(<div>MOCK WIZARD</div>)
  })

  //TOME: Render an dpress the button when designs are updated.
  // it(`renders the wizard when the wizard is toggled on`, () => {
  //   render(props)
  //   screen.getByText('MOCK WIZARD')
  // })
})
