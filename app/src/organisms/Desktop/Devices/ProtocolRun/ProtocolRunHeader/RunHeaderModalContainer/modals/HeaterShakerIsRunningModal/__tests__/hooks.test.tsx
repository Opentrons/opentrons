import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { legacy_createStore } from 'redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HEATERSHAKER_MODULE_V1 } from '@opentrons/shared-data'

import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { RUN_ID_1 } from '/app/resources/runs/__fixtures__'

import { useHeaterShakerModuleIdsFromRun } from '../hooks'

import type { Store } from 'redux'
import type { FunctionComponent, ReactNode } from 'react'
import type { State } from '/app/redux/types'

vi.mock('/app/resources/runs')

describe('useHeaterShakerModuleIdsFromRun', () => {
  const store: Store<State> = legacy_createStore(vi.fn(), {})

  beforeEach(() => {
    store.dispatch = vi.fn()
  })

  it('should return a heater shaker module id from protocol analysis load command result', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
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
    const wrapper: FunctionComponent<{ children: ReactNode }> = ({
      children,
    }) => <Provider store={store}>{children}</Provider>
    const { result } = renderHook(
      () => useHeaterShakerModuleIdsFromRun(RUN_ID_1),
      { wrapper }
    )

    const moduleIdsFromRun = result.current
    expect(moduleIdsFromRun.moduleIdsFromRun).toStrictEqual(['heatershaker_id'])
  })

  it('should return two heater shaker module ids if two modules are loaded in the protocol', () => {
    vi.mocked(useMostRecentCompletedAnalysis).mockReturnValue({
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

    const wrapper: FunctionComponent<{ children: ReactNode }> = ({
      children,
    }) => <Provider store={store}>{children}</Provider>
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
