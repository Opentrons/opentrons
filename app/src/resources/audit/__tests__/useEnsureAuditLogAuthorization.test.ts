import { useStore } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { isDocumentedMutationError } from '@opentrons/react-api-client'

import {
  ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE,
  createReasonNotRequiredDocumentationState,
  createReasonRequiredWithDocReport,
  createReasonRequiredWithoutDocReport,
} from '/app/local-resources/access-control/__fixtures__/documentationState'
import { getUsernameForRobot, useCurrentRobotName } from '/app/redux/robot-auth'

import { useEnsureAuditLogAuthorization } from '../useEnsureAuditLogAuthorization'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

vi.mock('react-redux', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useStore: vi.fn(),
  }
})

vi.mock('/app/redux/robot-auth', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...(actual as Record<string, unknown>),
    useCurrentRobotName: vi.fn(),
    getUsernameForRobot: vi.fn(),
  }
})

const ACTIONS: DocumentedAction[] = ['download_log_period']
const ROBOT_NAME = 'otie'
const DOC_REPORT = 'because I said so' as DocumentationReport

const mockStore = {
  getState: vi.fn(() => ({})),
}

function renderEnsure(documentationState: DocumentationState) {
  return renderHook(() =>
    useEnsureAuditLogAuthorization(documentationState, ACTIONS)
  )
}

describe('useEnsureAuditLogAuthorization', () => {
  beforeEach(() => {
    vi.mocked(useStore).mockReturnValue(mockStore as never)
    vi.mocked(useCurrentRobotName).mockReturnValue(ROBOT_NAME)
    vi.mocked(getUsernameForRobot).mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when access control is disabled', async () => {
    const { result } = renderEnsure(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE)

    await act(async () => {
      await result.current()
    })

    expect(getUsernameForRobot).not.toHaveBeenCalled()
  })

  it('throws when access control queries are still loading', async () => {
    const { result } = renderEnsure({ isLoading: true })

    await act(async () => {
      await expect(result.current()).rejects.toSatisfy(
        error =>
          isDocumentedMutationError(error) &&
          error.type === 'access_control_loading'
      )
    })
  })

  it('throws when no robot is selected', async () => {
    vi.mocked(useCurrentRobotName).mockReturnValue(null)
    const { result } = renderEnsure(createReasonNotRequiredDocumentationState())

    await act(async () => {
      await expect(result.current()).rejects.toThrow('no robot selected')
    })
  })

  it('prompts for login when there is no username', async () => {
    const documentationState = createReasonNotRequiredDocumentationState()
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await result.current()
    })

    expect(documentationState.askForLogin).toHaveBeenCalledTimes(1)
  })

  it('does not prompt for login when a username is already present', async () => {
    vi.mocked(getUsernameForRobot).mockReturnValue('alice')
    const documentationState = createReasonNotRequiredDocumentationState()
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await result.current()
    })

    expect(documentationState.askForLogin).not.toHaveBeenCalled()
  })

  it('throws login_cancelled when login is dismissed', async () => {
    const documentationState = createReasonNotRequiredDocumentationState()
    vi.mocked(documentationState.askForLogin).mockResolvedValue(null)
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await expect(result.current()).rejects.toSatisfy(
        error =>
          isDocumentedMutationError(error) && error.type === 'login_cancelled'
      )
    })
  })

  it('prompts for documentation after a successful login', async () => {
    const askForDocumentation = vi.fn().mockResolvedValue(DOC_REPORT)
    const documentationState =
      createReasonRequiredWithoutDocReport(askForDocumentation)
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await result.current()
    })

    expect(documentationState.askForLogin).toHaveBeenCalledTimes(1)
    expect(askForDocumentation).toHaveBeenCalledWith(
      ACTIONS,
      undefined,
      undefined,
      'alice'
    )
  })

  it('skips documentation when a report is already present', async () => {
    vi.mocked(getUsernameForRobot).mockReturnValue('alice')
    const documentationState = createReasonRequiredWithDocReport(DOC_REPORT)
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await result.current()
    })

    expect(documentationState.askForDocumentation).not.toHaveBeenCalled()
  })

  it('throws no_documentation_report when documentation is cancelled', async () => {
    vi.mocked(getUsernameForRobot).mockReturnValue('alice')
    const askForDocumentation = vi
      .fn()
      .mockResolvedValue('' as DocumentationReport)
    const documentationState =
      createReasonRequiredWithoutDocReport(askForDocumentation)
    const { result } = renderEnsure(documentationState)

    await act(async () => {
      await expect(result.current()).rejects.toSatisfy(
        error =>
          isDocumentedMutationError(error) &&
          error.type === 'no_documentation_report'
      )
    })
  })
})
