import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useAccessControlEnabledQuery,
  useAuthSettingsQuery,
} from '@opentrons/react-api-client'

import { useCurrentUsername } from '/app/redux/robot-auth'

import { useGuardedAction } from '../useGuardedAction'
import {
  mockShowDocumentationRequiredModal,
  mockShowLoginModal,
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
    useCurrentUsername: vi.fn(() => 'alice'),
    useCurrentRobotName: vi.fn(() => 'otie'),
  }
})

const wrapper = wrapWithDocumentationRequiredModal()

describe('useGuardedAction', () => {
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
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: true,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)

    const { result } = renderHook(() => useGuardedAction(), { wrapper })

    const currentResult = await act(
      () =>
        !result.current.isLoading &&
        !result.current.reasonForInteractionRequired
    )
    expect(currentResult).toBe(true)
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
    vi.mocked(useAuthSettingsQuery).mockReturnValue({
      data: {
        data: {
          requireReasonForInteraction: false,
          minLengthOfReasonForInteraction: 10,
        },
      },
    } as ReturnType<typeof useAuthSettingsQuery>)

    const { result } = renderHook(() => useGuardedAction(), { wrapper })

    const currentResult = await act(
      () =>
        !result.current.isLoading &&
        !result.current.reasonForInteractionRequired
    )
    expect(currentResult).toBe(true)
    expect(mockShowDocumentationRequiredModal).not.toHaveBeenCalled()
  })

  it('skips guards when documentation is provided', async () => {
    const docreport = 'starting calibration' as DocumentationReport

    const { result } = renderHook(() => useGuardedAction(docreport), {
      wrapper,
    })

    expect(
      !result.current.isLoading && result.current.reasonForInteractionRequired
    ).toBe(true)
    expect(
      !result.current.isLoading &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport
    ).toBe(docreport)
  })

  it('returns callback to open modal when documentation is not provided', async () => {
    const { result } = renderHook(() => useGuardedAction(), { wrapper })

    expect(
      !result.current.isLoading && result.current.reasonForInteractionRequired
    ).toBe(true)
    expect(
      !result.current.isLoading &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport
    ).toBeNull()
    expect(
      !result.current.isLoading &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport == null &&
        result.current.askForDocumentation
    ).toBeDefined()
  })
  it('opens login modal when username is not provided', async () => {
    vi.mocked(useCurrentUsername).mockReturnValue(null)
    const { result } = renderHook(() => useGuardedAction(), { wrapper })

    await act(async () => {
      if (
        !result.current.isLoading &&
        result.current.reasonForInteractionRequired &&
        result.current.docreport == null
      ) {
        await result.current.askForDocumentation([], () => {})
      }
    })

    expect(mockShowLoginModal).toHaveBeenCalled()
  })
})
