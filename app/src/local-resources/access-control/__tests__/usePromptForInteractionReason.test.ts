import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { requireDocumentation } from '/app/organisms/DocumentationRequired'

import { usePromptForInteractionReason } from '../usePromptForInteractionReason'

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

const mockDocreport: DocumentationReport = {
  note: 'starting maintenance for QC',
  confirmedAt: '2026-05-01T16:00:00.000Z',
  documentedBy: 'alice',
}

describe('usePromptForInteractionReason', () => {
  beforeEach(() => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(requireDocumentation).mockResolvedValue(mockDocreport)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not prompt when access control is disabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)

    const { result } = renderHook(() => usePromptForInteractionReason())

    expect(result.current.accessControlEnabled).toBe(false)
    expect(requireDocumentation).not.toHaveBeenCalled()
  })

  it('prompts for documentation when access control is enabled', async () => {
    const { result } = renderHook(() => usePromptForInteractionReason())

    await waitFor(() => {
      expect(requireDocumentation).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.accessControlEnabled).toBe(true)
      expect(
        result.current.accessControlEnabled && result.current.docreport
      ).toEqual(mockDocreport)
    })
  })
})
