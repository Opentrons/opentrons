import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { requireDocumentation } from '/app/organisms/DocumentationRequired'

import { useGuardedAction } from '../useGuardedAction'

import type ReactRedux from 'react-redux'
import type { DocumentationReport } from '../types'

vi.mock('@opentrons/react-api-client', () => ({
  useAccessControlEnabledQuery: vi.fn(),
}))

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal<typeof ReactRedux>()

  return {
    ...actual,
    useSelector: (selector: (state: unknown) => unknown) => selector({}),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    getCurrentUsernameForLocalRobot: vi.fn(() => null),
  }
})

vi.mock('/app/organisms/DocumentationRequired', () => ({
  requireDocumentation: vi.fn(),
}))

describe('useGuardedAction', () => {
  beforeEach(() => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('skips both guards when access control is disabled', async () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)

    const { result } = renderHook(() => useGuardedAction())

    const currentResult = await act(() => !result.current.accessControlEnabled)
    expect(currentResult).toBe(true)
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('skips guards when documentation is provided', async () => {
    const docreport: DocumentationReport = {
      note: 'starting run for QC',
      confirmedAt: '2026-05-01T16:00:00.000Z',
      documentedBy: 'alice',
    }

    const { result } = renderHook(() => useGuardedAction(docreport))

    expect(result.current.accessControlEnabled).toBe(true)
    expect(
      result.current.accessControlEnabled && result.current.docreport
    ).toBe(docreport)
  })

  it('returns callback to open modal when documentation is not provided', async () => {
    const { result } = renderHook(() => useGuardedAction())

    expect(result.current.accessControlEnabled).toBe(true)
    expect(
      result.current.accessControlEnabled && result.current.docreport
    ).toBeNull()
    expect(
      result.current.accessControlEnabled &&
        result.current.docreport == null &&
        result.current.askForDocumentation
    ).toBeDefined()
  })
})
