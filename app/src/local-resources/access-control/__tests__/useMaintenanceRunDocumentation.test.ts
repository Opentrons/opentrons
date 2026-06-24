import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { useMaintenanceRunDocumentation } from '../useMaintenanceRunDocumentation'
import { isDocumentationProvided } from '../utils'
import {
  mockShowDocumentationRequiredModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type ReactRedux from 'react-redux'
import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

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
    useCurrentUsername: vi.fn(() => 'alice'),
    useCurrentRobotName: vi.fn(() => 'otie'),
  }
})

const mockDocreport = 'starting calibration' as DocumentationReport
const wrapper = wrapWithDocumentationRequiredModal()

describe('isDocumentationProvided', () => {
  it('returns true when access control is disabled', () => {
    const state: DocumentationState = {
      reasonForInteractionRequired: false,
      isLoading: false,
    }

    expect(isDocumentationProvided(state)).toBe(true)
  })

  it('returns true when documentation is provided', () => {
    const state: DocumentationState = {
      reasonForInteractionRequired: true,
      docreport: mockDocreport,
      isLoading: false,
    }

    expect(isDocumentationProvided(state)).toBe(true)
  })

  it('returns false when access control is enabled and documentation is missing', () => {
    const state: DocumentationState = {
      reasonForInteractionRequired: true,
      docreport: null,
      askForDocumentation: vi.fn(),
      isLoading: false,
    }

    expect(isDocumentationProvided(state)).toBe(false)
  })
})

describe('useMaintenanceRunDocumentation', () => {
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

  it('auto-prompts for command documentation but not for deletion', async () => {
    const { result } = renderHook(
      () => useMaintenanceRunDocumentation('lpc_flow'),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(
        !result.current.commandDocState.isLoading &&
          result.current.commandDocState.reasonForInteractionRequired &&
          result.current.commandDocState.docreport
      ).toEqual(mockDocreport)
    })

    expect(
      !result.current.deletionDocState.isLoading &&
        result.current.deletionDocState.reasonForInteractionRequired
    ).toBe(true)
    expect(
      !result.current.deletionDocState.isLoading &&
        result.current.deletionDocState.reasonForInteractionRequired &&
        result.current.deletionDocState.docreport
    ).toBeNull()
    expect(
      !result.current.deletionDocState.isLoading &&
        result.current.deletionDocState.reasonForInteractionRequired &&
        result.current.deletionDocState.docreport == null &&
        result.current.deletionDocState.askForDocumentation
    ).toBeDefined()
  })

  it('prompts for deletion documentation only when askForDocumentation is invoked', async () => {
    const { result } = renderHook(
      () => useMaintenanceRunDocumentation('lpc_flow'),
      {
        wrapper,
      }
    )

    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })

    await act(async () => {
      if (
        !result.current.deletionDocState.isLoading &&
        result.current.deletionDocState.reasonForInteractionRequired &&
        result.current.deletionDocState.docreport == null
      ) {
        await result.current.deletionDocState.askForDocumentation(
          result.current.actionsToDocument
        )
      }
    })

    expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(2)
  })
})
