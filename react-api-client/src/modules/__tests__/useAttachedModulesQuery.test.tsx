import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { AttachedModules, getModules } from '@opentrons/api-client'
import { useHost } from '../../api'
import { useAttachedModulesQuery } from '..'

import type { HostConfig, Response } from '@opentrons/api-client'

jest.mock('@opentrons/api-client')
jest.mock('../../api/useHost')

const mockGetModules = getModules as jest.MockedFunction<typeof getModules>
const mockUseHost = useHost as jest.MockedFunction<typeof useHost>

const HOST_CONFIG: HostConfig = { hostname: 'localhost' }
const MODULES_RESPONSE = {
  data: [
    {
      id: '3feb840a3fa2dac2409b977f1e330f54f50e6231',
      serialNumber: 'dummySerialTC',
      firmwareVersion: 'dummyVersionTC',
      hardwareRevision: 'dummyModelTC',
      hasAvailableUpdate: false,
      moduleType: 'thermocyclerModuleType',
      moduleModel: 'thermocyclerModuleV1',
      data: {
        status: 'holding at target',
        currentTemperature: 3.0,
        targetTemperature: 3.0,
        lidStatus: 'open',
        lidTemperature: 4.0,
        lidTargetTemperature: 4.0,
        holdTime: 121.0,
      },
      usbPort: {
        port: 0,
        path: '',
      },
    },
    {
      id: '8bcc37fdfcb4c2b5ab69963c589ceb1f9b1d1c4f',
      serialNumber: 'dummySerialHS',
      firmwareVersion: 'dummyVersionHS',
      hardwareRevision: 'dummyModelHS',
      hasAvailableUpdate: false,
      moduleType: 'heaterShakerModuleType',
      moduleModel: 'heaterShakerModuleV1',
      data: {
        status: 'idle',
        labwareLatchStatus: 'idle_unknown',
        speedStatus: 'idle',
        currentSpeed: 0,
        temperatureStatus: 'idle',
        currentTemperature: 23.0,
      },
      usbPort: {
        port: 0,
        path: '',
      },
    },
    {
      id: '5fe40b412e39c6c079125b5dd4820ad8044e0962',
      serialNumber: 'dummySerialTD',
      firmwareVersion: 'dummyVersionTD',
      hardwareRevision: 'temp_deck_v1.1',
      hasAvailableUpdate: false,
      moduleType: 'temperatureModuleType',
      moduleModel: 'temperatureModuleV1',
      data: {
        status: 'holding at target',
        currentTemperature: 3.0,
        targetTemperature: 3.0,
      },
      usbPort: {
        port: 0,
        path: '',
      },
    },
    {
      id: '67a5b5118a952417b4aa47a62a96deccb13bed32',
      serialNumber: 'dummySerialMD',
      firmwareVersion: 'dummyVersionMD',
      hardwareRevision: 'mag_deck_v1.1',
      hasAvailableUpdate: false,
      moduleType: 'magneticModuleType',
      moduleModel: 'magneticModuleV1',
      data: {
        status: 'engaged',
        engaged: true,
        height: 4.0,
      },
      usbPort: {
        port: 0,
        path: '',
      },
    },
  ],
} as AttachedModules

describe('useAttachedModulesQuery hook', () => {
  let wrapper: React.FunctionComponent<{}>

  beforeEach(() => {
    const queryClient = new QueryClient()
    const clientProvider: React.FunctionComponent<{}> = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    wrapper = clientProvider
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return no data if no host', () => {
    when(mockUseHost).calledWith().mockReturnValue(null)

    const { result } = renderHook(useAttachedModulesQuery, { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('should return no data if the getModules request fails', () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetModules).calledWith(HOST_CONFIG).mockRejectedValue('oh no')

    const { result } = renderHook(useAttachedModulesQuery, { wrapper })
    expect(result.current.data).toBeUndefined()
  })

  it('should return all current protocols', async () => {
    when(mockUseHost).calledWith().mockReturnValue(HOST_CONFIG)
    when(mockGetModules)
      .calledWith(HOST_CONFIG)
      .mockResolvedValue({
        data: MODULES_RESPONSE,
      } as Response<AttachedModules>)

    const { result, waitFor } = renderHook(useAttachedModulesQuery, { wrapper })

    await waitFor(() => result.current.data != null)

    expect(result.current.data).toEqual(MODULES_RESPONSE)
  })
})
