import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { useHost } from '@opentrons/react-api-client'

import { useRobot } from '/app/redux-resources/robots'
import {
  mockConnectableRobot,
  mockUnreachableRobot,
} from '/app/redux/discovery/__fixtures__'

import { useDownloadRobotLogs } from '../useDownloadRobotLogs'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/shell/remote', () => ({
  remote: {
    ipcRenderer: {
      invoke: mockInvoke,
    },
  },
}))

const ROBOT_NAME = 'otie'
const HOST_CONFIG: HostConfig = {
  hostname: '10.0.0.5',
  port: 31950,
}

describe('useDownloadRobotLogs', () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>

  beforeEach(() => {
    const queryClient = new QueryClient()
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    mockInvoke.mockReset()
    mockInvoke.mockResolvedValue('/tmp/downloads')
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    when(vi.mocked(useRobot))
      .calledWith(ROBOT_NAME)
      .thenReturn({
        ...mockConnectableRobot,
        health: {
          ...mockConnectableRobot.health!,
          logs: ['/logs/api.log', '/logs/serial.log'],
        },
      } as typeof mockConnectableRobot)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('reports canDownload when the robot is connectable with logs', () => {
    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })
    expect(result.current.canDownload).toBe(true)
  })

  it('reports canDownload false when the robot is unreachable', () => {
    when(vi.mocked(useRobot))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockUnreachableRobot)

    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })
    expect(result.current.canDownload).toBe(false)
  })

  it('invokes downloads:saveLogs and returns the destination', async () => {
    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ destination: '/tmp/usb' })
    ).resolves.toBe('/tmp/downloads')

    expect(mockInvoke).toHaveBeenCalledWith('downloads:saveLogs', {
      name: 'otie_logs.zip',
      paths: ['/logs/api.log', '/logs/serial.log'],
      hostname: '10.0.0.5',
      port: 31950,
      destination: '/tmp/usb',
    })
  })

  it('rejects when the robot cannot download', async () => {
    when(vi.mocked(useRobot))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockUnreachableRobot)

    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })

    await expect(result.current.mutateAsync({})).rejects.toThrow(
      'Unable to download robot logs: robot is not connectable'
    )
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('reports loading while the IPC call is in flight', async () => {
    let resolveInvoke: (value: string) => void = () => {}
    mockInvoke.mockImplementation(
      () =>
        new Promise<string>(resolve => {
          resolveInvoke = resolve
        })
    )

    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })

    const pending = result.current.mutateAsync({})
    await waitFor(() => {
      expect(result.current.status).toBe('loading')
    })

    resolveInvoke('/tmp')
    await pending

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
  })
})
