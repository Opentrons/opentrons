import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import fixture_adapter from '@opentrons/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json'
import fixture_96_wellplate from '@opentrons/shared-data/labware/definitions/2/opentrons_96_wellplate_200ul_pcr_full_skirt/1.json'
import { i18n } from '../../../i18n'
import { LabwareOffsetTable } from '../LabwareOffsetTable'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { OffsetCandidate } from '../hooks/useOffsetCandidatesForAnalysis'

const mockLabwareDef = fixture_96_wellplate as LabwareDefinition2
const mockAdapterDef = fixture_adapter as LabwareDefinition2

const mockFirstCandidate: OffsetCandidate = {
  id: 'first_offset_id',
  labwareDisplayName: 'First Fake Labware Display Name',
  location: { slotName: '1' },
  vector: { x: 1, y: 2, z: 3 },
  definitionUri: 'firstFakeDefURI',
  createdAt: '2022-07-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-07-11T13:33:51.012179+00:00',
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
  createdAt: '2022-05-11T13:34:51.012179+00:00',
  runCreatedAt: '2022-05-11T13:33:51.012179+00:00',
}

const mockFourthCandidate: OffsetCandidate = {
  id: 'fourth_offset_id',
  labwareDisplayName: 'Fourth Fake Labware Display Name',
  location: {
    slotName: '3',
    moduleModel: 'heaterShakerModuleV1',
    definitionUri: 'opentrons/opentrons_96_pcr_adapter/1',
  },
  vector: { x: 7.1, y: 8.1, z: 7.2 },
  definitionUri: 'fourthFakeDefURI',
  createdAt: '2022-05-12T13:34:51.012179+00:00',
  runCreatedAt: '2022-05-12T13:33:51.012179+00:00',
}

describe('LabwareOffsetTable', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof LabwareOffsetTable>>
  ) => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    render = () =>
      renderWithProviders<React.ComponentProps<typeof LabwareOffsetTable>>(
        <LabwareOffsetTable
          labwareDefinitions={[mockLabwareDef, mockAdapterDef]}
          offsetCandidates={[
            mockFirstCandidate,
            mockSecondCandidate,
            mockThirdCandidate,
            mockFourthCandidate,
          ]}
        />,
        { i18nInstance: i18n }
      )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders headers text and values for each candidate', () => {
    const [{ getByText, queryAllByText }] = render()
    // headers
    getByText('location')
    getByText('Run')
    getByText('labware')
    getByText('labware offset data')
    expect(queryAllByText('X')).toHaveLength(4)
    expect(queryAllByText('Y')).toHaveLength(4)
    expect(queryAllByText('Z')).toHaveLength(4)
    // first candidate
    getByText('Slot 1')
    getByText(/7\/11\/2022/i)
    getByText('First Fake Labware Display Name')
    getByText('1.00')
    getByText('2.00')
    getByText('3.00')
    // second candidate
    getByText('Slot 2')
    getByText(/6\/11\/2022/i)
    getByText('Second Fake Labware Display Name')
    getByText('4.00')
    getByText('5.00')
    getByText('6.00')
    // third candidate is adapter on module
    getByText('Heater-Shaker Module GEN1 in Slot 3')
    getByText(/5\/11\/2022/i)
    getByText('Third Fake Labware Display Name')
    getByText('7.00')
    getByText('8.00')
    getByText('9.00')
    //  fourth candidate is labware on adapter on module
    getByText(
      'Opentrons 96 PCR Heater-Shaker Adapter in Heater-Shaker Module GEN1 in Slot 3'
    )
    getByText('Fourth Fake Labware Display Name')
    getByText('7.20')
    getByText('8.10')
    getByText('7.10')
  })
})
