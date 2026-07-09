import { fireEvent, screen } from '@testing-library/react'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { when } from 'vitest-when'

import '@testing-library/jest-dom/vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { useDownloadCalibrationData } from '/app/organisms/Desktop/Devices/hooks'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'

import { CalibrationDataDownload } from '../CalibrationDataDownload'

vi.mock('/app/organisms/Desktop/Devices/hooks')
vi.mock('/app/resources/devices/hooks/useIsEstopNotDisengaged')

const mockDownloadCalibration = vi.fn()
const mockSetShowHowCalibrationWorksModal = vi.fn()
const ROBOT_NAME = 'otie'

const render = () => {
  return renderWithProviders(
    <CalibrationDataDownload
      robotName={ROBOT_NAME}
      setShowHowCalibrationWorksModal={mockSetShowHowCalibrationWorksModal}
    />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationDataDownload', () => {
  const realBlob = global.Blob

  beforeAll(() => {
    // @ts-expect-error(sa, 2021-6-28): not a valid blob interface
    global.Blob = function (content: any, options: any) {
      return { content, options }
    }
  })

  afterAll(() => {
    global.Blob = realBlob
  })

  beforeEach(() => {
    mockDownloadCalibration.mockClear()
    when(useDownloadCalibrationData).calledWith(ROBOT_NAME).thenReturn({
      downloadCalibration: mockDownloadCalibration,
    })
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(false)
  })

  it('renders title and About Calibration description', () => {
    render()
    screen.queryByText(
      `For the robot to move accurately and precisely, you need to calibrate it. Pipette and gripper calibration is an automated process that uses a calibration probe or pin.`
    )
    screen.queryByText(
      `After calibration is complete, you can save the calibration data to your computer as a JSON file.`
    )
  })

  it('calls downloadCalibration when download button is clicked', () => {
    render()
    const downloadButton = screen.getByText('Download calibration logs')
    fireEvent.click(downloadButton)
    expect(mockDownloadCalibration).toHaveBeenCalled()
  })

  it('renders a See how robot calibration works link', () => {
    render()
    const SUPPORT_LINK = 'https://support.opentrons.com'
    expect(
      screen
        .getByRole('link', {
          name: 'See how robot calibration works',
        })
        .getAttribute('href')
    ).toBe(SUPPORT_LINK)
  })

  it('renders disabled button when e-stop is pressed', () => {
    when(useIsEstopNotDisengaged).calledWith(ROBOT_NAME).thenReturn(true)
    render()
    const downloadButton = screen.getByRole('button', {
      name: 'Download calibration logs',
    })
    expect(downloadButton).toBeDisabled()
  })

  it('renders enabled button when e-stop is not pressed', () => {
    render()
    const downloadButton = screen.getByRole('button', {
      name: 'Download calibration logs',
    })
    expect(downloadButton).toBeEnabled()
  })
})
