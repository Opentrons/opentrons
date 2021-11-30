import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import '@testing-library/jest-dom'
import { fireEvent, screen } from '@testing-library/react'
import {
  componentPropsMatcher,
  nestedTextMatcher,
  renderWithProviders,
} from '@opentrons/components'
import _uncastedSimpleV6Protocol from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { i18n } from '../../../i18n'
import * as RobotSelectors from '../../../redux/robot/selectors'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { getLatestLabwareOffsetCount } from '../../ProtocolSetup/LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
import { UploadInput } from '../UploadInput'
import { useMostRecentRunId } from '../hooks/useMostRecentRunId'
import { useProtocolQuery, useRunQuery } from '@opentrons/react-api-client'
import { RerunningProtocolModal } from '../RerunningProtocolModal'
import { useCloneRun } from '../hooks'
import type { ProtocolFile } from '@opentrons/shared-data'
import type { LabwareOffset, VectorOffset } from '@opentrons/api-client'

jest.mock('../hooks/useMostRecentRunId')
jest.mock('@opentrons/react-api-client')
jest.mock('../../RunDetails/hooks')
jest.mock('../../../redux/robot/selectors')
jest.mock('../hooks')
jest.mock('../RerunningProtocolModal')
jest.mock(
  '../../ProtocolSetup/LabwarePositionCheck/utils/getLatestLabwareOffsetCount'
)

const mockUseMostRecentRunId = useMostRecentRunId as jest.MockedFunction<
  typeof useMostRecentRunId
>
const mockUseRunQuery = useRunQuery as jest.MockedFunction<typeof useRunQuery>
const mockUseProtocolDetails = useProtocolDetails as jest.MockedFunction<
  typeof useProtocolDetails
>
const mockGetConnectedRobotName = RobotSelectors.getConnectedRobotName as jest.MockedFunction<
  typeof RobotSelectors.getConnectedRobotName
>
const mockUseCloneRun = useCloneRun as jest.MockedFunction<typeof useCloneRun>
const mockUseProtocolQuery = useProtocolQuery as jest.MockedFunction<
  typeof useProtocolQuery
>
const mockRerunningProtocolModal = RerunningProtocolModal as jest.MockedFunction<
  typeof RerunningProtocolModal
>
const mockGetLatestLabwareOffsetCount = getLatestLabwareOffsetCount as jest.MockedFunction<
  typeof getLatestLabwareOffsetCount
>

const simpleV6Protocol = (_uncastedSimpleV6Protocol as unknown) as ProtocolFile<{}>

const render = (props: React.ComponentProps<typeof UploadInput>) => {
  return renderWithProviders(<UploadInput onUpload={props.onUpload} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UploadInput', () => {
  let props = {} as React.ComponentProps<typeof UploadInput>
  let mockOffsets: LabwareOffset[]

  beforeEach(() => {
    props = {
      onUpload: jest.fn(),
    }
    mockOffsets = [
      {
        definitionUri: 'mockUri',
        location: { slotName: '3' },
        vector: { x: 5, y: 5, z: 5 },
      },
    ]
    mockGetConnectedRobotName.mockReturnValue('robotName')
    mockUseMostRecentRunId.mockReturnValue('RunId')
    when(mockUseProtocolDetails).calledWith().mockReturnValue({
      protocolData: simpleV6Protocol,
      displayName: 'mock display name',
    })
    when(mockUseRunQuery)
      .calledWith('RunId')
      .mockReturnValue({
        data: {
          data: {
            protocolId: 'ProtocolId',
            createdAt: '2021-11-12T19:39:19.668514+00:00',
            labwareOffsets: mockOffsets,
          },
        },
      } as any)
    mockUseCloneRun.mockReturnValue(jest.fn())
    when(mockUseProtocolQuery)
      .calledWith('ProtocolId')
      .mockReturnValue({
        data: {
          data: {
            protocolType: 'python',
            createdAt: 'now',
            id: 'ProtocolId',
            metadata: {},
            analyses: {},
            files: [{ name: 'name', role: 'main' }],
          },
        },
      } as any)

    when(mockRerunningProtocolModal)
      .calledWith(
        componentPropsMatcher({
          onCloseClick: expect.anything(),
        })
      )
      .mockImplementation(({ onCloseClick }) => (
        <div onClick={onCloseClick}>Mock Rerunning Protocol Modal</div>
      ))

    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(0)
  })

  afterEach(() => {
    resetAllWhenMocks()
    jest.restoreAllMocks()
  })

  it('renders correct contents for empty state', () => {
    const { getByRole } = render(props)

    expect(getByRole('button', { name: 'Choose File...' })).toBeTruthy()
    expect(
      getByRole('button', { name: 'Drag and drop protocol file here' })
    ).toBeTruthy()
    expect(getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )
    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Library' })
    ).toBeTruthy()
    expect(
      getByRole('link', { name: 'Launch Opentrons Protocol Designer' })
    ).toBeTruthy()
  })

  it('opens file select on button click', () => {
    const { getByRole, getByTestId } = render(props)
    const button = getByRole('button', { name: 'Choose File...' })
    const input = getByTestId('file_input')
    input.click = jest.fn()
    fireEvent.click(button)
    expect(input.click).toHaveBeenCalled()
  })
  it('calls create session on choose file', () => {
    const { getByTestId } = render(props)
    const input = getByTestId('file_input')
    fireEvent.change(input, { target: { files: ['dummyFile'] } })
    expect(props.onUpload).toHaveBeenCalledWith('dummyFile')
  })
  it('renders empty state when no previous protocol was uploaded', () => {
    const { getByText, getByRole } = render(props)
    mockUseMostRecentRunId.mockReturnValue(null)
    getByText('Launch Opentrons Protocol Library')
    getByText('Launch Opentrons Protocol Designer')
    getByText('Drag and drop protocol file here')
    expect(getByRole('complementary')).toHaveTextContent(
      /Don't have a protocol yet\?/i
    )
  })
  it('renders the correct latest protocol uplaoded info', () => {
    when(mockGetLatestLabwareOffsetCount)
      .calledWith(mockOffsets)
      .mockReturnValue(1)
    const { getByText } = render(props)
    getByText('robotName’s last run')
    getByText('mock display name')
    getByText('Protocol name')
    getByText('Run timestamp')
    //  Had to use nestedTextMatcher to avoid testing for the changing timezones
    getByText(nestedTextMatcher('2021-11-12'))
    getByText(nestedTextMatcher(':39:19'))
    getByText('Labware Offset data')
    getByText('1 Labware Offsets')
    getByText('See How Rerunning a Protocol Works')
    getByText('Run again')
  })
  it('renders No Offset data', () => {
    when(mockUseRunQuery)
      .calledWith('RunId')
      .mockReturnValue({
        data: {
          data: {
            createdAt: '2021-11-12T19:39:19.668514+00:00',
            labwareOffsets: [],
          },
        },
      } as any)
    when(mockGetLatestLabwareOffsetCount).calledWith([]).mockReturnValue(0)
    const { getByText } = render(props)
    getByText('No Labware Offset data')
  })
  it('renders run again button', () => {
    const { getByRole } = render(props)
    mockUseCloneRun.mockReturnValue(jest.fn())
    const button = getByRole('button', { name: 'Run again' })
    expect(button).not.toBeDisabled()
    fireEvent.click(button)
  })
  it('renders correct link text', () => {
    const { getByRole } = render(props)
    getByRole('link', {
      name: 'See How Rerunning a Protocol Works',
    })
    expect(screen.queryByText('Mock Rerunning Protocol Modal')).toBeNull()
  })
  it('renders modal when link is clicked', () => {
    mockRerunningProtocolModal.mockReturnValue(
      <div>Mock Rerunning Protocol Modal</div>
    )
    const { getByText, getByRole } = render(props)
    const openModal = getByRole('link', {
      name: 'See How Rerunning a Protocol Works',
    })
    fireEvent.click(openModal)
    getByText('Mock Rerunning Protocol Modal')
  })
  it('renders null if run is null', () => {
    when(mockUseRunQuery)
      .calledWith('RunId')
      .mockReturnValue({
        data: null,
      } as any)

    const { queryByText } = render(props)
    expect(queryByText('Run Again')).toBeNull()
  })
  it('renders file name if Protocol name is null', () => {
    when(mockUseProtocolQuery)
      .calledWith('ProtocolId')
      .mockReturnValue({
        data: {
          data: {
            protocolType: 'python',
            createdAt: 'now',
            id: 'ProtocolId',
            metadata: {},
            analyses: {},
            files: [{ name: 'name', role: 'main' }],
          },
        },
      } as any)

    when(mockUseProtocolDetails)
      .calledWith()
      .mockReturnValue({
        protocolData: { displayName: null },
      } as any)
    const { getByText } = render(props)
    getByText('name')
  })
})
