import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import fixture_adapter from '@opentrons/shared-data/labware/definitions/2/opentrons_96_pcr_adapter/1.json'
import fixture_96_wellplate from '@opentrons/shared-data/labware/definitions/2/opentrons_96_wellplate_200ul_pcr_full_skirt/1.json'
import { i18n } from '../../../i18n'
import { ApplyHistoricOffsets } from '..'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../redux/config'
import { getLabwareDefinitionsFromCommands } from '../../LabwarePositionCheck/utils/labware'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { OffsetCandidate } from '../hooks/useOffsetCandidatesForAnalysis'
import { fireEvent, screen } from '@testing-library/react'

jest.mock('../../../redux/config')
jest.mock('../../LabwarePositionCheck/utils/labware')

const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>
const mockGetLabwareDefinitionsFromCommands = getLabwareDefinitionsFromCommands as jest.MockedFunction<
  typeof getLabwareDefinitionsFromCommands
>

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

describe('ApplyHistoricOffsets', () => {
  const mockSetShouldApplyOffsets = jest.fn()
  const render = (
    props?: Partial<React.ComponentProps<typeof ApplyHistoricOffsets>>
  ) =>
    renderWithProviders<React.ComponentProps<typeof ApplyHistoricOffsets>>(
      <ApplyHistoricOffsets
        offsetCandidates={[
          mockFirstCandidate,
          mockSecondCandidate,
          mockThirdCandidate,
          mockFourthCandidate,
        ]}
        setShouldApplyOffsets={mockSetShouldApplyOffsets}
        shouldApplyOffsets
        commands={[]}
        labware={[]}
        modules={[]}
        {...props}
      />,
      { i18nInstance: i18n }
    )

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct copy when shouldApplyOffsets is true', () => {
    render()
    screen.getByText('Apply labware offset data')
    screen.getByText('View data')
  })

  it('renders correct copy when shouldApplyOffsets is false', () => {
    render({ shouldApplyOffsets: false })
    screen.getByText('Apply labware offset data')
    screen.getByText('View data')
  })

  it('renders view data modal when link clicked, with correct copy and table row for each candidate', () => {
    mockGetLabwareDefinitionsFromCommands.mockReturnValue([
      mockLabwareDef,
      mockAdapterDef,
    ])
    render()
    const viewDataButton = screen.getByText('View data')
    fireEvent.click(viewDataButton)

    screen.getByRole('heading', { name: 'Apply Stored Labware Offset Data?' })
    screen.getByText(
      'This robot has offsets for labware used in this protocol. If you apply these offsets, you can still adjust them with Labware Position Check.'
    )
    expect(
      screen.getByRole('link', { name: 'See how labware offsets work' })
    ).toHaveAttribute(
      'href',
      'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
    )

    // first candidate table row
    screen.getByText('Slot 1')
    // second candidate table row
    screen.getByText('Slot 2')
    //  4th candidate a labware on adapter on module
    screen.getByText(
      'Opentrons 96 PCR Heater-Shaker Adapter in Heater-Shaker Module GEN1 in Slot 3'
    )
    // third candidate on module table row
    screen.getByText('Heater-Shaker Module GEN1 in Slot 3')
    const closeButton = screen.getByTestId(
      'ModalHeader_icon_close_Apply Stored Labware Offset Data?'
    )
    fireEvent.click(closeButton)
    expect(screen.queryByText('Apply Stored Labware Offset Data?')).toBeNull()
  })

  it('renders view data modal when link clicked, with correct empty state if no candidates', () => {
    render({
      offsetCandidates: [],
    })
    screen.getByText('No offset data available')
    const learnMoreBUtton = screen.getByText('Learn more')
    fireEvent.click(learnMoreBUtton)

    screen.getByRole('heading', { name: 'What is labware offset data?' })

    screen.getByText(
      'Labware offset data references previous protocol run labware locations to save you time. If all the labware in this protocol have been checked in previous runs, that data will be applied to this run.'
    )
    screen.getByText(
      'You can add new offsets with Labware Position Check in later steps.'
    )

    expect(
      screen.getByRole('link', { name: 'See how labware offsets work' })
    ).toHaveAttribute(
      'href',
      'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
    )
    expect(screen.queryByText('location')).toBeNull()
  })

  it('renders tabbed offset data with snippets when config option is selected', () => {
    mockGetLabwareDefinitionsFromCommands.mockReturnValue([
      mockLabwareDef,
      mockAdapterDef,
    ])
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    render()
    const viewDataButton = screen.getByText('View data')
    fireEvent.click(viewDataButton)
    expect(screen.getByText('Table View')).toBeTruthy()
    expect(screen.getByText('Jupyter Notebook')).toBeTruthy()
    expect(screen.getByText('Command Line Interface (SSH)')).toBeTruthy()
  })
})
