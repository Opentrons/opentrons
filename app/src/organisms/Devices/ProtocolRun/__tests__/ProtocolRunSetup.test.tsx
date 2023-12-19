import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { fireEvent, screen } from '@testing-library/react'

import {
  parseAllRequiredModuleModels,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'
import {
  getSimplestDeckConfigForProtocol,
  ProtocolAnalysisOutput,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
} from '@opentrons/shared-data'
import noModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/simpleV4.json'
import withModulesProtocol from '@opentrons/shared-data/protocol/fixtures/4/testModulesProtocol.json'

import { i18n } from '../../../../i18n'
import { mockConnectedRobot } from '../../../../redux/discovery/__fixtures__'
import {
  getIsFixtureMismatch,
  getRequiredDeckConfig,
} from '../../../../resources/deck_configuration/utils'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { useDeckConfigurationCompatibility } from '../../../../resources/deck_configuration/hooks'
import {
  useIsFlex,
  useModuleCalibrationStatus,
  useProtocolAnalysisErrors,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { SetupLabware } from '../SetupLabware'
import { SetupRobotCalibration } from '../SetupRobotCalibration'
import { SetupLiquids } from '../SetupLiquids'
import { SetupModuleAndDeck } from '../SetupModuleAndDeck'
import { EmptySetupStep } from '../EmptySetupStep'
import { ProtocolRunSetup } from '../ProtocolRunSetup'

jest.mock('@opentrons/api-client')
jest.mock('../../hooks')
jest.mock('../SetupLabware')
jest.mock('../SetupRobotCalibration')
jest.mock('../SetupModuleAndDeck')
jest.mock('../SetupLiquids')
jest.mock('../EmptySetupStep')
jest.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
jest.mock('@opentrons/shared-data/js/helpers/parseProtocolData')
jest.mock('@opentrons/shared-data/js/helpers/getSimplestFlexDeckConfig')
jest.mock('../../../../redux/config')
jest.mock('../../../../resources/deck_configuration/utils')
jest.mock('../../../../resources/deck_configuration/hooks')

const mockUseIsFlex = useIsFlex as jest.MockedFunction<typeof useIsFlex>
const mockUseMostRecentCompletedAnalysis = useMostRecentCompletedAnalysis as jest.MockedFunction<
  typeof useMostRecentCompletedAnalysis
>
const mockUseProtocolAnalysisErrors = useProtocolAnalysisErrors as jest.MockedFunction<
  typeof useProtocolAnalysisErrors
>
const mockUseRobot = useRobot as jest.MockedFunction<typeof useRobot>
const mockUseRunCalibrationStatus = useRunCalibrationStatus as jest.MockedFunction<
  typeof useRunCalibrationStatus
>
const mockUseModuleCalibrationStatus = useModuleCalibrationStatus as jest.MockedFunction<
  typeof useModuleCalibrationStatus
>
const mockUseRunHasStarted = useRunHasStarted as jest.MockedFunction<
  typeof useRunHasStarted
>
const mockUseStoredProtocolAnalysis = useStoredProtocolAnalysis as jest.MockedFunction<
  typeof useStoredProtocolAnalysis
>
const mockParseAllRequiredModuleModels = parseAllRequiredModuleModels as jest.MockedFunction<
  typeof parseAllRequiredModuleModels
>
const mockParseLiquidsInLoadOrder = parseLiquidsInLoadOrder as jest.MockedFunction<
  typeof parseLiquidsInLoadOrder
>
const mockSetupLabware = SetupLabware as jest.MockedFunction<
  typeof SetupLabware
>
const mockSetupRobotCalibration = SetupRobotCalibration as jest.MockedFunction<
  typeof SetupRobotCalibration
>
const mockSetupModuleAndDeck = SetupModuleAndDeck as jest.MockedFunction<
  typeof SetupModuleAndDeck
>
const mockSetupLiquids = SetupLiquids as jest.MockedFunction<
  typeof SetupLiquids
>
const mockEmptySetupStep = EmptySetupStep as jest.MockedFunction<
  typeof EmptySetupStep
>
const mockGetSimplestDeckConfigForProtocol = getSimplestDeckConfigForProtocol as jest.MockedFunction<
  typeof getSimplestDeckConfigForProtocol
>
const mockGetRequiredDeckConfig = getRequiredDeckConfig as jest.MockedFunction<
  typeof getRequiredDeckConfig
>
const mockUseUnmatchedModulesForProtocol = useUnmatchedModulesForProtocol as jest.MockedFunction<
  typeof useUnmatchedModulesForProtocol
>
const mockUseDeckConfigurationCompatibility = useDeckConfigurationCompatibility as jest.MockedFunction<
  typeof useDeckConfigurationCompatibility
>
const mockGetIsFixtureMismatch = getIsFixtureMismatch as jest.MockedFunction<
  typeof getIsFixtureMismatch
>

const ROBOT_NAME = 'otie'
const RUN_ID = '1'
const MOCK_ROTOCOL_LIQUID_KEY = { liquids: [] }
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
    when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as any)
    when(mockUseProtocolAnalysisErrors).calledWith(RUN_ID).mockReturnValue({
      analysisErrors: null,
    })
    when(mockUseStoredProtocolAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as unknown) as ProtocolAnalysisOutput)
    when(mockParseAllRequiredModuleModels).mockReturnValue([])
    when(mockParseLiquidsInLoadOrder).mockReturnValue([])
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
    when(mockSetupModuleAndDeck).mockReturnValue(<div>Mock SetupModules</div>)
    when(mockSetupLiquids).mockReturnValue(<div>Mock SetupLiquids</div>)
    when(mockEmptySetupStep).mockReturnValue(<div>Mock EmptySetupStep</div>)
    when(mockGetSimplestDeckConfigForProtocol).mockReturnValue([])
    when(mockUseDeckConfigurationCompatibility).mockReturnValue([])
    when(mockGetRequiredDeckConfig).mockReturnValue([])
    when(mockUseUnmatchedModulesForProtocol)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ missingModuleIds: [], remainingAttachedModules: [] })
    when(mockGetIsFixtureMismatch).mockReturnValue(false)
  })
  afterEach(() => {
    resetAllWhenMocks()
  })

  it('renders null if robot is null', () => {
    when(mockUseRobot).calledWith(ROBOT_NAME).mockReturnValue(null)
    const { container } = render()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders loading data message if robot-analyzed and app-analyzed protocol data is null', () => {
    when(mockUseMostRecentCompletedAnalysis)
      .calledWith(RUN_ID)
      .mockReturnValue(null)
    when(mockUseStoredProtocolAnalysis).calledWith(RUN_ID).mockReturnValue(null)
    render()
    screen.getByText('Loading data...')
  })

  it('renders calibration ready when robot calibration complete', () => {
    render()
    screen.getByText('Calibration ready')
  })

  it('renders calibration needed when robot calibration not complete', () => {
    when(mockUseRunCalibrationStatus)
      .calledWith(ROBOT_NAME, RUN_ID)
      .mockReturnValue({ complete: false })
    render()
    screen.getByText('Calibration needed')
  })

  it('does not render calibration status when run has started', () => {
    when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)
    render()
    expect(screen.queryByText('Calibration needed')).toBeNull()
    expect(screen.queryByText('Calibration ready')).toBeNull()
  })

  describe('when no modules are in the protocol', () => {
    it('renders robot calibration setup for OT-2', () => {
      render()

      screen.getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      const robotCalibrationSetup = screen.getByText('Instruments')
      fireEvent.click(robotCalibrationSetup)
      expect(screen.getByText('Mock SetupRobotCalibration')).toBeVisible()
    })
    it('renders robot calibration setup for OT-3', () => {
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      render()

      screen.getByText(
        'Review required instruments and calibrations for this protocol.'
      )
      const robotCalibrationSetup = screen.getByText('Instruments')
      fireEvent.click(robotCalibrationSetup)
      expect(screen.getByText('Mock SetupRobotCalibration')).toBeVisible()
    })
    it('renders labware setup', () => {
      render()

      screen.getByText(
        'Gather the following labware and full tip racks. To run your protocol without Labware Position Check, place and secure labware in their initial locations.'
      )
      const labwareSetup = screen.getByText('Labware')
      fireEvent.click(labwareSetup)
      expect(screen.getByText('Mock SetupLabware')).toBeVisible()
    })
    it('renders the empty states for modules and liquids when no modules in protocol', () => {
      render()
      screen.getAllByText('Mock EmptySetupStep')
    })

    it('defaults to no step expanded', () => {
      render()
      expect(screen.getByText('Mock SetupLabware')).not.toBeVisible()
    })

    it('renders view-only info message if run has started', async () => {
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)

      render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(screen.getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(screen.getByText('Mock SetupLabware')).not.toBeVisible()
      screen.getByText('Setup is view-only once run has started')
    })
  })

  describe('when modules are in the protocol', () => {
    beforeEach(() => {
      when(mockParseAllRequiredModuleModels).mockReturnValue([
        'magneticModuleV1',
        'temperatureModuleV1',
      ])
      when(mockUseMostRecentCompletedAnalysis)
        .calledWith(RUN_ID)
        .mockReturnValue({
          ...withModulesProtocol,
          ...MOCK_ROTOCOL_LIQUID_KEY,
        } as any)
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(false)
      when(mockUseModuleCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: true })
    })
    afterEach(() => {
      resetAllWhenMocks()
    })

    it('renders calibration ready if robot is Flex and modules are calibrated', () => {
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      when(mockUseModuleCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: true })

      render()
      expect(screen.getAllByText('Calibration ready').length).toEqual(2)
    })

    it('renders calibration needed if robot is Flex and modules are not calibrated', () => {
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      when(mockUseModuleCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: false })

      render()
      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText('Calibration needed')
    })

    it('does not render calibration element if robot is OT-2', () => {
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(false)

      render()
      expect(screen.getAllByText('Calibration ready').length).toEqual(1)
    })

    it('renders action needed if robot is Flex and modules are not connected', () => {
      when(mockUseUnmatchedModulesForProtocol)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({
          missingModuleIds: ['temperatureModuleV1'],
          remainingAttachedModules: [],
        })
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      when(mockUseModuleCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: false })

      render()
      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText('Action needed')
    })

    it('renders action needed if robot is Flex and deck config is not configured', () => {
      mockUseDeckConfigurationCompatibility.mockReturnValue([
        {
          cutoutId: 'cutoutA1',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          requiredAddressableAreas: ['D4'],
          compatibleCutoutFixtureIds: [
            STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          ],
          missingLabwareDisplayName: null,
        },
      ])
      when(mockGetRequiredDeckConfig).mockReturnValue([
        {
          cutoutId: 'cutoutA1',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          requiredAddressableAreas: ['D4'],
          compatibleCutoutFixtureIds: [
            STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          ],
        },
      ] as any)
      when(mockGetIsFixtureMismatch).mockReturnValue(true)
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      when(mockUseModuleCalibrationStatus)
        .calledWith(ROBOT_NAME, RUN_ID)
        .mockReturnValue({ complete: false })

      render()
      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText('Action needed')
    })

    it('renders module setup and allows the user to proceed to labware setup', () => {
      render()
      const moduleSetup = screen.getByText('Modules')
      fireEvent.click(moduleSetup)
      screen.getByText('Mock SetupModules')
    })

    it('renders correct text contents for multiple modules', () => {
      render()

      screen.getByText('STEP 1')
      screen.getByText('Instruments')
      screen.getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      screen.getByText('STEP 2')
      screen.getByText('Modules')

      screen.getByText('Install the required modules and power them on.')
      screen.getByText('STEP 3')
      screen.getByText('Labware')

      screen.getByText(
        'Gather the following labware and full tip racks. To run your protocol without Labware Position Check, place and secure labware in their initial locations.'
      )
    })

    it('renders correct text contents for single module', () => {
      when(mockUseMostRecentCompletedAnalysis)
        .calledWith(RUN_ID)
        .mockReturnValue({
          ...withModulesProtocol,
          ...MOCK_ROTOCOL_LIQUID_KEY,
          modules: [
            {
              id: '1d57adf0-67ad-11ea-9f8b-3b50068bd62d:magneticModuleType',
              location: { slot: '1' },
              model: 'magneticModuleV1',
            },
          ],
        } as any)
      when(mockParseAllRequiredModuleModels).mockReturnValue([
        'magneticModuleV1',
      ])
      render()

      screen.getByText('STEP 1')
      screen.getByText('Instruments')
      screen.getByText(
        'Review required pipettes and tip length calibrations for this protocol.'
      )
      screen.getByText('STEP 2')
      screen.getByText('Modules')

      screen.getByText('Install the required modules and power them on.')
      screen.getByText('STEP 3')
      screen.getByText('Labware')
      screen.getByText(
        'Gather the following labware and full tip racks. To run your protocol without Labware Position Check, place and secure labware in their initial locations.'
      )
    })

    it('renders correct text contents for modules and fixtures', () => {
      when(mockUseIsFlex).calledWith(ROBOT_NAME).mockReturnValue(true)
      when(mockUseMostRecentCompletedAnalysis)
        .calledWith(RUN_ID)
        .mockReturnValue({
          ...withModulesProtocol,
          ...MOCK_ROTOCOL_LIQUID_KEY,
          modules: [
            {
              id: '1d57adf0-67ad-11ea-9f8b-3b50068bd62d:magneticModuleType',
              location: { slot: '1' },
              model: 'magneticModuleV1',
            },
          ],
        } as any)
      when(mockParseAllRequiredModuleModels).mockReturnValue([
        'magneticModuleV1',
      ])
      render()

      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText(
        'Install the required modules and power them on. Install the required fixtures and review the deck configuration.'
      )
    })

    it('renders view-only info message if run has started', async () => {
      when(mockUseRunHasStarted).calledWith(RUN_ID).mockReturnValue(true)

      render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(screen.getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(screen.getByText('Mock SetupModules')).not.toBeVisible()
      expect(screen.getByText('Mock SetupLabware')).not.toBeVisible()
      screen.getByText('Setup is view-only once run has started')
    })

    it('renders analysis error message if there is an analysis error', async () => {
      when(mockUseProtocolAnalysisErrors)
        .calledWith(RUN_ID)
        .mockReturnValue({
          analysisErrors: [
            {
              id: 'error_id',
              detail: 'protocol analysis error',
              errorType: 'analysis',
              createdAt: '100000',
            },
          ],
        })
      render()
      screen.getByText('Protocol analysis failed')
    })
  })
})
