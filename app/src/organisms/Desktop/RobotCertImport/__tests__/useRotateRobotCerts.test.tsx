import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { getPlaintextCACertificates } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { tryInstallPlaintextRobotCertificate } from '/app/redux/shell/remote'

import { useRotateRobotCerts } from '../useRotateRobotCerts'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('/app/redux/shell/remote', () => ({
  tryInstallPlaintextRobotCertificate: vi.fn(),
}))
vi.mock('@opentrons/react-api-client')

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }

describe('useHandleRobotCertImport', async () => {
  let wrapper: FunctionComponent<{ children: ReactNode }>
  beforeEach(() => {
    when(vi.mocked(useHost)).calledWith().thenReturn(HOST_CONFIG)
    const queryClient = new QueryClient()
    const clientProvider: FunctionComponent<{
      children: ReactNode
    }> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should fetch ok when the query succeeds', async () => {
    when(vi.mocked(getPlaintextCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              cert_data: 'ffffffff',
            },
            next: {
              cert_data: 'asdfasdf',
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallPlaintextRobotCertificate))
      .calledWith({ certificateData: 'asdfasdf' })
      .thenResolve(true)
    const { result } = renderHook(() => useRotateRobotCerts(), { wrapper })
    await waitFor(() => expect(result.current.status === 'success'))
    expect(vi.mocked(tryInstallPlaintextRobotCertificate)).toHaveBeenCalled()
  })
  it('should not error when install fails ', async () => {
    when(vi.mocked(getPlaintextCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              cert_data: 'ffffffff',
            },
            next: {
              cert_data: 'asdfasdf',
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallPlaintextRobotCertificate))
      .calledWith({ certificateData: 'asdfasdf' })
      .thenReject(new Error('oh no'))
    const { result } = renderHook(() => useRotateRobotCerts(), { wrapper })
    await waitFor(() => expect(result.current.status === 'success'))
    expect(vi.mocked(tryInstallPlaintextRobotCertificate)).toHaveBeenCalled()
  })
  it('should end early and not error if there is no next cert', async () => {
    when(vi.mocked(getPlaintextCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              cert_data: 'ffffffff',
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    const { result } = renderHook(() => useRotateRobotCerts(), { wrapper })
    await waitFor(() => expect(result.current.status === 'success'))
    expect(
      vi.mocked(tryInstallPlaintextRobotCertificate)
    ).not.toHaveBeenCalled()
  })
  it('should end early and not error if the fetch fails', async () => {
    when(vi.mocked(getPlaintextCACertificates))
      .calledWith(HOST_CONFIG)
      .thenReject(new Error('oh no'))
    const { result } = renderHook(() => useRotateRobotCerts(), { wrapper })
    await waitFor(() => expect(result.current.status === 'success'))
    expect(
      vi.mocked(tryInstallPlaintextRobotCertificate)
    ).not.toHaveBeenCalled()
  })
})
