import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { saveAs } from 'file-saver'

import { renderWithProviders, Mount } from '@opentrons/components'

import { i18n } from '../../../../../i18n'
import { mockDeckCalData } from '../../../../../redux/calibration/__fixtures__'
import { useCalibratePipetteOffset } from '../../../../CalibratePipetteOffset/useCalibratePipetteOffset'
import { useDeckCalibrationData, useIsRobotBusy } from '../../../hooks'

import { OverflowMenu } from '../OverflowMenu'

const render = (
  props: React.ComponentProps<typeof OverflowMenu>
): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<OverflowMenu {...props} />, {
    i18nInstance: i18n,
  })
}

const ROBOT_NAME = 'otie'
const CAL_TYPE = 'pipetteOffset'

const startCalibration = jest.fn()
jest.mock('file-saver')
jest.mock('@opentrons/react-api-client')
jest.mock('../../../../../redux/config')
jest.mock('../../../../../redux/sessions/selectors')
jest.mock('../../../../../redux/discovery')
jest.mock('../../../../../redux/robot-api/selectors')
jest.mock('../../../../CalibratePipetteOffset/useCalibratePipetteOffset')
jest.mock('../../../../ProtocolUpload/hooks')
jest.mock('../../../hooks')

const mockUseCalibratePipetteOffset = useCalibratePipetteOffset as jest.MockedFunction<
  typeof useCalibratePipetteOffset
>
const mockUseIsRobotBusy = useIsRobotBusy as jest.MockedFunction<
  typeof useIsRobotBusy
>
const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>

const mockUpdateRobotStatus = jest.fn()

describe('OverflowMenu', () => {
  let props: React.ComponentProps<typeof OverflowMenu>

  beforeEach(() => {
    props = {
      calType: CAL_TYPE,
      robotName: ROBOT_NAME,
      mount: 'left' as Mount,
      serialNumber: 'serialNumber',
      updateRobotStatus: mockUpdateRobotStatus,
    }
    mockUseCalibratePipetteOffset.mockReturnValue([startCalibration, null])
    mockUseIsRobotBusy.mockReturnValue(false)
    mockUseDeckCalibrationData.mockReturnValue({
      isDeckCalibrated: true,
      deckCalibrationData: mockDeckCalData,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should render Overflow menu buttons - pipette offset calibrations', () => {
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    getByText('Calibrate Pipette Offset')
    getByText('Download calibration data')
  })

  it('download pipette offset calibrations data', async () => {
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const downloadButton = getByText('Download calibration data')
    fireEvent.click(downloadButton)
    expect(saveAs).toHaveBeenCalled()
  })

  it('should call pipette offset calibration when clicking calibrate button', () => {
    const startCalibration = jest.fn()
    mockUseCalibratePipetteOffset.mockReturnValue([startCalibration, null])
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const calibrationButton = getByText('Calibrate Pipette Offset')
    fireEvent.click(calibrationButton)
    expect(startCalibration).toHaveBeenCalled()
  })

  it('should close the overflow menu when clicking it again', () => {
    const [{ getByLabelText, queryByText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    fireEvent.click(button)
    expect(queryByText('Recalibrate Pipette Offset')).not.toBeInTheDocument()
    expect(queryByText('Download calibration data')).not.toBeInTheDocument()
  })

  it('should render Overflow menu buttons - tip length calibrations', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    getByText('Recalibrate Tip Length and Pipette Offset')
    getByText('Download calibration data')
  })

  it('should disable calibrate menu item when mount is undefined', () => {
    props = {
      ...props,
      mount: undefined,
    }
    const [{ getByRole }] = render(props)
    const button = getByRole('button', {
      name: 'CalibrationOverflowMenu_button',
    })
    fireEvent.click(button)
    const menuItem = getByRole('button', { name: 'Calibrate Pipette Offset' })
    expect(menuItem).toBeDisabled()
  })

  it('call a function when clicking download tip length calibrations data', async () => {
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const downloadButton = getByText('Download calibration data')
    fireEvent.click(downloadButton)
    expect(saveAs).toHaveBeenCalled()
  })

  it('should call pipette offset calibration and tip length calibration when clicking calibrate button', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const calibrationButton = getByText(
      'Recalibrate Tip Length and Pipette Offset'
    )
    fireEvent.click(calibrationButton)
    expect(startCalibration).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy - pipette offset', () => {
    mockUseIsRobotBusy.mockReturnValue(true)
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const calibrationButton = getByText('Calibrate Pipette Offset')
    fireEvent.click(calibrationButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })

  it('should call update robot status if a robot is busy - tip length', () => {
    props = {
      ...props,
      calType: 'tipLength',
    }
    mockUseIsRobotBusy.mockReturnValue(true)
    const [{ getByText, getByLabelText }] = render(props)
    const button = getByLabelText('CalibrationOverflowMenu_button')
    fireEvent.click(button)
    const calibrationButton = getByText(
      'Recalibrate Tip Length and Pipette Offset'
    )
    fireEvent.click(calibrationButton)
    expect(mockUpdateRobotStatus).toHaveBeenCalled()
  })
})
