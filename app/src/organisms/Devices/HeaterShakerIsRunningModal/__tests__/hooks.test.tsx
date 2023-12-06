import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react'
import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useHeaterShakerModuleIdsFromRun } from '../hooks'
import { RUN_ID_1 } from '../../../RunTimeControl/__fixtures__'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../hooks')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')

const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>

describe('useHeaterShakerModuleIdsFromRun', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  beforeEach(() => {
    store.dispatch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return a heater shaker module id from protocol analysis load command result', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      pipettes: {},
      labware: {},
      modules: {
        heatershaker_id: {
          model: HEATERSHAKER_MODULE_V1,
        },
      },
      labwareDefinitions: {},
      commands: [
        {
          id: 'mock_command_1',
          createdAt: '2022-07-27T22:26:33.846399+00:00',
          commandType: 'loadModule',
          key: '286d7201-bfdc-4c2c-ae67-544367dbbabe',
          status: 'succeeded',
          params: {
            model: HEATERSHAKER_MODULE_V1,
            location: {
              slotName: '1',
            },
            moduleId: 'heatershaker_id',
          },
          result: {
            moduleId: 'heatershaker_id',
            definition: {},
            model: HEATERSHAKER_MODULE_V1,
            serialNumber: 'fake-serial-number-1',
          },
          startedAt: '2022-07-27T22:26:33.875106+00:00',
          completedAt: '2022-07-27T22:26:33.878079+00:00',
        },
      ],
    } as any)
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useHeaterShakerModuleIdsFromRun(RUN_ID_1),
      { wrapper }
    )

    const moduleIdsFromRun = result.current
    expect(moduleIdsFromRun.moduleIdsFromRun).toStrictEqual(['heatershaker_id'])
  })

  it('should return two heater shaker module ids if two modules are loaded in the protocol', () => {
    mockUseMostRecentCompletedAnalysis.mockReturnValue({
      pipettes: {},
      labware: {},
      modules: {
        heatershaker_id: {
          model: HEATERSHAKER_MODULE_V1,
        },
      },
      labwareDefinitions: {},
      commands: [
        {
          id: 'mock_command_1',
          createdAt: '2022-07-27T22:26:33.846399+00:00',
          commandType: 'loadModule',
          key: '286d7201-bfdc-4c2c-ae67-544367dbbabe',
          status: 'succeeded',
          params: {
            model: HEATERSHAKER_MODULE_V1,
            location: {
              slotName: '1',
            },
            moduleId: 'heatershaker_id_1',
          },
          result: {
            moduleId: 'heatershaker_id_1',
            definition: {},
            model: HEATERSHAKER_MODULE_V1,
            serialNumber: 'fake-serial-number-1',
          },
          startedAt: '2022-07-27T22:26:33.875106+00:00',
          completedAt: '2022-07-27T22:26:33.878079+00:00',
        },
        {
          id: 'mock_command_2',
          createdAt: '2022-07-27T22:26:33.846399+00:00',
          commandType: 'loadModule',
          key: '286d7201-bfdc-4c2c-ae67-544367dbbabe',
          status: 'succeeded',
          params: {
            model: HEATERSHAKER_MODULE_V1,
            location: {
              slotName: '1',
            },
            moduleId: 'heatershaker_id_2',
          },
          result: {
            moduleId: 'heatershaker_id_2',
            definition: {},
            model: 'heaterShakerModuleV1_2',
            serialNumber: 'fake-serial-number-2',
          },
          startedAt: '2022-07-27T22:26:33.875106+00:00',
          completedAt: '2022-07-27T22:26:33.878079+00:00',
        },
      ],
    } as any)

    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(
      () => useHeaterShakerModuleIdsFromRun(RUN_ID_1),
      { wrapper }
    )

    const moduleIdsFromRun = result.current
    expect(moduleIdsFromRun.moduleIdsFromRun).toStrictEqual([
      'heatershaker_id_1',
      'heatershaker_id_2',
    ])
  })
})
