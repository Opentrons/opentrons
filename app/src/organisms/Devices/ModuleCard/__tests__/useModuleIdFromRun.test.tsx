import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { useAttachedModules, useProtocolDetailsForRun } from '../../hooks'
import { useModuleIdFromRun } from '../useModuleIdFromRun'
import { mockMagneticModule } from '../../../../redux/modules/__fixtures__'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../hooks')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>

const RUN_ID = '1'

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
              moduleId: 'magneticModuleId',
            },
            result: {
              moduleId: 'magneticModuleId',
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

    expect(moduleIdFromRun.moduleIdFromRun).toBe('magneticModuleId')
  })
})
