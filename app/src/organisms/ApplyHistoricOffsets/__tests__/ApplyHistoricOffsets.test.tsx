import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { ApplyHistoricOffsets } from '..'
import { getIsLabwareOffsetCodeSnippetsOn } from '../../../redux/config'
import type { OffsetCandidate } from '../hooks/useOffsetCandidatesForAnalysis'

jest.mock('../../../redux/config')

const mockGetIsLabwareOffsetCodeSnippetsOn = getIsLabwareOffsetCodeSnippetsOn as jest.MockedFunction<
  typeof getIsLabwareOffsetCodeSnippetsOn
>

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

describe('ApplyHistoricOffsets', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof ApplyHistoricOffsets>>
  ) => ReturnType<typeof renderWithProviders>
  const mockSetShouldApplyOffsets = jest.fn()

  beforeEach(() => {
    render = props =>
      renderWithProviders<React.ComponentProps<typeof ApplyHistoricOffsets>>(
        <ApplyHistoricOffsets
          offsetCandidates={[
            mockFirstCandidate,
            mockSecondCandidate,
            mockThirdCandidate,
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
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct copy when shouldApplyOffsets is true', () => {
    const [{ getByText }] = render()
    getByText('Apply Labware Offset data')
    getByText('View data')
  })

  it('renders correct copy when shouldApplyOffsets is false', () => {
    const [{ getByText }] = render({ shouldApplyOffsets: false })
    getByText('Apply Labware Offset data')
    getByText('View data')
  })

  it('renders view data modal when link clicked, with correct copy and table row for each candidate', () => {
    const [{ getByText, getByRole, queryByText, getByTestId }] = render()
    getByText('View data').click()

    getByRole('heading', { name: 'Stored Labware Offset data' })
    getByText(
      'This robot has offsets for labware used in this protocol. If you apply these offsets, you can still adjust them with Labware Position Check.'
    )
    expect(
      getByRole('link', { name: 'See how labware offsets work' })
    ).toHaveAttribute(
      'href',
      'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
    )

    // first candidate table row
    getByText('Slot 1')
    // second candidate table row
    getByText('Slot 2')
    // third candidate on module table row
    getByText('Slot 3 - Heater-Shaker Module GEN1')
    getByTestId('ModalHeader_icon_close_Stored Labware Offset data').click()

    expect(queryByText('Stored Labware Offset data')).toBeNull()
  })

  it('renders view data modal when link clicked, with correct empty state if no candidates', () => {
    const [{ getByText, getByRole, queryByText }] = render({
      offsetCandidates: [],
    })
    getByText('No offset data available')
    getByText('Learn more').click()

    getByRole('heading', { name: 'What is labware offset data?' })

    getByText(
      'Labware offset data references previous protocol run labware locations to save you time. If all the labware in this protocol have been checked in previous runs, that data will be applied to this run.'
    )
    getByText(
      'You can add new offsets with Labware Position Check in later steps.'
    )

    expect(
      getByRole('link', { name: 'See how labware offsets work' })
    ).toHaveAttribute(
      'href',
      'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'
    )
    expect(queryByText('location')).toBeNull()
  })

  it('renders tabbed offset data with snippets when config option is selected', () => {
    mockGetIsLabwareOffsetCodeSnippetsOn.mockReturnValue(true)
    const [{ getByText }] = render()
    getByText('View data').click()
    expect(getByText('Table View')).toBeTruthy()
    expect(getByText('Jupyter Notebook')).toBeTruthy()
    expect(getByText('Command Line Interface (SSH)')).toBeTruthy()
  })
})
