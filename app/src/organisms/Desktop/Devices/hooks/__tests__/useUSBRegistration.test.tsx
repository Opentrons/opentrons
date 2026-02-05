import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { when } from 'vitest-when'

import { createAuthorization, createRegistration } from '@opentrons/api-client'
import { useHost } from '@opentrons/react-api-client'

import { getConfig } from '/app/redux/config'
import { getRobotAddressesByName, OPENTRONS_USB } from '/app/redux/discovery'
import { mockConnectableRobot } from '/app/redux/discovery/__fixtures__'

import { useUSBRegistration } from '../useUSBRegistration'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { DiscoveredRobot } from '/app/redux/discovery/types'
import type { State } from '/app/redux/types'

vi.mock('@opentrons/react-api-client')
vi.mock('@opentrons/api-client')
vi.mock('/app/redux/config')
vi.mock('/app/redux/discovery', async importOriginal => {
  const actual = await importOriginal<typeof import('/app/redux/discovery')>()
  return {
    ...actual,
    getRobotAddressesByName: vi.fn(),
  }
})

const MOCK_HOST = { hostname: '127.0.0.1' }

describe('useUSBRegistration', () => {
  const mockState = {} as any as State

  it('does not call createRegistration or createAuthorization when host is null and robot is null', () => {
    when(vi.mocked(useHost)).calledWith().thenReturn(null)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId: 'test-user-id' } } as any)

    renderHook(() => useUSBRegistration(null))

    expect(createRegistration).not.toHaveBeenCalled()
    expect(createAuthorization).not.toHaveBeenCalled()
  })

  it('calls createAuthorization with registration result when host and robot are set and not USB', async () => {
    const registrationData = { token: 'registration-token' }
    when(vi.mocked(useHost))
      .calledWith()
      .thenReturn(MOCK_HOST as any)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId: 'test-user-id' } } as any)
    when(vi.mocked(getRobotAddressesByName))
      .calledWith(mockState, mockConnectableRobot.name)
      .thenReturn([])
    when(vi.mocked(createRegistration))
      .calledWith(MOCK_HOST, expect.anything())
      .thenResolve({ data: registrationData } as any)
    when(vi.mocked(createAuthorization))
      .calledWith(MOCK_HOST, registrationData)
      .thenResolve({} as any)

    renderHook(() =>
      useUSBRegistration(mockConnectableRobot as DiscoveredRobot)
    )

    await waitFor(() => {
      expect(createAuthorization).toHaveBeenCalledWith(
        MOCK_HOST,
        registrationData
      )
    })
  })

  it('calls createAuthorization with registration result when host and robot are set and USB connected', async () => {
    const registrationData = { token: 'usb-registration-token' }
    when(vi.mocked(useHost))
      .calledWith()
      .thenReturn(MOCK_HOST as any)
    when(vi.mocked(getConfig))
      .calledWith(mockState)
      .thenReturn({ userInfo: { userId: 'test-user-id' } } as any)
    when(vi.mocked(getRobotAddressesByName))
      .calledWith(mockState, mockConnectableRobot.name)
      .thenReturn([{ ip: OPENTRONS_USB, port: 31950, seen: true } as any])
    when(vi.mocked(createRegistration))
      .calledWith(MOCK_HOST, expect.anything())
      .thenResolve({ data: registrationData } as any)
    when(vi.mocked(createAuthorization))
      .calledWith(MOCK_HOST, registrationData)
      .thenResolve({} as any)

    renderHook(() =>
      useUSBRegistration(mockConnectableRobot as DiscoveredRobot)
    )

    await waitFor(() => {
      expect(createAuthorization).toHaveBeenCalledWith(
        MOCK_HOST,
        registrationData
      )
    })
  })
})
