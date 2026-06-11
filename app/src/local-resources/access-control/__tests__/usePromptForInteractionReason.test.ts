import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { usePromptForInteractionReason } from '../usePromptForInteractionReason'
import {
  mockShowDocumentationRequiredModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type ReactRedux from 'react-redux'
import type { DocumentationReport } from '@opentrons/react-api-client'

vi.mock('@opentrons/react-api-client', () => ({
  useAuthSettingsQuery: vi.fn(),
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
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: true,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(mockShowDocumentationRequiredModal).mockResolvedValue(
      mockDocreport
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not prompt when access control is disabled', () => {
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: false,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)

    const { result } = renderHook(
      () => usePromptForInteractionReason(['lpc_flow']),
      {
        wrapper,
      }
    )

    expect(
      !result.current.isLoading && result.current.reasonForInteractionRequired
    ).toBe(false)
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })

  it('does not prompt when access control is enabled but require reason for interaction is disabled', () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: true,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: false,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)
    const { result } = renderHook(
      () => usePromptForInteractionReason(['lpc_flow']),
      {
        wrapper,
      }
    )
    expect(
      !result.current.isLoading && result.current.reasonForInteractionRequired
    ).toBe(false)
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })
  it('prompts for documentation when access control is enabled', async () => {
    const { result } = renderHook(
      () => usePromptForInteractionReason(['lpc_flow']),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(
        !result.current.isLoading && result.current.reasonForInteractionRequired
      ).toBe(true)
      expect(
        !result.current.isLoading &&
          result.current.reasonForInteractionRequired &&
          result.current.docreport
      ).toEqual(mockDocreport)
    })
  })
})
