import * as React from 'react'
import '@testing-library/jest-dom'
import { fireEvent } from '@testing-library/react'
import { resetAllWhenMocks, when } from 'jest-when'
import { useCreateLabwareOffsetMutation } from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'
import { TEMPERATURE_MODULE_V2 } from '@opentrons/shared-data'
import { i18n } from '../../../i18n'
import { mockRunningRun } from '../../RunTimeControl/__fixtures__'
import {
  useClearAllOffsetsForCurrentRun,
  useOffsetCandidatesForCurrentRun,
} from '../hooks'
import { ReapplyOffsetsModal } from '../'

import type { LabwareOffset } from '@opentrons/api-client'

jest.mock('../hooks')
jest.mock('@opentrons/react-api-client')

const mockUseOffsetCandidateForCurrentRun = useOffsetCandidatesForCurrentRun as jest.MockedFunction<
  typeof useOffsetCandidatesForCurrentRun
>
const mockUseCreateLabwareOffsetMutation = useCreateLabwareOffsetMutation as jest.MockedFunction<
  typeof useCreateLabwareOffsetMutation
>
const mockUseClearAllOffsetsForCurrentRun = useClearAllOffsetsForCurrentRun as jest.MockedFunction<
  typeof useClearAllOffsetsForCurrentRun
>

const MOCK_RUN_ID = 'fakeRunId'
const mockOffsetCandidate: LabwareOffset = {
  id: 'fakeOffsetId',
  createdAt: 'fakeTimestamp',
  location: { slotName: '1' },
  definitionUri: 'fakeDefUri',
  vector: { x: 1, y: 2, z: 3 },
}
const mockOffsetCandidateOnMod: LabwareOffset = {
  id: 'fakeOffsetIdOnMod',
  location: { slotName: '3', moduleModel: TEMPERATURE_MODULE_V2 },
  vector: { x: 4, y: 5, z: 6 },
  createdAt: 'fakeTimestamp',
  definitionUri: 'fakeDefUri',
}

const render = () => {
  return renderWithProviders(<ReapplyOffsetsModal runId={MOCK_RUN_ID} />, {
    i18nInstance: i18n,
  })[0]
}

describe('RunDetails', () => {
  let mockCreateLabwareOffset: jest.Mock
  let mockClearAllOffsets: jest.Mock
  beforeEach(() => {
    mockCreateLabwareOffset = jest.fn().mockReturnValue(Promise.resolve())
    mockClearAllOffsets = jest.fn()
    when(mockUseOffsetCandidateForCurrentRun).calledWith().mockReturnValue([])
    when(mockUseCreateLabwareOffsetMutation)
      .calledWith()
      .mockReturnValue({ createLabwareOffset: mockCreateLabwareOffset } as any)
    when(mockUseClearAllOffsetsForCurrentRun)
      .calledWith()
      .mockReturnValue(mockClearAllOffsets)
  })

  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders null if there are no candidate offsets', () => {
    const { queryByText } = render()
    expect(queryByText('Apply stored Labware Offset data?')).toBeNull()
  })

  it('renders title and explanatory text if there is at least one candidate', () => {
    when(mockUseOffsetCandidateForCurrentRun)
      .calledWith()
      .mockReturnValue([
        {
          ...mockOffsetCandidate,
          labwareDisplayName: 'Fake Labware',
          runCreatedAt: mockRunningRun.createdAt,
        },
      ])
    const { getByText } = render()
    expect(getByText('Apply stored Labware Offset data?')).toBeInTheDocument()
    expect(
      getByText(
        'This robot has stored Labware Offset data from previous protocol runs. Do you want to apply that data to this protocol run? You can still adjust any offsets with Labware Position Check.'
      )
    ).toBeInTheDocument()
  })

  it('renders candidate table row for each candidate', () => {
    when(mockUseOffsetCandidateForCurrentRun)
      .calledWith()
      .mockReturnValue([
        {
          ...mockOffsetCandidate,
          labwareDisplayName: 'Fake Labware One',
          runCreatedAt: mockRunningRun.createdAt,
        },
        {
          ...mockOffsetCandidateOnMod,
          labwareDisplayName: 'Fake Labware Two',
          runCreatedAt: '2021-10-08T18:45:49.366581+00:00',
        },
      ])
    const { getByText } = render()
    expect(getByText(/10\/07\/2021/i)).toBeInTheDocument()
    expect(getByText(/:44:49/i)).toBeInTheDocument()
    expect(getByText('Slot 1')).toBeInTheDocument()
    expect(getByText('Fake Labware One')).toBeInTheDocument()
    expect(getByText('1.00')).toBeInTheDocument()
    expect(getByText('2.00')).toBeInTheDocument()
    expect(getByText('3.00')).toBeInTheDocument()
    expect(getByText(/10\/08\/2021/i)).toBeInTheDocument()
    expect(getByText(/:45:49/i)).toBeInTheDocument()
    expect(getByText('Slot 3 - Temperature Module GEN2')).toBeInTheDocument()
    expect(getByText('Fake Labware Two')).toBeInTheDocument()
    expect(getByText('4.00')).toBeInTheDocument()
    expect(getByText('5.00')).toBeInTheDocument()
    expect(getByText('6.00')).toBeInTheDocument()
  })
  it('clears all offsets if ignore is clicked', () => {
    when(mockUseOffsetCandidateForCurrentRun)
      .calledWith()
      .mockReturnValue([
        {
          ...mockOffsetCandidate,
          labwareDisplayName: 'Fake Labware One',
          runCreatedAt: mockRunningRun.createdAt,
        },
      ])
    const { getByRole } = render()
    const ignoreButton = getByRole('button', { name: 'Ignore stored data' })
    fireEvent.click(ignoreButton)
    expect(mockClearAllOffsets).toHaveBeenCalled()
  })
  it('clears applies all candidate offsets if apply is clicked', () => {
    when(mockUseOffsetCandidateForCurrentRun)
      .calledWith()
      .mockReturnValue([
        {
          ...mockOffsetCandidate,
          labwareDisplayName: 'Fake Labware One',
          runCreatedAt: mockRunningRun.createdAt,
        },
        {
          ...mockOffsetCandidateOnMod,
          labwareDisplayName: 'Fake Labware Two',
          runCreatedAt: '2021-10-08T18:45:49.366581+00:00',
        },
      ])
    const { getByRole } = render()
    const applyButton = getByRole('button', { name: 'Apply stored data' })
    fireEvent.click(applyButton)
    expect(mockCreateLabwareOffset.mock.calls).toEqual([
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: mockOffsetCandidate.definitionUri,
            location: mockOffsetCandidate.location,
            vector: mockOffsetCandidate.vector,
          },
        },
      ],
      [
        {
          runId: MOCK_RUN_ID,
          data: {
            definitionUri: mockOffsetCandidateOnMod.definitionUri,
            location: mockOffsetCandidateOnMod.location,
            vector: mockOffsetCandidateOnMod.vector,
          },
        },
      ],
    ])
  })
})
