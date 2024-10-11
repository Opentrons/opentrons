import { when } from 'vitest-when'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect, afterEach } from 'vitest'

import {
  useInstrumentsQuery,
  useAllPipetteOffsetCalibrationsQuery,
} from '@opentrons/react-api-client'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import { useIsOEMMode } from '/app/resources/robot-settings/hooks'
import { mockRecentAnalysis } from '../__fixtures__'
import { ProtocolSetupInstruments } from '..'

vi.mock('@opentrons/react-api-client')
vi.mock('/app/resources/runs')
vi.mock('/app/resources/robot-settings/hooks')

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
const mockSetSetupScreen = vi.fn()
const mockCreateLiveCommand = vi.fn()

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
    when(vi.mocked(useAllPipetteOffsetCalibrationsQuery))
      .calledWith()
      .thenReturn({ data: { data: [] } } as any)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(mockRecentAnalysis)
    vi.mocked(useInstrumentsQuery).mockReturnValue({
      data: {
        data: [mockLeftPipetteData, mockRightPipetteData, mockGripperData],
      },
    } as any)
    vi.mocked(useIsOEMMode).mockReturnValue(false)
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders the Instruments Setup page', () => {
    render()
    screen.getByText('Instruments')
    screen.getByText('Location')
    screen.getByText('Calibration Status')
  })

  it('correctly navigates with the nav buttons', () => {
    render()
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(mockSetSetupScreen).toHaveBeenCalledWith('prepare to run')
  })
})
