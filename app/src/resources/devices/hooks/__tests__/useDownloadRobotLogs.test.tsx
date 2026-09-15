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
import { saveLogs } from '/app/redux/shell/remote'

import { useDownloadRobotLogs } from '../useDownloadRobotLogs'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/redux-resources/robots')
vi.mock('/app/redux/shell/remote', () => ({
  saveLogs: vi.fn(),
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
    vi.mocked(saveLogs).mockReset()
    vi.mocked(saveLogs).mockResolvedValue({
      directory: '/tmp/downloads',
      succeededPaths: ['/logs/api.log', '/logs/serial.log'],
    })
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

  it('invokes saveLogs and returns the destination directory', async () => {
    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({ destination: '/tmp/usb' })
    ).resolves.toBe('/tmp/downloads')

    expect(saveLogs).toHaveBeenCalledWith({
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
    expect(saveLogs).not.toHaveBeenCalled()
  })

  it('reports loading while the IPC call is in flight', async () => {
    let resolveSave: (value: {
      directory: string
      succeededPaths: string[]
    }) => void = () => {}
    vi.mocked(saveLogs).mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSave = resolve
        })
    )

    const { result } = renderHook(() => useDownloadRobotLogs(ROBOT_NAME), {
      wrapper,
    })

    const pending = result.current.mutateAsync({})
    await waitFor(() => {
      expect(result.current.status).toBe('loading')
    })

    resolveSave({ directory: '/tmp', succeededPaths: ['/logs/api.log'] })
    await pending

    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })
  })
})
