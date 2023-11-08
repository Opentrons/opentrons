import { UseQueryResult } from 'react-query'
import { renderHook } from '@testing-library/react-hooks'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  useProtocolQuery,
  useProtocolAnalysisAsDocumentQuery,
} from '@opentrons/react-api-client'
import {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { useRequiredProtocolLabware } from '..'

import type { Protocol } from '@opentrons/api-client'

jest.mock('@opentrons/react-api-client')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../../redux/config')

const PROTOCOL_ID = 'fake_protocol_id'

const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockUseProtocolAnalysisAsDocumentQuery = useProtocolAnalysisAsDocumentQuery as jest.MockedFunction<
  typeof useProtocolAnalysisAsDocumentQuery
>
const mockLabwareDef = fixture_tiprack_300_ul as LabwareDefinition2
const PROTOCOL_ANALYSIS = {
  id: 'fake analysis',
  status: 'completed',
  labware: [],
  pipettes: [{ id: 'pipId', pipetteName: 'p1000_multi_flex', mount: 'left' }],
  modules: [
    {
      id: 'modId',
      model: 'heaterShakerModuleV1',
      location: { slotName: 'D3' },
      serialNumber: 'serialNum',
    },
  ],
  commands: [
    {
      key: 'CommandKey0',
      commandType: 'loadLabware',
      params: {
        labwareId: 'firstLabwareId',
        location: { slotName: 'D3' },
        displayName: 'first labware nickname',
      },
      result: {
        labwareId: 'firstLabwareId',
        definition: mockLabwareDef,
        offset: { x: 0, y: 0, z: 0 },
      },
      id: 'CommandId0',
      status: 'succeeded',
      error: null,
      createdAt: 'fakeCreatedAtTimestamp',
      startedAt: 'fakeStartedAtTimestamp',
      completedAt: 'fakeCompletedAtTimestamp',
    },
  ],
} as any

const NULL_COMMAND = {
  id: '97ba49a5-04f6-4f91-986a-04a0eb632882',
  createdAt: '2022-09-07T19:47:42.781065+00:00',
  commandType: 'loadPipette',
  key: '0feeecaf-3895-46d7-ab71-564601265e35',
  status: 'succeeded',
  params: {
    pipetteName: 'p20_single_gen2',
    mount: 'left',
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  result: {
    pipetteId: '90183a18-a1df-4fd6-9636-be3bcec63fe4',
  },
  startedAt: '2022-09-07T19:47:42.782665+00:00',
  completedAt: '2022-09-07T19:47:42.785061+00:00',
}
const NULL_PROTOCOL_ANALYSIS = {
  ...PROTOCOL_ANALYSIS,
  id: 'null_analysis',
  commands: [NULL_COMMAND],
} as any

describe('useRequiredProtocolLabware', () => {
  beforeEach(() => {
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id } as any] },
        },
      } as UseQueryResult<Protocol>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, PROTOCOL_ANALYSIS.id, { enabled: true })
      .mockReturnValue({
        data: PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
    when(mockUseProtocolAnalysisAsDocumentQuery)
      .calledWith(PROTOCOL_ID, NULL_PROTOCOL_ANALYSIS.id, { enabled: true })
      .mockReturnValue({
        data: NULL_PROTOCOL_ANALYSIS,
      } as UseQueryResult<CompletedProtocolAnalysis>)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('should return LabwareSetupItem array', () => {
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(1)
    expect(result.current[0].nickName).toEqual('first labware nickname')
    expect(result.current[0].definition.dimensions.xDimension).toBe(127.76)
    expect(result.current[0].definition.metadata.displayName).toEqual(
      '300ul Tiprack FIXTURE'
    )
  })

  it('should return empty array when there is no match with protocol id', () => {
    when(mockUseProtocolQuery)
      .calledWith(PROTOCOL_ID)
      .mockReturnValue({
        data: {
          data: {
            analysisSummaries: [{ id: NULL_PROTOCOL_ANALYSIS.id } as any],
          },
        },
      } as UseQueryResult<Protocol>)
    const { result } = renderHook(() => useRequiredProtocolLabware(PROTOCOL_ID))
    expect(result.current.length).toBe(0)
  })
})

// TODO: ND+BH 2023/11/1— uncomment tests when fixture stubs are removed

// describe('useMissingProtocolHardware', () => {
//   let wrapper: React.FunctionComponent<{}>
//   beforeEach(() => {
//     mockUseInstrumentsQuery.mockReturnValue({
//       data: { data: [] },
//       isLoading: false,
//     } as any)
//     mockUseModulesQuery.mockReturnValue({
//       data: { data: [] },
//       isLoading: false,
//     } as any)
//     mockUseProtocolQuery.mockReturnValue({
//       data: {
//         data: { analysisSummaries: [{ id: PROTOCOL_ANALYSIS.id } as any] },
//       },
//     } as UseQueryResult<Protocol>)
//     mockUseProtocolAnalysisAsDocumentQuery.mockReturnValue({
//       data: PROTOCOL_ANALYSIS,
//     } as UseQueryResult<CompletedProtocolAnalysis>)
//     mockUseDeckConfigurationQuery.mockReturnValue({
//       data: [{}],
//     } as UseQueryResult<DeckConfiguration>)
//   })

//   afterEach(() => {
//     jest.resetAllMocks()
//   })
//   it.todo('should return 1 pipette and 1 module', () => {
//     const { result } = renderHook(
//       () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
//       { wrapper }
//     )
//     expect(result.current).toEqual({
//       isLoading: false,
//       missingProtocolHardware: [
//         {
//           hardwareType: 'pipette',
//           pipetteName: 'p1000_multi_flex',
//           mount: 'left',
//           connected: false,
//         },
//         {
//           hardwareType: 'module',
//           moduleModel: 'heaterShakerModuleV1',
//           slot: 'D3',
//           connected: false,
//           hasSlotConflict: false,
//         },
//       ],
//       conflictedSlots: [],
//     })
//   })
//   it.todo('should return 1 conflicted slot', () => {
//     mockUseDeckConfigurationQuery.mockReturnValue(({
//       data: [
//         {
//           fixtureId: 'mockFixtureId',
//           fixtureLocation: WASTE_CHUTE_SLOT,
//           loadName: WASTE_CHUTE_LOAD_NAME,
//         },
//       ],
//     } as any) as UseQueryResult<DeckConfiguration>)

//     const { result } = renderHook(
//       () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
//       { wrapper }
//     )
//     expect(result.current).toEqual({
//       isLoading: false,
//       missingProtocolHardware: [
//         {
//           hardwareType: 'pipette',
//           pipetteName: 'p1000_multi_flex',
//           mount: 'left',
//           connected: false,
//         },
//         {
//           hardwareType: 'module',
//           moduleModel: 'heaterShakerModuleV1',
//           slot: 'D3',
//           connected: false,
//           hasSlotConflict: true,
//         },
//       ],
//       conflictedSlots: ['D3'],
//     })
//   })
//   it.todo(
//     'should return empty array when the correct modules and pipettes are attached',
//     () => {
//       mockUseInstrumentsQuery.mockReturnValue({
//         data: {
//           data: [
//             {
//               mount: 'left',
//               instrumentType: 'pipette',
//               instrumentName: 'p1000_multi_flex',
//               ok: true,
//             },
//           ],
//         },
//         isLoading: false,
//       } as any)

//       mockUseModulesQuery.mockReturnValue({
//         data: { data: [mockHeaterShaker] },
//         isLoading: false,
//       } as any)
//       const { result } = renderHook(
//         () => useMissingProtocolHardware(PROTOCOL_ANALYSIS.id),
//         { wrapper }
//       )
//       expect(result.current).toEqual({
//         missingProtocolHardware: [],
//         isLoading: false,
//         conflictedSlots: [],
//       })
//     }
//   )
// })
