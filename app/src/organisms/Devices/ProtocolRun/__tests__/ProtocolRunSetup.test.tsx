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
      })
    when(mockUseRobot)
      .calledWith(ROBOT_NAME)
      .mockReturnValue(mockConnectedRobot)
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: true })
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
    when(mockSetupModules).mockReturnValue(<div>mock SetupModules</div>)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders null if robot is null', () => {
    when(mockUseRobot).calledWith(ROBOT_NAME).mockReturnValue(null)
    const { container } = render()
    expect(container.firstChild).toBeNull()
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

    it('defaults to labware step expanded if calibration complete', async () => {
      const { getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('Mock SetupLabware')).toBeVisible()
    })

    it('defaults to robot calibration step expanded if calibration incomplete', async () => {
      when(mockUseRunCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: false })
      const { getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('Mock SetupRobotCalibration')).toBeVisible()
    })
  })

  describe('when modules are in the protocol', () => {
    beforeEach(() => {
      when(mockUseProtocolDetailsForRun)
        .calledWith(RUN_ID)
        .mockReturnValue({
          protocolData: (withModulesProtocol as unknown) as ProtocolAnalysisFile,
          displayName: 'mock display name',
        })
    })
    afterEach(() => {
      resetAllWhenMocks()
    })

    it('renders module setup and allows the user to proceed to labware setup', () => {
      const { getByText } = render()
      const moduleSetup = getByText('Module Setup')
      moduleSetup.click()
      getByText('mock SetupModules')
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

    it('defaults to module step expanded if calibration complete and modules present', async () => {
      const { queryByText, getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('mock SetupModules')).toBeVisible()
      expect(queryByText('Mock SetupLabware')).not.toBeVisible()
    })

    it('defaults to robot calibration step expanded if calibration incomplete and modules present', async () => {
      when(mockUseRunCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: false })

      const { queryByText, getByText } = render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(getByText('Mock SetupRobotCalibration')).toBeVisible()
      expect(queryByText('mock SetupModules')).not.toBeVisible()
    })
  })
})
