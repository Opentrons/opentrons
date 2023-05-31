import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../../redux/config'
import { LabwarePositionCheck } from '../../../../LabwarePositionCheck'
import { useLPCDisabledReason } from '../../../hooks'
import { CurrentOffsetsTable } from '../CurrentOffsetsTable'
import { getLatestCurrentOffsets } from '../utils'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import type { LabwareOffset } from '@opentrons/api-client'

jest.mock('../../../hooks')
jest.mock('../../../../LabwarePositionCheck')
jest.mock('../../../../../redux/config')
jest.mock('../utils')
jest.mock('@opentrons/shared-data', () => {
  const actualComponents = jest.requireActual('@opentrons/shared-data')
  return {
    ...actualComponents,
    getLoadedLabwareDefinitionsByUri: jest.fn(),
  }
})
const mockGetLoadedLabwareDefinitionsByUri = getLoadedLabwareDefinitionsByUri as jest.MockedFunction<
  typeof getLoadedLabwareDefinitionsByUri
>
const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>
const mockGetLatestCurrentOffsets = getLatestCurrentOffsets as jest.MockedFunction<
  typeof getLatestCurrentOffsets
>
const mockLabwarePositionCheck = LabwarePositionCheck as jest.MockedFunction<
  typeof LabwarePositionCheck
>
const mockUseLPCDisabledReason = useLPCDisabledReason as jest.MockedFunction<
  typeof useLPCDisabledReason
>

const render = (props: React.ComponentProps<typeof CurrentOffsetsTable>) => {
  return renderWithProviders(<CurrentOffsetsTable {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const protocolWithTC = (_uncastedProtocolWithTC as unknown) as ProtocolAnalysisFile
const mockCurrentOffsets: LabwareOffset[] = [
  {
    createdAt: '2022-12-20T14:06:23.562082+00:00',
    definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
    id: 'dceac542-bca4-4313-82ba-d54a19dab204',
    location: { slotName: '2' },
    vector: { x: 0, y: -0.09999999999999432, z: 0 },
  },
  {
    createdAt: '2022-12-20T14:06:23.562878+00:00',
    definitionUri:
      'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
    id: '70ae2e31-716b-4e1f-a90c-9b0dfd4d7feb',
    location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
    vector: { x: 0, y: 0, z: 0 },
  },
  {
    createdAt: '2022-12-20T14:09:08.688756+00:00',
    definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
    id: '494ec3d1-224f-4f9a-a83b-3dd3060ea332',
    location: { slotName: '2' },
    vector: { x: 0, y: -0.09999999999999432, z: -0.09999999999999432 },
  },
  {
    createdAt: '2022-12-20T14:09:08.689813+00:00',
    definitionUri:
      'opentrons/opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat/1',
    id: 'd39b972e-9b2d-436c-a597-3bc81aabc634',
    location: { slotName: '1', moduleModel: 'heaterShakerModuleV1' },
    vector: { x: -0.10000000000000142, y: 0, z: 0 },
  },
]

describe('CurrentOffsetsTable', () => {
  let props: React.ComponentProps<typeof CurrentOffsetsTable>
  beforeEach(() => {
    props = {
      currentOffsets: mockCurrentOffsets,
      commands: protocolWithTC.commands,
      labware: Object.entries(protocolWithTC.labware).map(([id, labware]) => ({
        id,
        ...labware,
        loadName: 'fakeLoadName',
        definitionUri: labware.definitionId,
        location: 'offDeck',
      })),
      modules: Object.entries(protocolWithTC.modules).map(([id, module]) => ({
        id,
        ...module,
        location: { slotName: '1' },
        serialNumber: 'fakeserial',
      })),
    }
    mockUseLPCDisabledReason.mockReturnValue(null)
    mockGetLoadedLabwareDefinitionsByUri.mockReturnValue(
      protocolWithTC.labware as any
    )
    mockLabwarePositionCheck.mockReturnValue(
      <div>mock labware position check</div>
    )
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(false)
    mockGetLatestCurrentOffsets.mockReturnValue([
      {
        createdAt: '2022-12-20T14:06:23.562082+00:00',
        definitionUri: 'opentrons/opentrons_96_tiprack_10ul/1',
        id: 'dceac542-bca4-4313-82ba-d54a19dab204',
        location: { slotName: '2' },
        vector: { x: 0, y: -0.09999999999999432, z: 0 },
      },
    ])
  })
  it('renders the correct text', () => {
    const { getByText } = render(props)
    getByText('Applied Labware Offset data')
    getByText('location')
    getByText('labware')
    getByText('labware offset data')
  })

  it('renders 1 offset with the correct information', () => {
    const { getByText } = render(props)
    getByText('opentrons/opentrons_96_tiprack_10ul/1')
    getByText('Slot 2')
  })

  it('renders tabbed offset data with snippets when config option is selected', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const { getByText } = render(props)
    expect(getByText('Table View')).toBeTruthy()
    expect(getByText('Jupyter Notebook')).toBeTruthy()
    expect(getByText('Command Line Interface (SSH)')).toBeTruthy()
  })
})
