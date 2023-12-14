import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { i18n } from '../../../i18n'
import { CalibrationTaskList } from '..'
import {
  mockDeckCalLauncher,
  mockTipLengthCalLauncher,
  mockPipOffsetCalLauncher,
  expectedBadDeckAndPipetteOffsetTaskList,
  expectedBadEverythingTaskList,
  expectedBadTipLengthAndOffsetTaskList,
  expectedTaskList,
  expectedIncompleteDeckCalTaskList,
  expectedIncompleteRightMountTaskList,
  expectedIncompleteLeftMountTaskList,
} from '../../Devices/hooks/__fixtures__/taskListFixtures'
import {
  useCalibrationTaskList,
  useRunHasStarted,
  useAttachedPipettes,
} from '../../Devices/hooks'
import { mockLeftProtoPipette } from '../../../redux/pipettes/__fixtures__'
import { fireEvent } from '@testing-library/react'

jest.mock('../../Devices/hooks')
jest.mock('../../ProtocolUpload/hooks')

const mockUseCalibrationTaskList = useCalibrationTaskList as jest.MockedFunction<
  typeof useCalibrationTaskList
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseAttachedPipettes = useAttachedPipettes as jest.MockedFunction<
  typeof useAttachedPipettes
>

const render = (robotName: string = 'otie') => {
  return renderWithProviders(
    <StaticRouter>
      <CalibrationTaskList
        robotName={robotName}
        pipOffsetCalLauncher={mockPipOffsetCalLauncher}
        tipLengthCalLauncher={mockTipLengthCalLauncher}
        deckCalLauncher={mockDeckCalLauncher}
        exitBeforeDeckConfigCompletion={false}
      />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('CalibrationTaskList', () => {
  beforeEach(() => {
    mockUseCalibrationTaskList.mockReturnValue(expectedTaskList)
    mockUseRunHasStarted.mockReturnValue(false)
    mockUseAttachedPipettes.mockReturnValue({
      left: mockLeftProtoPipette,
      right: null,
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  it('renders the Calibration Task List', () => {
    const [{ getByText }] = render()
    getByText('Deck Calibration')
    getByText('Left Mount')
    getByText('Right Mount')
  })

  it('does not show the Calibrations complete screen when viewing a completed task list', () => {
    const [{ queryByText }] = render()
    expect(queryByText('Calibrations complete!')).toBeFalsy()
  })

  it('shows the Calibrations complete screen after the calibrations are completed', () => {
    // initial render has incomplete calibrations, the rerender will use the completed calibrations mock response
    // this triggers the useEffect that causes the Calibrations complete screen to render
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteDeckCalTaskList
    )
    const [{ getByText, rerender }] = render()
    expect(getByText('Calibrate')).toBeTruthy()
    // Complete screen will only render if a wizard has been launched
    fireEvent.click(getByText('Calibrate'))
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('renders the Calibration Task List properly when both tip length and offset are bad', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedBadTipLengthAndOffsetTaskList
    )
    const [{ getAllByText, getByRole, getByText, rerender }] = render()
    getByText('Deck Calibration')
    expect(getByText('Recalibrate')).toBeTruthy()
    getByText('Left Mount')
    expect(getAllByText('Calibration recommended')).toHaveLength(3)
    expect(getByRole('button', { name: 'Calibrate' })).toBeTruthy()
    getByText('Right Mount')
    fireEvent.click(getByText('Calibrate'))
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('renders the Calibration Task List properly when both deck and offset are bad', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedBadDeckAndPipetteOffsetTaskList
    )
    const [{ getAllByText, getByRole, getByText, rerender }] = render()
    getByText('Deck Calibration')
    expect(getAllByText('Calibration recommended')).toHaveLength(2)
    expect(getByRole('button', { name: 'Calibrate' })).toBeTruthy()
    getByText('Left Mount')
    getByText('Right Mount')
    fireEvent.click(getByText('Calibrate'))
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('renders the Calibration Task List properly when everything is bad', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedBadEverythingTaskList
    )
    const [{ getAllByText, getByRole, getByText, rerender }] = render()
    getByText('Deck Calibration')
    expect(getAllByText('Calibration recommended')).toHaveLength(2)
    expect(getByRole('button', { name: 'Calibrate' })).toBeTruthy()
    getByText('Left Mount')
    getByText('Right Mount')
    fireEvent.click(getByText('Calibrate'))
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('launching a recalibrate wizard from a subtask will allow the calibration complete screen to show', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteRightMountTaskList
    )

    const [{ getAllByText, getByText, rerender }] = render()
    fireEvent.click(getByText('Left Mount'))
    const recalibrateLinks = getAllByText('Recalibrate') // this includes the deck and Left Mount subtasks CTAs
    expect(recalibrateLinks).toHaveLength(3)
    fireEvent.click(recalibrateLinks[2])
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('launching a recalibrate wizard from a task will allow the calibration complete screen to show', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteRightMountTaskList
    )

    const [{ getAllByText, getByText, rerender }] = render()
    fireEvent.click(getByText('Left Mount'))
    const recalibrateLinks = getAllByText('Recalibrate')
    expect(recalibrateLinks).toHaveLength(3)
    fireEvent.click(recalibrateLinks[0])
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    expect(getByText('Calibrations complete!')).toBeTruthy()
  })

  it('exiting a recalibrate wizard from a task will allow the current calibrations screen to show', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteRightMountTaskList
    )

    const [{ getByText, rerender }] = render()
    const recalibrateLink = getByText('Recalibrate')
    fireEvent.click(recalibrateLink)
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={true}
        />
      </StaticRouter>
    )
    expect(getByText('Using current calibrations.')).toBeTruthy()
  })

  it('prevents the user from launching calibrations or recalibrations from a task when a protocol run is active', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteDeckCalTaskList
    )
    mockUseRunHasStarted.mockReturnValue(true)

    const [{ getAllByText, rerender }] = render()
    const calibrateButtons = getAllByText('Calibrate')
    expect(calibrateButtons).toHaveLength(1) // only deck's calibration button should be shown
    fireEvent.click(calibrateButtons[0])
    expect(mockDeckCalLauncher).not.toHaveBeenCalled()
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    const recalibrateLinks = getAllByText('Recalibrate')
    expect(recalibrateLinks).toHaveLength(1) // only deck's recalibration link should be shown
    fireEvent.click(recalibrateLinks[0])
    expect(mockDeckCalLauncher).not.toHaveBeenCalled()
  })

  it('prevents the user from launching calibrations or recalibrations from a subtask when a protocol run is active', () => {
    mockUseCalibrationTaskList.mockReturnValueOnce(
      expectedIncompleteLeftMountTaskList
    )
    mockUseRunHasStarted.mockReturnValue(true)

    const [{ getAllByText, getByText, rerender }] = render()
    const calibrateButtons = getAllByText('Calibrate')
    expect(calibrateButtons).toHaveLength(1) // only the left mounts tip length button should show
    fireEvent.click(calibrateButtons[0])
    expect(mockTipLengthCalLauncher).not.toHaveBeenCalled()
    rerender(
      <StaticRouter>
        <CalibrationTaskList
          robotName={'otie'}
          pipOffsetCalLauncher={mockPipOffsetCalLauncher}
          tipLengthCalLauncher={mockTipLengthCalLauncher}
          deckCalLauncher={mockDeckCalLauncher}
          exitBeforeDeckConfigCompletion={false}
        />
      </StaticRouter>
    )
    fireEvent.click(getByText('Left Mount'))
    const recalibrateLinks = getAllByText('Recalibrate')
    expect(recalibrateLinks).toHaveLength(3) // deck and left mounts links are showing
    fireEvent.click(recalibrateLinks[1])
    expect(mockTipLengthCalLauncher).not.toHaveBeenCalled()
  })
})
