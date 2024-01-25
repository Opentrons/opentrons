import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'

import {
  useInstrumentsQuery,
  useAllPipetteOffsetCalibrationsQuery,
} from '@opentrons/react-api-client'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { mockRecentAnalysis } from '../__fixtures__'
import { ProtocolSetupInstruments } from '..'

jest.mock('@opentrons/react-api-client')
jest.mock(
  '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
)

const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>
const mockUseInstrumentsQuery = useInstrumentsQuery as jest.MockedFunction<
  typeof useInstrumentsQuery
>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>

const mockGripperData = {
  instrumentModel: 'gripper_v1',
  instrumentType: 'gripper',
  mount: 'extension',
  serialNumber: 'ghi789',
}
const mockRightPipetteData = {
  instrumentModel: 'p300_single_v2',
  instrumentType: 'p300',
  mount: 'right',
  serialNumber: 'abc123',
}
const mockLeftPipetteData = {
  instrumentModel: 'p1000_single_v2',
  instrumentType: 'p1000',
  mount: 'left',
  serialNumber: 'def456',
}

const RUN_ID = "otie's run"
const mockSetSetupScreen = jest.fn()
const mockCreateLiveCommand = jest.fn()

const render = () => {
  return renderWithProviders(
    <MemoryRouter>
      <ProtocolSetupInstruments
        runId={RUN_ID}
        setSetupScreen={mockSetSetupScreen}
      />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ProtocolSetupInstruments', () => {
  beforeEach(() => {
    mockCreateLiveCommand.mockResolvedValue(null)
    when(mockUseAllPipetteOffsetCalibrationsQuery)
      .calledWith()
      .mockReturnValue({ data: { data: [] } } as any)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(mockRecentAnalysis)
    mockUseInstrumentsQuery.mockReturnValue({
      data: {
        data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
      },
    } as any)
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders the Instruments Setup page', () => {
    const [{ getByText }] = render()
    getByText('Instruments')
    getByText('Location')
    getByText('Calibration Status')
  })

  it('correctly navigates with the nav buttons', () => {
    const [{ getAllByRole }] = render()
    fireEvent.click(getAllByRole('button')[0])
    expect(mockSetSetupScreen).toHaveBeenCalledWith('prepare to run')
  })
})
