// render components
// CalibrationHealthCheckResults
// DeckCalibrationResult
// RenderMoundInformation
// PipetteCalibrationResult
// TipLengthCalibrationResult
// FileDownload button
// Finish button

import * as React from 'react'
import { saveAs } from 'file-saver'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'

import { i18n } from '../../../../i18n'
import * as Fixtures from '../../../../redux/sessions/__fixtures__'
import * as Sessions from '../../../../redux/sessions'
import { CalibrationHealthCheckResults } from '../CalibrationHealthCheckResults'
import { DeckCalibrationResult } from '../DeckCalibrationResult'
import { RenderMountInformation } from '../RenderMountInformation'
import { PipetteCalibrationResult } from '../PipetteCalibrationResult'
import { TipLengthCalibrationResult } from '../TipLengthCalibrationResult'

import { ResultsSummary } from '../'

import type { CalibrationPanelProps } from '../../../../organisms/CalibrationPanels/types'

jest.mock('file-saver')
jest.mock('../../../../redux/sessions')
jest.mock('../../../../redux/pipettes')
jest.mock('../CalibrationHealthCheckResults')
jest.mock('../DeckCalibrationResult')
jest.mock('../RenderMountInformation')
jest.mock('../PipetteCalibrationResult')
jest.mock('../TipLengthCalibrationResult')

const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>
const mockDeleteSession = jest.fn()
const mockSessionDetails = Fixtures.mockRobotCalibrationCheckSessionDetails
const mockCalibrationHealthCheckResults = CalibrationHealthCheckResults as jest.MockedFunction<
  typeof CalibrationHealthCheckResults
>
const mockDeckCalibrationResult = DeckCalibrationResult as jest.MockedFunction<
  typeof DeckCalibrationResult
>
const mockRenderMountInformation = RenderMountInformation as jest.MockedFunction<
  typeof RenderMountInformation
>
const mockPipetteCalibrationResult = PipetteCalibrationResult as jest.MockedFunction<
  typeof PipetteCalibrationResult
>
const mockTipLengthCalibrationResult = TipLengthCalibrationResult as jest.MockedFunction<
  typeof TipLengthCalibrationResult
>

const mockIsMulti = false
const mockMount = 'left'
const mockSendCommands = jest.fn()

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
    mockCalibrationHealthCheckResults.mockReturnValue(
      <div>mock calibration health check results</div>
    )
    mockDeckCalibrationResult.mockReturnValue(
      <div>mock deck calibration result</div>
    )
    mockRenderMountInformation.mockReturnValue(
      <div>mock render mount information</div>
    )
    mockPipetteCalibrationResult.mockReturnValue(
      <div>mock pipette calibration result</div>
    )
    mockTipLengthCalibrationResult.mockReturnValue(
      <div>mock tip length calibration result</div>
    )
  })

  it('should render components', () => {
    const { getByText, getAllByText } = render(props)
    getByText('mock calibration health check results')
    getByText('mock deck calibration result')
    expect(getAllByText('mock render mount information').length).toBe(2)
    expect(getAllByText('mock pipette calibration result').length).toBe(2)
    expect(getAllByText('mock tip length calibration result').length).toBe(2)
  })

  it('saves the calibration report when clicking the button', () => {
    const { getByTestId } = render(props)
    const button = getByTestId('ResultsSummary_Download_Button')
    fireEvent.click(button)
    expect(mockSaveAs).toHaveBeenCalled()
  })

  it('calls mock function when clicking finish', () => {
    const { getByRole } = render(props)
    const button = getByRole('button', { name: 'Finish' })
    fireEvent.click(button)
    expect(mockDeleteSession).toHaveBeenCalled()
  })
})
