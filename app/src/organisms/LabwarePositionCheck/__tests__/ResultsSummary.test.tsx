import * as React from 'react'
import { resetAllWhenMocks } from 'jest-when'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ResultsSummary } from '../ResultsSummary'
import { SECTIONS } from '../constants'
import { mockTipRackDefinition } from '../../../redux/custom-labware/__fixtures__'
import { CompletedProtocolAnalysis, getLabwareDefURI } from '@opentrons/shared-data'

const render = (props: React.ComponentProps<typeof ResultsSummary>) => {
  return renderWithProviders(<ResultsSummary {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const mockCompletedAnalysis: CompletedProtocolAnalysis = {
  id: 'fakeAnalysisId',
  status: 'completed',
  result: 'ok',
  errors: [],
  labware: [{
    id: 'labwareId1',
    loadName: 'fakeLoadName',
    definitionUri: getLabwareDefURI(mockTipRackDefinition),
    location: { slotName: '1' }
  }],
  pipettes: [],
  modules: [],
  liquids: [],
  commands: [
    {
      commandType: 'loadLabware',
      id: 'fakeCommandId',
      status: 'succeeded',
      createdAt: 'fakeCreatedAtTimestamp',
      startedAt: 'fakeStartedAtTimestamp',
      completedAt: 'fakecompletedAtTimestamp',
      error: null,
      params: {
        labwareId: 'labwareId1',
        location: {slotName: '1'},
      },
      result: {
        labwareId: 'labwareId1',
        definition: mockTipRackDefinition,
        offset: {x: 0, y: 0, z: 0} 
      }
    }
  ]
}

const mockExistingOffset = {
  id: 'offset1',
  createdAt: 'fake_timestamp',
  definitionUri: getLabwareDefURI(mockTipRackDefinition),
  location: { slotName: '2' },
  vector: { x: 1, y: 2, z: 3 },
}
const mockWorkingOffset = {
  labwareId: 'labwareId1',
  location: { slotName: '1' },
  initialPosition: { x: 1, y: 2, z: 3 },
  finalPosition: { x: 2, y: 3, z: 4 }
}
const mockOtherWorkingOffset = {
  labwareId: 'labwareId1',
  location: { slotName: '3' },
  initialPosition: { x: 3, y: 4, z: 5 },
  finalPosition: { x: 6, y: 7, z: 8 }
}
describe('ResultsSummary', () => {
  let props: React.ComponentProps<typeof ResultsSummary>

  beforeEach(() => {
    props = {
      section: SECTIONS.RESULTS_SUMMARY,
      protocolData: mockCompletedAnalysis,
      workingOffsets: [mockWorkingOffset, mockOtherWorkingOffset],
      existingOffsets: [mockExistingOffset],
      handleApplyOffsets: jest.fn(),
    }
  })
  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })
  it('renders correct copy', () => {
    const { getByText, getByRole } = render(props)
    getByText('New labware offset data')
    getByRole('button', { name: 'Apply Offsets' })
    getByRole('link', { name: 'Need help?' })
    getByRole('columnheader', { name: 'location' })
    getByRole('columnheader', { name: 'labware' })
    getByRole('columnheader', { name: 'labware offset data' })
  })
  it('calls handle apply offsets function when button is clicked', () => {
    const { getByRole } = render(props)
    getByRole('button', { name: 'Apply Offsets' }).click()
    expect(props.handleApplyOffsets).toHaveBeenCalled()
  })
  it('renders a row per offset to apply', () => {
    const { getByRole, queryAllByRole  } = render(props)
    expect(queryAllByRole('cell', { name: mockTipRackDefinition.metadata.displayName})).toHaveLength(2)
    getByRole('cell', { name: 'slot 1'})
    getByRole('cell', { name: 'slot 3'})
    getByRole('cell', { name: 'X 1.0 Y 1.0 Z 1.0'})
    getByRole('cell', { name: 'X 3.0 Y 3.0 Z 3.0'})
  })
})
