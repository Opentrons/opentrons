import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useAuditSettingsQuery,
} from '@opentrons/react-api-client'

import {
  ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  createReasonRequiredWithDocReport,
  createReasonRequiredWithoutDocReport,
} from '../__fixtures__/documentationState'
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
  useAuditSettingsQuery: vi.fn(),
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
    useCurrentRobotName: vi.fn(() => 'otie'),
    useUsernameForRobot: vi.fn(() => 'alice'),
  }
})

const mockDocreport = 'starting calibration' as DocumentationReport
const wrapper = wrapWithDocumentationRequiredModal()

describe('isDocumentationProvided', () => {
  it('returns true when access control is disabled', () => {
    const state: DocumentationState =
      ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE

    expect(isDocumentationProvided(state)).toBe(true)
  })

  it('returns true when documentation is provided', () => {
    const state: DocumentationState =
      createReasonRequiredWithDocReport(mockDocreport)

    expect(isDocumentationProvided(state)).toBe(true)
  })

  it('returns false when access control is enabled and documentation is missing', () => {
    const state: DocumentationState = createReasonRequiredWithoutDocReport(
      vi.fn()
    )

    expect(isDocumentationProvided(state)).toBe(false)
  })
})

describe('useMaintenanceRunDocumentation', () => {
  beforeEach(() => {
    vi.mocked(useAuditSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuditSettingsQuery>)
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
          result.current.commandDocState.accessControlEnabled
      ).toBe(true)
      if (
        !result.current.commandDocState.isLoading &&
        result.current.commandDocState.accessControlEnabled &&
        result.current.commandDocState.reasonForInteractionRequired
      ) {
        expect(result.current.commandDocState.docreport).toEqual(mockDocreport)
      }
    })

    const { deletionDocState } = result.current

    expect(
      !deletionDocState.isLoading && deletionDocState.accessControlEnabled
    ).toBe(true)
    if (
      !deletionDocState.isLoading &&
      deletionDocState.accessControlEnabled &&
      deletionDocState.reasonForInteractionRequired
    ) {
      expect(deletionDocState.docreport).toBeNull()
      expect(deletionDocState.askForDocumentation).toBeDefined()
    }
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
      const { deletionDocState } = result.current
      if (
        !deletionDocState.isLoading &&
        deletionDocState.accessControlEnabled &&
        deletionDocState.reasonForInteractionRequired &&
        deletionDocState.docreport == null
      ) {
        await deletionDocState.askForDocumentation(
          result.current.actionsToDocument
        )
      }
    })

    expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(2)
  })

  it('does not auto-prompt when promptEnabled is false', async () => {
    const { result, rerender } = renderHook(
      ({ promptEnabled }) =>
        useMaintenanceRunDocumentation(
          'lpc_flow',
          undefined,
          undefined,
          promptEnabled
        ),
      {
        wrapper,
        initialProps: { promptEnabled: false },
      }
    )

    await waitFor(() => {
      expect(!result.current.commandDocState.isLoading).toBe(true)
    })

    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()

    rerender({ promptEnabled: true })

    await waitFor(() => {
      expect(mockShowDocumentationRequiredModal).toHaveBeenCalledTimes(1)
    })
  })
})
