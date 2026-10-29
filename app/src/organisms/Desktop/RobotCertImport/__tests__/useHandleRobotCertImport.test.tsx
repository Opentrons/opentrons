import { I18nextProvider } from 'react-i18next'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  getEncryptedCACertificates,
  getPlaintextCACertificates,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { i18n } from '/app/i18n'
import {
  tryInstallEncryptedRobotCertificate,
  tryInstallPlaintextRobotCertificate,
} from '/app/redux/shell/remote'

import { useHandleRobotCertImport } from '../useHandleRobotCertImport'

import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from '@opentrons/api-client'

vi.mock('@opentrons/api-client')
vi.mock('/app/redux/shell/remote', () => ({
  tryInstallEncryptedRobotCertificate: vi.fn(),
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
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </I18nextProvider>
    )
    wrapper = clientProvider
  })
  afterEach(() => {
    vi.resetAllMocks()
  })
  it('should result in success when all its calls succeed', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              current: {
                cert_data: 'asdfasdf',
                key_salt: 'fdsafdsa',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'asdfasdf',
        salt: 'fdsafdsa',
        iterations: 10,
      })
      .thenResolve(true)
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
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      {
        wrapper,
      }
    )
    act(() => {
      result.current.setPasswordValue('password')
    })
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => expect(onSuccessfulImport).toHaveBeenCalled())
  })
  it('should result in success when the older password matches', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              current: {
                cert_data: 'asdfasdf',
                key_salt: 'fdsafdsa',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
              previous: {
                cert_data: 'oooooooo',
                key_salt: 'gggggggg',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'asdfasdf',
        salt: 'fdsafdsa',
        iterations: 10,
      })
      .thenReject(new Error('wrong password'))
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'oooooooo',
        salt: 'gggggggg',
        iterations: 10,
      })
      .thenResolve(true)
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
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      {
        wrapper,
      }
    )
    act(() => {
      result.current.setPasswordValue('password')
    })
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => expect(onSuccessfulImport).toHaveBeenCalled())
  })
  it('should notify failure when getting the encrypted certs fails', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenReject({
        message: 'oh no',
        name: 'AxiosError',
        code: 'ETIMEDOUT',
        status: null,
      })
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      { wrapper }
    )
    act(() => result.current.setPasswordValue('password'))
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => {
      expect(result.current.importInProgress).toBeFalsy()
    })

    expect(onSuccessfulImport).not.toHaveBeenCalled()
    expect(result.current.passwordError).toEqual('oh no')
  })
  it('should notify failure when installing the main certificate fails and there is no secondary', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              current: {
                cert_data: 'asdfasdf',
                key_salt: 'fdsafdsa',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'asdfasdf',
        salt: 'fdsafdsa',
        iterations: 10,
      })
      .thenReject(new Error('bad password sucka'))
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      { wrapper }
    )
    act(() => result.current.setPasswordValue('password'))
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => {
      expect(result.current.importInProgress).toBeFalsy()
    })

    expect(onSuccessfulImport).not.toHaveBeenCalled()
    expect(result.current.passwordError).toEqual(
      'Certificate install failed, probably bad password'
    )
  })
  it('should notify failure when installing the main certificate fails and the secondary fails', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              current: {
                cert_data: 'asdfasdf',
                key_salt: 'fdsafdsa',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
              previous: {
                cert_data: 'iuiuiuiu',
                key_salt: 'ggggggg',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'asdfasdf',
        salt: 'fdsafdsa',
        iterations: 10,
      })
      .thenReject(new Error('bad password sucka'))
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'iuiuiuiu',
        salt: 'ggggggg',
        iterations: 10,
      })
      .thenReject(new Error('still a bad password sucka'))
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      { wrapper }
    )
    act(() => result.current.setPasswordValue('password'))
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => {
      expect(result.current.importInProgress).toBeFalsy()
    })

    expect(onSuccessfulImport).not.toHaveBeenCalled()
    expect(result.current.passwordError).toEqual(
      'Certificate install failed, probably bad password'
    )
  })
  it('should notify failure when installing certificate succeed but the plaintext fetch fails', async () => {
    when(vi.mocked(getEncryptedCACertificates))
      .calledWith(HOST_CONFIG)
      .thenResolve({
        data: {
          data: {
            current: {
              current: {
                cert_data: 'asdfasdf',
                key_salt: 'fdsafdsa',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
              previous: {
                cert_data: 'iuiuiuiu',
                key_salt: 'ggggggg',
                kdf_iterations: 10,
                key_expires_at: new Date().toISOString(),
              },
            },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      })
    when(vi.mocked(tryInstallEncryptedRobotCertificate))
      .calledWith({
        password: 'password',
        certificateData: 'asdfasdf',
        salt: 'fdsafdsa',
        iterations: 10,
      })
      .thenResolve(true)

    when(vi.mocked(getPlaintextCACertificates))
      .calledWith(HOST_CONFIG)
      .thenReject(new Error('Bad SSL connection'))
    const onSuccessfulImport = vi.fn()
    const { result } = renderHook(
      () => useHandleRobotCertImport({ onSuccessfulImport }),
      { wrapper }
    )
    act(() => result.current.setPasswordValue('password'))
    act(() => {
      result.current.tryImport()
    })
    await waitFor(() => {
      expect(result.current.importInProgress).toBeFalsy()
    })

    expect(onSuccessfulImport).not.toHaveBeenCalled()
    expect(result.current.passwordError).toEqual('Bad SSL connection')
  })
  it('should not install next certificate if it does not exist', async () =>
    async () => {
      when(vi.mocked(getEncryptedCACertificates))
        .calledWith(HOST_CONFIG)
        .thenResolve({
          data: {
            data: {
              current: {
                current: {
                  cert_data: 'asdfasdf',
                  key_salt: 'fdsafdsa',
                  kdf_iterations: 10,
                  key_expires_at: new Date().toISOString(),
                },
              },
            },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {},
        })
      when(vi.mocked(tryInstallEncryptedRobotCertificate))
        .calledWith({
          password: 'password',
          certificateData: 'asdfasdf',
          salt: 'fdsafdsa',
          iterations: 10,
        })
        .thenResolve(true)
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
      const onSuccessfulImport = vi.fn()
      const { result } = renderHook(
        () => useHandleRobotCertImport({ onSuccessfulImport }),
        {
          wrapper,
        }
      )
      act(() => {
        result.current.setPasswordValue('password')
      })
      act(() => {
        result.current.tryImport()
      })
      await waitFor(() => expect(onSuccessfulImport).toHaveBeenCalled())
      expect(tryInstallPlaintextRobotCertificate).not.toHaveBeenCalled()
    })
})
