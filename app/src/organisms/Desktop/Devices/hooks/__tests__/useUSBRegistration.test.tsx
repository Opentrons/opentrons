import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import {
  createAuthorization,
  createRegistration,
  HostConfig,
} from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { getConfig } from '/app/redux/config'
import { getRobotAddressesByName, OPENTRONS_USB } from '/app/redux/discovery'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'

import { useUSBRegistration } from '../useUSBRegistration'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { DiscoveryClientRobotAddress } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client')
vi.mock('@opentrons/api-client')
vi.mock('/app/redux/config')
vi.mock('/app/redux/discovery')

describe('useUSBRegistration', () => {
  const mockHost = { hostname: '127.0.0.1' } as any as HostConfig
  const mockState = {} as State
  const mockStore: Store<any> = legacy_createStore(vi.fn(), mockState)
  const wrapper: FunctionComponent<{ children: ReactNode }> = ({
    children,
  }) => <Provider store={mockStore}>{children}</Provider>

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('does not call createRegistration or createAuthorization when host is null and robot is null', () => {
    when(vi.mocked(useHost)).calledWith().thenReturn(null)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId: 'test-user-id' } } as any)

    renderHook(() => useUSBRegistration(null), { wrapper })

    expect(createRegistration).not.toHaveBeenCalled()
    expect(createAuthorization).not.toHaveBeenCalled()
  })

  it('calls createAuthorization with registration result when host and robot are set and not USB', async () => {
    const userId = 'test-user-id'
    const registrationData = { token: 'registration-token' }
    vi.mocked(getRobotAddressesByName).test_prop = 'MAX MAX'
    when(vi.mocked(useHost)).calledWith().thenReturn(mockHost)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId } } as any)
    when(vi.mocked(getRobotAddressesByName))
      .calledWith(mockState, mockConnectableRobot.name)
      .thenReturn([{ ip: '192.168.1.123' } as DiscoveryClientRobotAddress])
    when(vi.mocked(createRegistration))
      .calledWith(mockHost, {
        agent: 'com.opentrons.app',
        agentId: userId,
        subject: expect.anything(),
      })
      .thenResolve({ data: registrationData } as any)
    when(vi.mocked(createAuthorization))
      .calledWith(mockHost, registrationData)
      .thenResolve({} as any)

    renderHook(() => useUSBRegistration(mockConnectableRobot), { wrapper })

    await waitFor(() => {
      expect(createAuthorization).toHaveBeenCalledWith(
        mockHost,
        registrationData
      )
    })
  })

  it('calls createAuthorization with registration result when host and robot are set and USB connected', async () => {
    const userId = 'test-user-id'
    const registrationData = { token: 'usb-registration-token' }
    when(vi.mocked(useHost)).calledWith().thenReturn(mockHost)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId } } as any)
    when(vi.mocked(getRobotAddressesByName))
      .calledWith(mockState, mockConnectableRobot.name)
      .thenReturn([{ ip: OPENTRONS_USB } as DiscoveryClientRobotAddress])
    when(vi.mocked(createRegistration))
      .calledWith(mockHost, {
        agent: 'com.opentrons.app.usb',
        agentId: userId,
        subject: expect.anything(),
      })
      .thenResolve({ data: registrationData } as any)
    when(vi.mocked(createAuthorization))
      .calledWith(mockHost, registrationData)
      .thenResolve({} as any)

    renderHook(() => useUSBRegistration(mockConnectableRobot), { wrapper })

    await waitFor(() => {
      expect(createAuthorization).toHaveBeenCalledWith(
        mockHost,
        registrationData
      )
    })
  })
})
