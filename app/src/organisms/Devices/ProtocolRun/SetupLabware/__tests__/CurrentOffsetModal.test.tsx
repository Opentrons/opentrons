import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import _uncastedProtocolWithTC from '@opentrons/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import { i18n } from '../../../../../i18n'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../../../redux/config'
import { LabwarePositionCheck } from '../../../../LabwarePositionCheck'
import { RUN_ID_1 } from '../../../../RunTimeControl/__fixtures__'
import { useLPCDisabledReason } from '../../../hooks'
import { CurrentOffsetsModal } from '../CurrentOffsetsModal'
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

const render = (props: React.ComponentProps<typeof CurrentOffsetsModal>) => {
  return renderWithProviders(<CurrentOffsetsModal {...props} />, {
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

describe('CurrentOffsetsModal', () => {
  let props: React.ComponentProps<typeof CurrentOffsetsModal>
  beforeEach(() => {
    props = {
      currentOffsets: mockCurrentOffsets,
      commands: protocolWithTC.commands,
      onCloseClick: jest.fn(),
      runId: RUN_ID_1,
      handleRelaunchLPC: jest.fn(),
      robotName: 'otie',
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
  it('renders the correct text and buttons CTA work', () => {
    const { getByText } = render(props)
    getByText('Applied Labware Offset data')
    getByText('location')
    getByText('labware')
    getByText('labware offset data')
    getByText('cancel').click()
    expect(props.onCloseClick).toHaveBeenCalled()
    getByText('run labware position check').click()
    expect(props.handleRelaunchLPC).toHaveBeenCalled()
  })

  it('renders 1 offset with the correct information', () => {
    const { getByText } = render(props)
    getByText('opentrons/opentrons_96_tiprack_10ul/1')
    getByText('Slot 2')
  })
  //    TODO(jr, 12/20/22): finish this test when we add the jupyter snippet info
  it('renders the Get labware offset data button, clicking on it renders the juypter snippet', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const { getByText } = render(props)
    getByText('Get Labware Offset Data').click()
    getByText('TODO ADD JUPYTER/CLI SNIPPET SUPPORT')
  })
  it('renders the LPC button as disabled when there is a disabled reason', () => {
    mockUseLPCDisabledReason.mockReturnValue('mockDisabledReason')
    const { getByText } = render(props)
    expect(getByText('run labware position check')).toBeDisabled()
  })
})
