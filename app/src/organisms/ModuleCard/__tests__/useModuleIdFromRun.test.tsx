import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import {
  useAttachedModules,
  useProtocolDetailsForRun,
} from '../../Devices/hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import {
  mockMagneticModule,
  mockThermocycler,
} from '../../../redux/modules/__fixtures__'

import type { Store } from 'redux'
import type { State } from '../../../redux/types'
import type { MagneticModule } from '../../../redux/modules/types'

jest.mock('../../Devices/hooks')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>

const RUN_ID = '1'

const mockMagneticModule2: MagneticModule = {
  id: 'magdeck_id',
  moduleModel: 'magneticModuleV1',
  moduleType: 'magneticModuleType',
  serialNumber: 'abc123',
  hardwareRevision: 'mag_deck_v4.0',
  firmwareVersion: 'v2.0.0',
  hasAvailableUpdate: true,
  data: {
    engaged: false,
    height: 42,
    status: 'disengaged',
  },
  usbPort: { path: '/dev/ot_module_magdeck0', port: 1, hub: null },
}

describe('useModuleIdFromRun', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: {
        commands: [
          {
            id: '3be3bc12-6e05-498a-ace7-5a7fda59d4d7',
            createdAt: '2022-05-25T17:13:52.004179+00:00',
            commandType: 'loadModule',
            key: '3be3bc12-6e05-498a-ace7-5a7fda59d4d7',
            status: 'succeeded',
            params: {
              model: 'magneticModuleV1',
              location: {
                slotName: '3',
              },
              moduleId: 'magneticModuleId_1',
            },
            result: {
              moduleId: 'magneticModuleId_1',
              definition: {
                otSharedSchema: 'module/schemas/2',
                moduleType: 'magneticModuleType',
                model: 'magneticModuleV1',
                labwareOffset: {
                  x: 0.125,
                  y: -0.125,
                  z: 82.25,
                },
                dimensions: {
                  bareOverallHeight: 110.152,
                  overLabwareHeight: 4.052,
                },
                calibrationPoint: {
                  x: 124.875,
                  y: 2.75,
                  z: 82.25,
                },
                displayName: 'Magnetic Module GEN1',
                quirks: [],
                slotTransforms: {},
                compatibleWith: [],
              },
              model: 'magneticModuleV1',
              serialNumber:
                'fake-serial-number-0c3bd51c-f519-43a3-a5ae-7cdc01b8e57b',
            },
            startedAt: '2022-05-25T17:13:52.006056+00:00',
            completedAt: '2022-05-25T17:13:52.006701+00:00',
          },
          {
            id: '3be3bc12-6e05-498a-ace7-abcdefgh',
            createdAt: '2022-05-25T17:13:52.004179+00:00',
            commandType: 'loadModule',
            key: '3be3bc12-6e05-498a-ace7-abcdefgh',
            status: 'succeeded',
            params: {
              model: 'magneticModuleV1',
              location: {
                slotName: '6',
              },
              moduleId: 'magneticModuleId_2',
            },
            result: {
              moduleId: 'magneticModuleId_2',
              definition: {
                otSharedSchema: 'module/schemas/2',
                moduleType: 'magneticModuleType',
                model: 'magneticModuleV1',
                labwareOffset: {
                  x: 0.125,
                  y: -0.125,
                  z: 82.25,
                },
                dimensions: {
                  bareOverallHeight: 110.152,
                  overLabwareHeight: 4.052,
                },
                calibrationPoint: {
                  x: 124.875,
                  y: 2.75,
                  z: 82.25,
                },
                displayName: 'Magnetic Module GEN1',
                quirks: [],
                slotTransforms: {},
                compatibleWith: [],
              },
              model: 'magneticModuleV1',
              serialNumber:
                'fake-serial-number-0c3bd51c-f519-43a3-a5ae-abcdefgh',
            },
            startedAt: '2022-05-25T17:13:52.006056+00:00',
            completedAt: '2022-05-25T17:13:52.006701+00:00',
          },
        ],
      },
    } as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return a module id from protocol analysis that matches the module attached', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseAttachedModules.mockReturnValue([mockMagneticModule])
    const { result } = renderHook(
      () => useModuleIdFromRun(mockMagneticModule, RUN_ID),
      { wrapper }
    )
    const moduleIdFromRun = result.current

    expect(moduleIdFromRun.moduleIdFromRun).toBe('magneticModuleId_1')
  })

  it('should return the correct module id when there is multiples of a module', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseAttachedModules.mockReturnValue([
      mockMagneticModule,
      mockMagneticModule2,
    ])
    const { result } = renderHook(
      () => useModuleIdFromRun(mockMagneticModule2, RUN_ID),
      { wrapper }
    )
    const moduleIdFromRun = result.current

    expect(moduleIdFromRun.moduleIdFromRun).toBe('magneticModuleId_2')
  })

  it('should return an empty string if moduleIndex equals null meaning module is not included in protocol', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    mockUseAttachedModules.mockReturnValue([mockThermocycler])
    const { result } = renderHook(
      () => useModuleIdFromRun(mockMagneticModule, RUN_ID),
      { wrapper }
    )
    const moduleIdFromRun = result.current

    expect(moduleIdFromRun.moduleIdFromRun).toBe('')
  })
})
