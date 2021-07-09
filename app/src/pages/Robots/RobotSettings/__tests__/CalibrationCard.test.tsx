import * as React from 'react'
import { mountWithProviders } from '@opentrons/components/__utils__'
import { saveAs } from 'file-saver'

import { i18n } from '../../../../i18n'
import * as PipetteOffset from '../../../../redux/calibration/pipette-offset'
import * as TipLength from '../../../../redux/calibration/tip-length'
import * as Calibration from '../../../../redux/calibration'
import * as Pipettes from '../../../../redux/pipettes'
import * as Config from '../../../../redux/config'
import * as RobotSelectors from '../../../../redux/robot/selectors'

import { CalibrationCard } from '../CalibrationCard'
import { CheckCalibrationControl } from '../CheckCalibrationControl'
import { PipetteOffsets } from '../PipetteOffsets'
import { mockAttachedPipette } from '../../../../redux/pipettes/__fixtures__'
import { mockPipetteOffsetCalibration1 } from '../../../../redux/calibration/pipette-offset/__fixtures__'
import { mockTipLengthCalibration1 } from '../../../../redux/calibration/tip-length/__fixtures__'

import { CONNECTABLE, UNREACHABLE } from '../../../../redux/discovery'

import type { State, Action } from '../../../../redux/types'
import type { ViewableRobot } from '../../../../redux/discovery/types'
import type { HTMLAttributes, ReactWrapper } from 'enzyme'
import type {
  AttachedPipettesByMount,
  PipetteCalibrationsByMount,
} from '../../../../redux/pipettes/types'

const mockCallTrackEvent = jest.fn()

jest.mock('react-router-dom', () => ({ Link: 'a' }))
jest.mock('file-saver')

jest.mock('../../../../redux/robot/selectors')
jest.mock('../../../../redux/config/selectors')
jest.mock('../../../../redux/pipettes/selectors')
jest.mock('../../../../redux/calibration/selectors')
jest.mock('../../../../redux/calibration/tip-length/selectors')
jest.mock('../../../../redux/calibration/pipette-offset/selectors')
jest.mock('../../../../redux/sessions/selectors')
jest.mock('../../../../redux/analytics', () => ({
  useTrackEvent: () => mockCallTrackEvent,
}))

jest.mock('../CheckCalibrationControl', () => ({
  CheckCalibrationControl: () => <></>,
}))

jest.mock('../PipetteOffsets', () => ({
  PipetteOffsets: () => <></>,
}))

const MOCK_STATE: State = { mockState: true } as any

const mockGetIsRunning = RobotSelectors.getIsRunning as jest.MockedFunction<
  typeof RobotSelectors.getIsRunning
>

const mockUnconnectableRobot: ViewableRobot = {
  name: 'robot-name',
  connected: true,
  status: UNREACHABLE,
} as any

const mockRobot: ViewableRobot = {
  name: 'robot-name',
  connected: true,
  status: CONNECTABLE,
} as any

const mockAttachedPipettes: AttachedPipettesByMount = {
  left: mockAttachedPipette,
  right: null,
} as any

const mockAttachedPipetteCalibrations: PipetteCalibrationsByMount = {
  left: {
    offset: mockPipetteOffsetCalibration1,
    tipLength: mockTipLengthCalibration1,
  },
  right: {
    offset: null,
    tipLength: null,
  },
} as any

const getAttachedPipettes = Pipettes.getAttachedPipettes as jest.MockedFunction<
  typeof Pipettes.getAttachedPipettes
>

const getAttachedPipetteCalibrations = Pipettes.getAttachedPipetteCalibrations as jest.MockedFunction<
  typeof Pipettes.getAttachedPipetteCalibrations
>

const getFeatureFlags = Config.getFeatureFlags as jest.MockedFunction<
  typeof Config.getFeatureFlags
>

const getDeckCalibrationStatus = Calibration.getDeckCalibrationStatus as jest.MockedFunction<
  typeof Calibration.getDeckCalibrationStatus
>

const getDeckCalButton = (
  wrapper: ReactWrapper<React.ComponentProps<typeof CalibrationCard>>
): ReactWrapper => wrapper.find('DeckCalibrationControl').find('button')

const getCheckCalibrationControl = (
  wrapper: ReactWrapper<React.ComponentProps<typeof CalibrationCard>>
): ReactWrapper => wrapper.find('CheckCalibrationControl')

const getDownloadButton = (
  wrapper: ReactWrapper<React.ComponentProps<typeof CalibrationCard>>
): ReactWrapper<HTMLAttributes> =>
  wrapper.find('a').filter({ children: 'Download your calibration data' })

describe('CalibrationCard', () => {
  const render = (robot: ViewableRobot = mockRobot) => {
    return mountWithProviders<
      React.ComponentProps<typeof CalibrationCard>,
      State,
      Action
    >(<CalibrationCard robot={robot} pipettesPageUrl={'fake-url'} />, {
      initialState: MOCK_STATE,
      i18n,
    })
  }

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
    jest.useFakeTimers()
    getDeckCalibrationStatus.mockReturnValue(Calibration.DECK_CAL_STATUS_OK)
    getFeatureFlags.mockReturnValue({
      allPipetteConfig: false,
      enableBundleUpload: false,
    })
    getAttachedPipettes.mockReturnValue(mockAttachedPipettes)
    getAttachedPipetteCalibrations.mockReturnValue(
      mockAttachedPipetteCalibrations
    )
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.resetAllMocks()
    jest.useRealTimers()
  })

  it('calls fetches data on mount and on a 10s interval', () => {
    const { store } = render()

    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Pipettes.fetchPipettes(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      3,
      PipetteOffset.fetchPipetteOffsetCalibrations(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      4,
      TipLength.fetchTipLengthCalibrations(mockRobot.name)
    )
    store.dispatch.mockReset()
    jest.advanceTimersByTime(20000)
    expect(store.dispatch).toHaveBeenCalledTimes(2)
    expect(store.dispatch).toHaveBeenNthCalledWith(
      1,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
    expect(store.dispatch).toHaveBeenNthCalledWith(
      2,
      Calibration.fetchCalibrationStatus(mockRobot.name)
    )
  })

  it('DC and check cal buttons enabled if connected and not running and with pipette attached', () => {
    mockGetIsRunning.mockReturnValue(false)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(null)
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      null
    )
  })

  it('DC buttons disabled and check cal not renderedif no pipette attached', () => {
    getAttachedPipettes.mockReturnValue({ left: null, right: null })
    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Attach a pipette to proceed'
    )
    expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
  })

  it('DC and check cal buttons disabled if not connectable', () => {
    const { wrapper } = render(mockUnconnectableRobot)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Cannot connect to robot'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Cannot connect to robot'
    )
  })

  it('DC and check cal buttons disabled if not connected', () => {
    const mockRobotNotConnected: ViewableRobot = {
      name: 'robot-name',
      connected: false,
      status: CONNECTABLE,
    } as any

    const { wrapper } = render(mockRobotNotConnected)

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Connect to robot to control'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Connect to robot to control'
    )
  })

  it('DC and check cal buttons disabled if protocol running', () => {
    mockGetIsRunning.mockReturnValue(true)

    const { wrapper } = render()

    expect(getDeckCalButton(wrapper).prop('disabled')).toBe(
      'Protocol is running'
    )
    expect(getCheckCalibrationControl(wrapper).prop('disabledReason')).toBe(
      'Protocol is running'
    )
  })

  const cals = [
    Calibration.DECK_CAL_STATUS_SINGULARITY,
    Calibration.DECK_CAL_STATUS_IDENTITY,
    Calibration.DECK_CAL_STATUS_BAD_CALIBRATION,
  ]
  cals.forEach(status => {
    it(`check calibration does not render if deck calibration is ${status}`, () => {
      getDeckCalibrationStatus.mockImplementation((state, rName) => {
        expect(state).toEqual(MOCK_STATE)
        expect(rName).toEqual(mockRobot.name)
        return status
      })
      const { wrapper } = render()

      expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
    })
  })

  it('check calibration does not render if pipette calibration is missing', () => {
    getAttachedPipetteCalibrations.mockReturnValue({
      left: { offset: null, tipLength: null },
      right: { offset: null, tipLength: null },
    })
    const { wrapper } = render()

    expect(wrapper.exists(CheckCalibrationControl)).toBe(false)
  })

  it('renders PipetteOffsets', () => {
    const { wrapper } = render()
    expect(wrapper.exists(PipetteOffsets)).toBe(true)
  })

  it('lets you click download to download', () => {
    const { wrapper } = render()

    getDownloadButton(wrapper).invoke('onClick')?.({
      preventDefault: () => {},
    } as any)
    expect(saveAs).toHaveBeenCalled()
    expect(mockCallTrackEvent).toHaveBeenCalledWith({
      name: 'calibrationDataDownloaded',
      properties: {},
    })
  })
})
