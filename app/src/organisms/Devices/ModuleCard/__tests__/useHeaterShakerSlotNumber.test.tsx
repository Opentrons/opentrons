import * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import { renderHook } from '@testing-library/react-hooks'
import { when } from 'jest-when'
import { ModuleDefinition } from '@opentrons/shared-data'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getProtocolModulesInfo } from '../../../ProtocolSetup/utils/getProtocolModulesInfo'
import { useHeaterShakerSlotNumber } from '../useHeaterShakerSlotNumber'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'

import type { Store } from 'redux'
import type { State } from '../../../../redux/types'

jest.mock('../../../RunDetails/hooks')
jest.mock('../../../ProtocolSetup/utils/getProtocolModulesInfo')

const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetProtocolModulesInfo = getProtocolModulesInfo as jest.MockedFunction<
  typeof getProtocolModulesInfo
>

const HEATER_SHAKER_MODULE_INFO = {
  moduleId: 'heaterShakerModuleId',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: (mockHeaterShaker as unknown) as ModuleDefinition,
  nestedLabwareDef: null,
  nestedLabwareId: null,
  nestedLabwareDisplayName: null,
  protocolLoadOrder: 0,
  slotName: '1',
}

describe('useProtocolMetadata', () => {
  const store: Store<State> = createStore(jest.fn(), {})

  when(mockUseProtocolDetails)
    .calledWith()
    .mockReturnValue({
      protocolData: heaterShakerCommands,
    } as any)

  beforeEach(() => {
    store.dispatch = jest.fn()

    mockGetProtocolModulesInfo.mockReturnValue([HEATER_SHAKER_MODULE_INFO])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return heater shaker slot number', () => {
    const wrapper: React.FunctionComponent<{}> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    )
    const { result } = renderHook(useHeaterShakerSlotNumber, { wrapper })
    const { slotNumber } = result.current

    expect(slotNumber).toBe('1')
  })
})
