import * as React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { renderHook } from '@testing-library/react'
import fixture_tiprack_300_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'
import { useAllHistoricOffsets } from '../useAllHistoricOffsets'
import { getLabwareLocationCombos } from '../getLabwareLocationCombos'

import { useOffsetCandidatesForAnalysis } from '../useOffsetCandidatesForAnalysis'
import { storedProtocolData as storedProtocolDataFixture } from '../../../../redux/protocol-storage/__fixtures__'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { OffsetCandidate } from '../useOffsetCandidatesForAnalysis'

jest.mock('../useAllHistoricOffsets')
jest.mock('../getLabwareLocationCombos')
jest.mock('@opentrons/shared-data')

const mockLabwareDef = fixture_tiprack_300_ul as LabwareDefinition2
const mockUseAllHistoricOffsets = useAllHistoricOffsets as jest.MockedFunction<
  typeof useAllHistoricOffsets
>
const mockGetLabwareLocationCombos = getLabwareLocationCombos as jest.MockedFunction<
  typeof getLabwareLocationCombos
>
const mockGetLoadedLabwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri as jest.MockedFunction<
  typeof getLoadedLabwareDefinitionsByUri
>
const mockFirstCandidate: OffsetCandidate = {
  id: 'first_offset_id',
  labwareDisplayName: 'First Fake Labware Display Name',
  location: { slotName: '1' },
  vector: { x: 1, y: 2, z: 3 },
  definitionUri: 'firstFakeDefURI',
  createdAt: '2022-05-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-05-11T13:33:51.012179+00:00',
}
const mockSecondCandidate: OffsetCandidate = {
  id: 'second_offset_id',
  labwareDisplayName: 'Second Fake Labware Display Name',
  location: { slotName: '2' },
  vector: { x: 4, y: 5, z: 6 },
  definitionUri: 'secondFakeDefURI',
  createdAt: '2022-06-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-06-11T13:33:51.012179+00:00',
}
const mockThirdCandidate: OffsetCandidate = {
  id: 'third_offset_id',
  labwareDisplayName: 'Third Fake Labware Display Name',
  location: { slotName: '3', moduleModel: 'heaterShakerModuleV1' },
  vector: { x: 7, y: 8, z: 9 },
  definitionUri: 'thirdFakeDefURI',
  createdAt: '2022-07-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-07-11T13:33:51.012179+00:00',
}

const mockFirstDupCandidate = {
  ...mockFirstCandidate,
  id: 'laterDuplicateOfFirstOffset',
  createdAt: '2022-08-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-08-11T13:33:51.012179+00:00',
}

const mockRobotIp = 'fakeRobotIp'

describe('useOffsetCandidatesForAnalysis', () => {
  beforeEach(() => {
    when(mockUseAllHistoricOffsets)
      .calledWith({ hostname: mockRobotIp })
      .mockReturnValue([
        mockFirstDupCandidate,
        mockThirdCandidate,
        mockSecondCandidate,
        mockFirstCandidate,
      ])
    when(mockUseAllHistoricOffsets).calledWith(null).mockReturnValue([])
    when(mockGetLabwareLocationCombos)
      .calledWith(expect.any(Array), expect.any(Array), expect.any(Array))
      .mockReturnValue([
        {
          location: { slotName: '1' },
          definitionUri: 'firstFakeDefURI',
          labwareId: 'firstFakeId',
        },
        {
          location: { slotName: '2' },
          definitionUri: 'secondFakeDefURI',
          labwareId: 'secondFakeId',
        },
        {
          location: { slotName: '3', moduleModel: 'heaterShakerModuleV1' },
          labwareId: 'thirdFakeId',
          moduleId: 'fakeHSId',
          definitionUri: 'thirdFakeDefURI',
        },
      ])
    when(mockGetLoadedLabwareDefinitionsByUri)
      .calledWith(expect.any(Array))
      .mockReturnValue({
        firstFakeDefURI: mockLabwareDef,
        secondFakeDefURI: mockLabwareDef,
        thirdFakeDefURI: mockLabwareDef,
      })
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('returns an empty array if robot ip but no analysis output', async () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <div>{children}</div>
    )
    const { result, waitFor } = renderHook(
      () => useOffsetCandidatesForAnalysis(null, mockRobotIp),
      { wrapper }
    )
    await waitFor(() => result.current != null)
    expect(result.current).toEqual([])
  })

  it('returns an empty array if no robot ip', async () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <div>{children}</div>
    )
    const { result, waitFor } = renderHook(
      () =>
        useOffsetCandidatesForAnalysis(
          storedProtocolDataFixture.mostRecentAnalysis,
          null
        ),
      { wrapper }
    )
    await waitFor(() => result.current != null)
    expect(result.current).toEqual([])
  })
  it('returns candidates for each first match with newest first', async () => {
    const wrapper: React.FunctionComponent<{children: React.ReactNode}> = ({ children }) => (
      <div>{children}</div>
    )
    const { result, waitFor } = renderHook(
      () =>
        useOffsetCandidatesForAnalysis(
          storedProtocolDataFixture.mostRecentAnalysis,
          mockRobotIp
        ),
      { wrapper }
    )
    await waitFor(() => result.current != null)
    expect(result.current).toEqual([
      {
        ...mockFirstDupCandidate,
        labwareDisplayName: getLabwareDisplayName(mockLabwareDef),
      },
      {
        ...mockSecondCandidate,
        labwareDisplayName: getLabwareDisplayName(mockLabwareDef),
      },
      {
        ...mockThirdCandidate,
        labwareDisplayName: getLabwareDisplayName(mockLabwareDef),
      },
    ])
  })
})
