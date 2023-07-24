import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { saveAs } from 'file-saver'
import { OT3_PIPETTES } from '@opentrons/shared-data'
import { renderWithProviders, Mount } from '@opentrons/components'
import {
  useDeleteCalibrationMutation,
  useAllPipetteOffsetCalibrationsQuery,
  useAllTipLengthCalibrationsQuery,
} from '@opentrons/react-api-client'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { PipetteWizardFlows } from '../../../PipetteWizardFlows'
import { useCalibratePipetteOffset } from '../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import {
  useDeckCalibrationData,
  useRunStatuses,
  useAttachedPipettesFromInstrumentsQuery,
} from '../../../../organisms/Devices/hooks'
import { mockAttachedPipetteInformation } from '../../../../redux/pipettes/__fixtures__'

import { OverflowMenu } from '../OverflowMenu'
import {
  mockPipetteOffsetCalibrationsResponse,
  mockTipLengthCalibrationResponse,
} from '../__fixtures__'

const render = (
  props: React.ComponentProps<typeof OverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'otie'
const CAL_TYPE = 'pipetteOffset'
const PIPETTE_NAME = 'pipetteName'
const OT3_PIPETTE_NAME = OT3_PIPETTES[0]

const startCalibration = jest.fn()
jest.mock('file-saver')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/discovery')
jest.mock('../../../../redux/robot-api/selectors')
jest.mock(
  '../../../../organisms/CalibratePipetteOffset/useCalibratePipetteOffset'
)
jest.mock('../../../../organisms/ProtocolUpload/hooks')
jest.mock('../../../../organisms/Devices/hooks')
jest.mock('../../../PipetteWizardFlows')

const mockPipetteWizardFlow = PipetteWizardFlows as jest.MockedFunction<
  typeof PipetteWizardFlows
>
const mockUseCalibratePipetteOffset = useCalibratePipetteOffset as jest.MockedFunction<
  typeof useCalibratePipetteOffset
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUseAllPipetteOffsetCalibrationsQuery = useAllPipetteOffsetCalibrationsQuery as jest.MockedFunction<
  typeof useAllPipetteOffsetCalibrationsQuery
>
const mockUseAllTipLengthCalibrationsQuery = useAllTipLengthCalibrationsQuery as jest.MockedFunction<
  typeof useAllTipLengthCalibrationsQuery
>
const mockUseRunStatuses = useRunStatuses as jest.MockedFunction<
  typeof useRunStatuses
>
const mockUseAttachedPipettesFromInstrumentsQuery = useAttachedPipettesFromInstrumentsQuery as jest.MockedFunction<
  typeof useAttachedPipettesFromInstrumentsQuery
>
const mockUseDeleteCalibrationMutation = useDeleteCalibrationMutation as jest.MockedFunction<
  typeof useDeleteCalibrationMutation
>

const RUN_STATUSES = {
  isRunRunning: false,
  isRunStill: false,
  isRunTerminal: false,
  isRunIdle: false,
}

const mockUpdateRobotStatus = jest.fn()

describe('OverflowMenu', () => {
  let props: React.ComponentProps<typeof OverflowMenu>
  const mockDeleteCalibration = jest.fn()

  beforeEach(() => {
    props = {
      calType: CAL_TYPE,
      robotName: ROBOT_NAME,
      mount: 'left' as Mount,
      serialNumber: 'serialNumber',
      updateRobotStatus: mockUpdateRobotStatus,
      pipetteName: PIPETTE_NAME,
      tiprackDefURI: 'mock/tiprack/uri',
    }
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: null,
      right: null,
    })
    mockUseCalibratePipetteOffset.mockReturnValue([startCalibration, null])
    mockUseRunStatuses.mockReturnValue(RUN_STATUSES)
    mockUseDeckCalibrationData.mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
    mockUseDeleteCalibrationMutation.mockReturnValue({
      deleteCalibration: mockDeleteCalibration,
    } as any)
    mockUseAllPipetteOffsetCalibrationsQuery.mockReturnValue({
      data: {
        data: [mockPipetteOffsetCalibrationsResponse],
      },
    } as any)
    mockUseAllTipLengthCalibrationsQuery.mockReturnValue({
      data: {
        data: [mockTipLengthCalibrationResponse],
      },
    } as any)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render Overflow menu buttons - pipette offset calibrations', () => {
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    getByText('Download calibration data')
    getByText('Delete calibration data')
  })

  it('download pipette offset calibrations data', async () => {
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const downloadButton = getByText('Download calibration data')
    fireEvent.click(downloadButton)
    expect(saveAs).toHaveBeenCalled()
  })

  it('should close the overflow menu when clicking it again', () => {
    const [{ getByLabelText, queryByText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    fireEvent.click(button)
    expect(queryByText('Download calibration data')).not.toBeInTheDocument()
  })

  it('should render Overflow menu buttons - tip length calibrations', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button_tipLength')
    fireEvent.click(button)
    getByText('Download calibration data')
    getByText('Delete calibration data')
  })

  it('call a function when clicking download tip length calibrations data', async () => {
    const [{ getByText, getByLabelText }] = render({
      ...props,
      calType: 'tipLength',
    })
    const button = getByLabelText('CalibrationOverflowMenu_button_tipLength')
    fireEvent.click(button)
    const downloadButton = getByText('Download calibration data')
    fireEvent.click(downloadButton)
    expect(saveAs).toHaveBeenCalled()
  })

  it('recalibration button should open up the pipette wizard flow for flex pipettes', () => {
    mockUseAttachedPipettesFromInstrumentsQuery.mockReturnValue({
      left: mockAttachedPipetteInformation,
      right: null,
    })
    mockPipetteWizardFlow.mockReturnValue(<div>mock pipette wizard flows</div>)
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = getByText('Recalibrate pipette')
    expect(
      screen.queryByText('Download calibration data')
    ).not.toBeInTheDocument()
    fireEvent.click(cal)
    getByText('mock pipette wizard flows')
  })

  it('calibration button should open up the pipette wizard flow for flex pipettes', () => {
    mockPipetteWizardFlow.mockReturnValue(<div>mock pipette wizard flows</div>)
    mockUseAllPipetteOffsetCalibrationsQuery.mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    props = {
      ...props,
      pipetteName: OT3_PIPETTE_NAME,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const cal = getByText('Calibrate pipette')
    fireEvent.click(cal)
    getByText('mock pipette wizard flows')
  })

  it('deletes calibration data when delete button is clicked - pipette offset', () => {
    const expectedCallParams = {
      calType: CAL_TYPE,
      mount: 'left',
      pipette_id: mockPipetteOffsetCalibrationsResponse.pipette,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const deleteBtn = getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledWith(expectedCallParams)
  })

  it('deletes calibration data when delete button is clicked - tip length', () => {
    props = {
      ...props,
      calType: 'tipLength',
      tiprackDefURI: mockTipLengthCalibrationResponse.uri,
    }
    const expectedCallParams = {
      calType: 'tipLength',
      tiprack_hash: mockTipLengthCalibrationResponse.tiprack,
      pipette_id: mockTipLengthCalibrationResponse.pipette,
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button_tipLength')
    fireEvent.click(button)
    const deleteBtn = getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledWith(expectedCallParams)
  })

  it('does nothing when delete is clicked and there is no matching calibration data to delete - pipette offset', () => {
    mockUseAllPipetteOffsetCalibrationsQuery.mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText(
      'CalibrationOverflowMenu_button_pipetteOffset'
    )
    fireEvent.click(button)
    const deleteBtn = getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledTimes(0)
  })

  it('does nothing when delete is clicked and there is no matching calibration data to delete - tip length', () => {
    mockUseAllTipLengthCalibrationsQuery.mockReturnValue({
      data: {
        data: [],
      },
    } as any)
    props = {
      ...props,
      calType: 'tipLength',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button_tipLength')
    fireEvent.click(button)
    const deleteBtn = getByText('Delete calibration data')
    fireEvent.click(deleteBtn)
    expect(mockDeleteCalibration).toHaveBeenCalledTimes(0)
  })
})
