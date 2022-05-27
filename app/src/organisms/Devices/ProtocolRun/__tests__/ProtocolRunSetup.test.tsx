import * as React from 'react'
import { pick } from 'lodash'
import { when, resetAllWhenMocks } from 'jest-when'

import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'

import { i18n } from '../../../../i18n'
import { mockDeckCalData } from '../../../../redux/calibration/__fixtures__'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import {
  useDeckCalibrationData,
  useProtocolDetailsForRun,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
} from '../../hooks'
import { SetupLabware } from '../SetupLabware'
import { SetupRobotCalibration } from '../SetupRobotCalibration'
import { ProtocolRunSetup } from '../ProtocolRunSetup'
import { SetupModules } from '../SetupModules'

import type { ProtocolAnalysisFile } from '@opentrons/shared-data'

jest.mock('../../hooks')
jest.mock('../SetupLabware')
jest.mock('../SetupRobotCalibration')
jest.mock('../SetupModules')

const mockUseDeckCalibrationData = useDeckCalibrationData as jest.MockedFunction<
  typeof useDeckCalibrationData
>
const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockSetupLabware = SetupLabware as jest.MockedFunction<
  typeof SetupLabware
>
const mockSetupRobotCalibration = SetupRobotCalibration as jest.MockedFunction<
  typeof SetupRobotCalibration
>
const mockSetupModules = SetupModules as jest.MockedFunction<
  typeof SetupModules
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'

const render = () => {
  return renderWithProviders(
    <ProtocolRunSetup
      protocolRunHeaderRef={null}
      robotName={ROBOT_NAME}
      runId={RUN_ID}
    />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('ProtocolRunSetup', () => {
  beforeEach(() => {
    when(mockUseDeckCalibrationData).calledWith(ROBOT_NAME).mockReturnValue({
      deckCalibrationData: mockDeckCalData,
      isDeckCalibrated: true,
    })
    when(mockUseProtocolDetailsForRun)
      .calledWith(RUN_ID)
      .mockReturnValue({
        protocolData: (noModulesProtocol as unknown) as ProtocolAnalysisFile,
        displayName: 'mock display name',
        protocolKey: 'fakeProtocolKey',
      })
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockConnectedRobot)
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: true })
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    when(mockSetupRobotCalibration)
      .calledWith(
        partialComponentPropsMatcher({
          robotName: ROBOT_NAME,
          runId: RUN_ID,
        })
      )
      .mockReturnValue(<span>Mock SetupRobotCalibration</span>)
    when(mockSetupLabware)
      .calledWith(
        partialComponentPropsMatcher({
          protocolRunHeaderRef: null,
          robotName: ROBOT_NAME,
          runId: RUN_ID,
        })
      )
      .mockReturnValue(<span>Mock SetupLabware</span>)
    when(mockSetupModules).mockReturnValue(<div>Mock SetupModules</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders null if robot is null', () => {
    when(mockUseRobot).calledWith(ROBOT_NAME).mockReturnValue(null)
    const { container } = render()
    expect(container.firstChild).toBeNull()
  })

  it('renders loading data message if robot-analyzed protocol data is null', () => {
    when(mockUseProtocolDetailsForRun).calledWith(RUN_ID).mockReturnValue({
      protocolData: null,
      displayName: null,
      protocolKey: null,
    })
    const { getByText } = render()
    getByText('Loading data...')
  })

  it('renders calibration ready when robot calibration complete', () => {
    const { getByText } = render()
    getByText('Calibration ready')
  })

  it('renders calibration needed when robot calibration not complete', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: false })
    const { getByText } = render()
    getByText('Calibration needed')
  })

  it('does not render calibration status when run has started', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    const { queryByText } = render()
    expect(queryByText('Calibration needed')).toBeNull()
    expect(queryByText('Calibration ready')).toBeNull()
  })

  describe('when no modules are in the protocol', () => {
    it('renders robot calibration setup', () => {
      const { getByText } = render()

      getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      const robotCalibrationSetup = getByText('Robot Calibration')
      robotCalibrationSetup.click()
      expect(getByText('Mock SetupRobotCalibration')).toBeVisible()
    })
    it('renders labware setup', () => {
      const { getByText } = render()

      getByText(
        'Position full tip racks and labware in the deck slots as shown in the deck map.'
      )
      const labwareSetup = getByText('Labware Setup')
      labwareSetup.click()
      expect(getByText('Mock SetupLabware')).toBeVisible()
    })
    it('does NOT render module setup', () => {
      const { queryByText } = render()
      expect(queryByText(/module setup/i)).toBeNull()
    })

    it('defaults to no step expanded', () => {
      const { getByText } = render()
      expect(getByText('Mock SetupLabware')).not.toBeVisible()
    })

    it('renders view-only info message if run has started', async () => {
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)

      const { getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(getByText('Mock SetupLabware')).not.toBeVisible()
      getByText('Setup is view-only once run has started')
    })
  })

  describe('when modules are in the protocol', () => {
    beforeEach(() => {
      when(mockUseProtocolDetailsForRun)
        .calledWith(RUN_ID)
        .mockReturnValue({
          protocolData: (withModulesProtocol as unknown) as ProtocolAnalysisFile,
          displayName: 'mock display name',
          protocolKey: 'fakeProtocolKey',
        })
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
    })
    afterEach(() => {
      resetAllWhenMocks()
    })

    it('renders module setup and allows the user to proceed to labware setup', () => {
      const { getByText } = render()
      const moduleSetup = getByText('Module Setup')
      moduleSetup.click()
      getByText('Mock SetupModules')
    })

    it('renders correct text contents for multiple modules', () => {
      const { getByText } = render()

      getByText('STEP 1')
      getByText('Robot Calibration')
      getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      getByText('STEP 2')
      getByText('Module Setup')

      getByText(
        'Plug in and turn on the required modules via the OT-2 USB Ports. Place the modules as shown in the deck map.'
      )
      getByText('STEP 3')
      getByText('Labware Setup')

      getByText(
        'Position full tip racks and labware in the deck slots as shown in the deck map.'
      )
    })

    it('renders correct text contents for single module', () => {
      when(mockUseProtocolDetailsForRun)
        .calledWith(RUN_ID)
        .mockReturnValue({
          protocolData: ({
            ...withModulesProtocol,
            modules: pick(
              withModulesProtocol.modules,
              Object.keys(withModulesProtocol.modules)[0]
            ),
          } as unknown) as ProtocolAnalysisFile,
          displayName: 'mock display name',
          protocolKey: 'fakeProtocolKey',
        })
      const { getByText } = render()

      getByText('STEP 1')
      getByText('Robot Calibration')
      getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      getByText('STEP 2')
      getByText('Module Setup')

      getByText(
        'Plug in and turn on the required module via the OT-2 USB Port. Place the module as shown in the deck map.'
      )
      getByText('STEP 3')
      getByText('Labware Setup')
      getByText(
        'Position full tip racks and labware in the deck slots as shown in the deck map.'
      )
    })

    it('renders view-only info message if run has started', async () => {
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)

      const { getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(getByText('Mock SetupModules')).not.toBeVisible()
      expect(getByText('Mock SetupLabware')).not.toBeVisible()
      getByText('Setup is view-only once run has started')
    })
  })
})
