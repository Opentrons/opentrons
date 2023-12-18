import * as React from 'react'
import { when } from 'jest-when'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UpdateBanner } from '..'
import { useIsFlex } from '../../../organisms/Devices/hooks'

jest.mock('../../../organisms/Devices/hooks')
const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>

const render = (props: React.ComponentProps<typeof UpdateBanner>) => {
  return renderWithProviders(<UpdateBanner {...props} />, {
    i18nInstance: i18n,
    initialState: { robotsByName: 'test' },
  })[0]
}

describe('Module Update Banner', () => {
  let props: React.ComponentProps<typeof UpdateBanner>

  beforeEach(() => {
    props = {
      robotName: 'testRobot',
      updateType: 'calibration',
      setShowBanner: jest.fn(),
      handleUpdateClick: jest.fn(),
      serialNumber: 'test_number',
      isTooHot: false,
    }
    when(mockUseIsFlex).calledWith(props.robotName).mockReturnValue(true)
  })
  it('enables the updateType and serialNumber to be used as the test ID', () => {
    const { getByTestId } = render(props)
    getByTestId('ModuleCard_calibration_update_banner_test_number')
  })
  it('renders an error banner if calibration is required with no exit button', () => {
    const { getByLabelText, queryByLabelText } = render(props)

    getByLabelText('icon_error')
    expect(queryByLabelText('close_icon')).not.toBeInTheDocument()
  })
  it('renders an error banner if a mandatory firmware update is required with no exit button', () => {
    props = {
      ...props,
      updateType: 'firmware_important',
    }
    const { getByLabelText, queryByLabelText } = render(props)

    getByLabelText('icon_error')
    expect(queryByLabelText('close_icon')).not.toBeInTheDocument()
  })
  it('renders a warning banner if an optional firmware update is needed with an exit button that dismisses the banner', () => {
    props = {
      ...props,
      updateType: 'firmware',
    }
    const { getByLabelText, queryByLabelText } = render(props)
    getByLabelText('icon_warning')
    expect(queryByLabelText('close_icon')).toBeInTheDocument()
    const btn = getByLabelText('close_icon')
    fireEvent.click(btn)
    expect(props.setShowBanner).toHaveBeenCalled()
  })
  it('enables clicking of text to open the appropriate update modal', () => {
    const { getByText } = render(props)
    const calibrateBtn = getByText('Calibrate now')
    fireEvent.click(calibrateBtn)
    expect(props.handleUpdateClick).toHaveBeenCalled()

    props = {
      ...props,
      updateType: 'firmware',
    }
    render(props)
    const firmwareBtn = getByText('Update now')
    fireEvent.click(firmwareBtn)
    expect(props.handleUpdateClick).toHaveBeenCalledTimes(2)
  })
  it('should not render a calibrate link if pipette attachment is required', () => {
    props = {
      ...props,
      attachPipetteRequired: true,
    }
    const { queryByText } = render(props)
    expect(queryByText('Calibrate now')).not.toBeInTheDocument()
  })
  it('should not render a calibrate link if pipette calibration is required', () => {
    props = {
      ...props,
      calibratePipetteRequired: true,
    }
    const { queryByText } = render(props)
    expect(queryByText('Calibrate now')).not.toBeInTheDocument()
  })
  it('should not render a calibrate link if pipette firmware update is required', () => {
    props = {
      ...props,
      updatePipetteFWRequired: true,
    }
    const { queryByText } = render(props)
    expect(queryByText('Calibrate now')).not.toBeInTheDocument()
  })
  it('should render a firmware update link if pipette calibration or firmware update is required', () => {
    props = {
      ...props,
      updateType: 'firmware',
      attachPipetteRequired: true,
      calibratePipetteRequired: true,
      updatePipetteFWRequired: true,
    }
    const { queryByText } = render(props)
    expect(queryByText('Update now')).toBeInTheDocument()
  })
  it('should not render a calibrate update link if the robot is an OT-2', () => {
    when(mockUseIsFlex).calledWith(props.robotName).mockReturnValue(false)
    const { queryByText } = render(props)
    expect(queryByText('Calibrate now')).not.toBeInTheDocument()
  })
})
