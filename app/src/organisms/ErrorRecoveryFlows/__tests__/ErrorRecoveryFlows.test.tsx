import * as React from 'react'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import { screen, renderHook, act } from '@testing-library/react'

import {
  RUN_STATUS_AWAITING_RECOVERY,
  RUN_STATUS_RUNNING,
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

  it('should toggle the value of isEREnabled properly', () => {
    const { result } = renderHook(() =>
      useErrorRecoveryFlows('MOCK_ID', RUN_STATUS_AWAITING_RECOVERY)
    )
    act(() => {
      result.current.toggleER()
    })

    expect(result.current.isERActive).toBe(true)

    act(() => {
      result.current.toggleER()
    })

    expect(result.current.isERActive).toBe(false)
  })

  it('should disable error recovery when runStatus is not "awaiting-recovery"', () => {
    const { result, rerender } = renderHook(
      (runStatus: RunStatus) => useErrorRecoveryFlows('MOCK_ID', runStatus),
      {
        initialProps: RUN_STATUS_AWAITING_RECOVERY,
      }
    )

    act(() => {
      result.current.toggleER()
    })

    // @ts-expect-error "running" is a valid status here
    rerender(RUN_STATUS_RUNNING)

    expect(result.current.isERActive).toBe(false)

    act(() => {
      result.current.toggleER()
    })

    rerender(RUN_STATUS_AWAITING_RECOVERY)

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

  it(`renders the wizard`, () => {
    render(props)
    screen.getByText('MOCK WIZARD')
  })
})
