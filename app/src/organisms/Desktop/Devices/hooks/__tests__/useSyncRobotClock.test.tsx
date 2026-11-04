import { I18nextProvider } from 'react-i18next'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSystemTime, putSystemTime } from '@opentrons/api-client'

import { i18n } from '/app/i18n'
import { useRobot } from '/app/redux-resources/robots'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'

import { useSyncRobotClock } from '..'

import type { FunctionComponent, ReactNode } from 'react'
import type * as ApiClient from '@opentrons/api-client'

vi.mock('@opentrons/api-client', async importOriginal => {
  const actual = await importOriginal<typeof ApiClient>()
  return {
    ...actual,
    getSystemTime: vi.fn(),
    putSystemTime: vi.fn(),
  }
})
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/robot-auth/hooks', () => ({
  useAccessTokenForRobot: () => null,
}))

describe('useSyncRobotClock hook', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    wrapper = ({ children }) => (
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    )
    vi.mocked(useRobot).mockReturnValue(mockConnectableRobot as any)
    vi.mocked(putSystemTime).mockResolvedValue({} as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not put system time when drift is within threshold', async () => {
    vi.mocked(getSystemTime).mockResolvedValue({
      data: {
        data: {
          id: 'time',
          systemTime: new Date().toISOString(),
        },
      },
    } as ApiClient.Response<ApiClient.SystemTimeResponse>)

    renderHook(() => useSyncRobotClock('otie'), { wrapper })

    await waitFor(() => {
      expect(getSystemTime).toHaveBeenCalledWith(
        expect.objectContaining({ hostname: mockConnectableRobot.ip })
      )
    })
    expect(putSystemTime).not.toHaveBeenCalled()
  })

  it('puts system time with audit_log user notes when drift exceeds threshold', async () => {
    const drifted = new Date(Date.now() - 120_000).toISOString()
    vi.mocked(getSystemTime).mockResolvedValue({
      data: {
        data: {
          id: 'time',
          systemTime: drifted,
        },
      },
    } as ApiClient.Response<ApiClient.SystemTimeResponse>)

    renderHook(() => useSyncRobotClock('otie'), { wrapper })

    await waitFor(() => {
      expect(putSystemTime).toHaveBeenCalledWith(
        expect.objectContaining({ hostname: mockConnectableRobot.ip }),
        expect.any(String),
        'Syncing robot system time'
      )
    })
  })

  it('swallows errors from get or put', async () => {
    vi.mocked(getSystemTime).mockRejectedValue(new Error('network'))

    renderHook(() => useSyncRobotClock('otie'), { wrapper })

    await waitFor(() => {
      expect(getSystemTime).toHaveBeenCalled()
    })
    expect(putSystemTime).not.toHaveBeenCalled()
  })

  it('does nothing when robotName is null', () => {
    renderHook(() => useSyncRobotClock(null), { wrapper })
    expect(getSystemTime).not.toHaveBeenCalled()
  })
})
