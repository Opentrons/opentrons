import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { usePromptForInteractionReason } from '../usePromptForInteractionReason'
import {
  mockShowDocumentationRequiredModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type ReactRedux from 'react-redux'
import type { DocumentationReport } from '@opentrons/react-api-client'

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

const mockDocreport = 'starting calibration' as DocumentationReport
const wrapper = wrapWithDocumentationRequiredModal()

describe('usePromptForInteractionReason', () => {
  beforeEach(() => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: true } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(mockShowDocumentationRequiredModal).mockResolvedValue(
      mockDocreport
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not prompt when access control is disabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: { data: { accessControlEnabled: false } },
    } as ReturnType<typeof useAccessControlEnabledQuery>)

    const { result } = renderHook(() => usePromptForInteractionReason(), {
      wrapper,
    })

    expect(result.current.accessControlEnabled).toBe(false)
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })

  it('prompts for documentation when access control is enabled', async () => {
    const { result } = renderHook(() => usePromptForInteractionReason(), {
      wrapper,
    })

    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(result.current.accessControlEnabled).toBe(true)
      expect(
        result.current.accessControlEnabled && result.current.docreport
      ).toEqual(mockDocreport)
    })
  })
})
