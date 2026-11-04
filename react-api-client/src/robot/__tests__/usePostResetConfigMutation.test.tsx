import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteAllLabwareOffsets, postResetConfig } from '@opentrons/api-client'

import { usePostResetConfigMutation } from '..'
import { ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE } from '../../accessControl/__fixtures__/documentationState'
import { useHost } from '../../api'

import type * as React from 'react'
import type {
  HostConfig,
  ResetConfigRequest,
  ResetConfigResponse,
  Response,
} from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('../../api/useHost')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const RESET_REQUEST: ResetConfigRequest = {
  resetLabwareOffsets: true,
  settingsResets: { pipetteOffsetCalibrations: true },
}
const RESET_RESPONSE: ResetConfigResponse = { message: 'ok' }

describe('usePostResetConfigMutation hook', () => {
  let wrapper: React.FunctionComponent<{ children: React.ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{
      children: React.ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
    vi.mocked(deleteAllLabwareOffsets).mockResolvedValue({
      data: { data: null },
    } as Response<{ data: null }>)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should reset config and delete offsets when requested', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(postResetConfig).mockResolvedValue({
      data: RESET_RESPONSE,
    } as Response<ResetConfigResponse>)

    const { result } = renderHook(
      () =>
        usePostResetConfigMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    act(() => {
      result.current.postResetConfig(RESET_REQUEST)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(RESET_RESPONSE)
    })
    expect(postResetConfig).toHaveBeenCalledWith(
      HOST_CONFIG,
      RESET_REQUEST.settingsResets,
      expect.any(String)
    )
    expect(deleteAllLabwareOffsets).toHaveBeenCalledWith(
      HOST_CONFIG,
      expect.any(String)
    )
  })

  it('should not delete offsets when resetLabwareOffsets is false', async () => {
    vi.mocked(useHost).mockReturnValue(HOST_CONFIG)
    vi.mocked(postResetConfig).mockResolvedValue({
      data: RESET_RESPONSE,
    } as Response<ResetConfigResponse>)

    const { result } = renderHook(
      () =>
        usePostResetConfigMutation(ACCESS_CONTROL_DISABLED_DOCUMENTATION_STATE),
      { wrapper }
    )
    act(() => {
      result.current.postResetConfig({
        resetLabwareOffsets: false,
        settingsResets: { runsHistory: true },
      })
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(RESET_RESPONSE)
    })
    expect(deleteAllLabwareOffsets).not.toHaveBeenCalled()
  })
})
