import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useAuditSettingsQuery,
} from '@opentrons/react-api-client'

import { useUsernameForRobot } from '/app/redux/robot-auth'

import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../__fixtures__/documentationState'
import { useDocumentationState } from '../useDocumentationState'
import {
  mockShowDocumentationRequiredModal,
  mockShowLoginModal,
  wrapWithDocumentationRequiredModal,
} from './documentationRequiredModalTestUtils'

import type ReactRedux from 'react-redux'
import type { DocumentationReport } from '@opentrons/react-api-client'

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

const wrapper = wrapWithDocumentationRequiredModal()

describe('useDocumentationState', () => {
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
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('skips both guards when access control is disabled', async () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: false,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(useAuditSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuditSettingsQuery>)

    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    await act(async () => {
      expect(result.current).toEqual(
        ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE
      )
    })
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })
  it('skips both guards when access control is enabled but require reason for interaction is disabled', async () => {
    vi.mocked(useAccessControlEnabledQuery).mockReturnValue({
      data: {
        data: {
          accessControlEnabled: true,
        },
      },
    } as ReturnType<typeof useAccessControlEnabledQuery>)
    vi.mocked(useAuditSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: false,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuditSettingsQuery>)

    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    await act(async () => {
      expect(
        !result.current.isLoading && result.current.accessControlEnabled
      ).toBe(true)
      if (!result.current.isLoading && result.current.accessControlEnabled) {
        expect(result.current.reasonForInteractionRequired).toBe(false)
      }
    })
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })

  it('skips guards when documentation is provided', async () => {
    const docreport = 'starting calibration' as DocumentationReport

    const { result } = renderHook(() => useDocumentationState(docreport), {
      wrapper,
    })

    expect(
      !result.current.isLoading && result.current.accessControlEnabled
    ).toBe(true)
    if (
      !result.current.isLoading &&
      result.current.accessControlEnabled &&
      result.current.reasonForInteractionRequired
    ) {
      expect(result.current.docreport).toBe(docreport)
    }
  })

  it('returns callback to open modal when documentation is not provided', async () => {
    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    expect(
      !result.current.isLoading && result.current.accessControlEnabled
    ).toBe(true)
    if (
      !result.current.isLoading &&
      result.current.accessControlEnabled &&
      result.current.reasonForInteractionRequired
    ) {
      expect(result.current.docreport).toBeNull()
      expect(result.current.askForDocumentation).toBeDefined()
    }
  })
  it('opens login modal when username is not provided', async () => {
    vi.mocked(useUsernameForRobot).mockReturnValue(null)
    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    await act(async () => {
      if (
        !result.current.isLoading &&
        result.current.accessControlEnabled &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport == null
      ) {
        await result.current.askForDocumentation([], () => {})
      }
    })

    expect(mockShowLoginModal).toHaveBeenCalled()
  })

  it('calls onCancel when login modal is dismissed without logging in', async () => {
    vi.mocked(useUsernameForRobot).mockReturnValue(null)
    vi.mocked(mockShowLoginModal).mockResolvedValue(null)
    const onCancel = vi.fn()
    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    await act(async () => {
      if (
        !result.current.isLoading &&
        result.current.accessControlEnabled &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport == null
      ) {
        const report = await result.current.askForDocumentation([], onCancel)
        expect(report).toBe('')
      }
    })

    expect(mockShowLoginModal).toHaveBeenCalled()
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('passes initialDocreport to the documentation modal', async () => {
    const initialDocreport = 'previous note' as DocumentationReport
    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    await act(async () => {
      if (
        !result.current.isLoading &&
        result.current.accessControlEnabled &&
        result.current.reasonForInteractionRequired
      ) {
        await result.current.askForDocumentation(
          ['play_run'],
          undefined,
          initialDocreport,
          'alice'
        )
      }
    })

    expect(mockShowDocumentationRequiredModal).toHaveBeenCalledWith(
      'alice',
      ['play_run'],
      10,
      undefined,
      initialDocreport
    )
  })

  it('exposes askForLogin when access control is enabled', async () => {
    const { result } = renderHook(() => useDocumentationState(), { wrapper })

    expect(
      !result.current.isLoading && result.current.accessControlEnabled
    ).toBe(true)
    if (!result.current.isLoading && result.current.accessControlEnabled) {
      expect(result.current.askForLogin).toEqual(expect.any(Function))
    }
  })
})
