import * as React from 'react'
import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { useProtocolAnalysesQuery } from '@opentrons/react-api-client'
import {
  useAttachedModules,
  useAttachedPipettes,
} from '../../../../organisms/Devices/hooks'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import { useMissingProtocolHardware } from '..'
import type { ProtocolAnalyses } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/Devices/hooks')

const mockUseProtocolAnalysesQuery = useProtocolAnalysesQuery as jest.MockedFunction<
  typeof useProtocolAnalysesQuery
>
const mockUseAttachedModules = useAttachedModules as jest.MockedFunction<
  typeof useAttachedModules
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
  pipettes: [{ id: 'pipId', pipetteName: 'p1000_multi_gen3', mount: 'left' }],
  modules: [
    {
      id: 'modId',
      model: 'heaterShakerModuleV1',
      location: { slotName: '1' },
      serialNumber: 'serialNum',
    },
  ],
} as any

describe('useMissingProtocolHardware', () => {
  let wrapper: React.FunctionComponent<{}>
  beforeEach(() => {
    mockUseAttachedPipettes.mockReturnValue({ left: {}, right: {} } as any)
    mockUseAttachedModules.mockReturnValue([])
    mockUseProtocolAnalysesQuery.mockReturnValue({
      data: { data: [PROTOCOL_ANALYSIS as any] },
    } as UseQueryResult<ProtocolAnalyses>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('should return 1 pipette and 1 module', () => {
    const { result } = renderHook(
      () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
      { wrapper }
    )
    expect(result.current).toEqual([
      {
        hardwareType: 'pipette',
        pipetteName: 'p1000_multi_gen3',
        mount: 'left',
        connected: false,
      },
      {
        hardwareType: 'module',
        moduleModel: 'heaterShakerModuleV1',
        slot: '1',
        connected: false,
      },
    ])
  })
  it('should return empty array when the correct modules and pipettes are attached', () => {
    mockUseAttachedPipettes.mockReturnValue({
      left: {
        name: 'p1000_multi_gen3',
      },
      right: {},
    } as any)
    mockUseAttachedModules.mockReturnValue([mockHeaterShaker])
    const { result } = renderHook(
      () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
      { wrapper }
    )
    expect(result.current).toEqual([])
  })
})
