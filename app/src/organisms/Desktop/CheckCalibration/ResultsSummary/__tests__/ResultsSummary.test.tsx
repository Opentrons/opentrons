import { vi, it, describe, expect, beforeEach } from 'vitest'
import { saveAs } from 'file-saver'
import { fireEvent, screen } from '@testing-library/react'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import * as Fixtures from '/app/redux/sessions/__fixtures__'
import * as Sessions from '/app/redux/sessions'
import { CalibrationHealthCheckResults } from '../CalibrationHealthCheckResults'
import { RenderMountInformation } from '../RenderMountInformation'
import { CalibrationResult } from '../CalibrationResult'

import { ResultsSummary } from '../'

import type { CalibrationPanelProps } from '/app/organisms/Desktop/CalibrationPanels/types'

// file-saver has circular dep, need to mock with factory to prevent error
vi.mock('file-saver', async importOriginal => {
  const actual = await importOriginal<typeof saveAs>()
  return {
    ...actual,
    saveAs: vi.fn(),
  }
})
vi.mock('/app/redux/sessions')
vi.mock('/app/redux/pipettes')
vi.mock('../CalibrationHealthCheckResults')
vi.mock('../RenderMountInformation')
vi.mock('../CalibrationResult')

const mockDeleteSession = vi.fn()
const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails

const mockIsMulti = false
const mockMount = 'left'
const mockSendCommands = vi.fn()

const render = (props: CalibrationPanelProps) => {
  return renderWithProviders(<ResultsSummary {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('ResultsSummary', () => {
  let props: CalibrationPanelProps

  beforeEach(() => {
    props = {
      isMulti: mockIsMulti,
      mount: mockMount,
      tipRack: Fixtures.mockDeckCalTipRack,
      calBlock: null,
      sendCommands: mockSendCommands,
      currentStep: Sessions.CHECK_STEP_RESULTS_SUMMARY,
      sessionType: Sessions.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
      cleanUpAndExit: mockDeleteSession,
      instruments: mockSessionDetails.instruments,
      comparisonsByPipette: mockSessionDetails.comparisonsByPipette,
      checkBothPipettes: true,
    }
    vi.mocked(CalibrationHealthCheckResults).mockReturnValue(
      <div>mock calibration health check results</div>
    )
    vi.mocked(RenderMountInformation).mockReturnValue(
      <div>mock render mount information</div>
    )
    vi.mocked(CalibrationResult).mockReturnValue(
      <div>mock calibration result</div>
    )
  })

  it('should render components', () => {
    render(props)
    screen.getByText('mock calibration health check results')
    expect(screen.getAllByText('mock render mount information').length).toBe(2)
    // deck + pipetteOffset x 2 + tipLength x 2
    expect(screen.getAllByText('mock calibration result').length).toBe(5)
  })

  it('saves the calibration report when clicking the button', () => {
    render(props)
    const button = screen.getByTestId('ResultsSummary_Download_Button')
    fireEvent.click(button)
    expect(vi.mocked(saveAs)).toHaveBeenCalled()
  })

  it('calls mock function when clicking finish', () => {
    render(props)
    const button = screen.getByRole('button', { name: 'Finish' })
    fireEvent.click(button)
    expect(mockDeleteSession).toHaveBeenCalled()
  })
})
