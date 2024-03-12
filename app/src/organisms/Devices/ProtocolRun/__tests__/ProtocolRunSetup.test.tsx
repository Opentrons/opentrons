import * as React from 'react'
import { when } from 'vitest-when'
import { fireEvent, screen } from '@testing-library/react'
import { describe, it, beforeEach, vi, afterEach, expect } from 'vitest'

import {
  parseAllRequiredModuleModels,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  getSimplestDeckConfigForProtocol,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  simple_v4 as noModulesProtocol,
  test_modules_protocol as withModulesProtocol,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../../__testing-utils__'
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
  useRunPipetteInfoByMount,
  useStoredProtocolAnalysis,
  useUnmatchedModulesForProtocol,
} from '../../hooks'
import { SetupLabware } from '../SetupLabware'
import { SetupRobotCalibration } from '../SetupRobotCalibration'
import { SetupLiquids } from '../SetupLiquids'
import { SetupModuleAndDeck } from '../SetupModuleAndDeck'
import { EmptySetupStep } from '../EmptySetupStep'
import { ProtocolRunSetup } from '../ProtocolRunSetup'
import { useNotifyRunQuery } from '../../../../resources/runs'

import type * as SharedData from '@opentrons/shared-data'

vi.mock('@opentrons/api-client')
vi.mock('../../hooks')
vi.mock('../SetupLabware')
vi.mock('../SetupRobotCalibration')
vi.mock('../SetupModuleAndDeck')
vi.mock('../SetupLiquids')
vi.mock('../EmptySetupStep')
vi.mock('../../../LabwarePositionCheck/useMostRecentCompletedAnalysis')
vi.mock('../../../../redux/config')
vi.mock('../../../../resources/deck_configuration/utils')
vi.mock('../../../../resources/deck_configuration/hooks')
vi.mock('../../../../resources/runs/useNotifyRunQuery')
vi.mock('@opentrons/shared-data', async importOriginal => {
  const actualSharedData = await importOriginal<typeof SharedData>()
  return {
    ...actualSharedData,
    parseProtocolData: vi.fn(),
    getSimplestDeckConfigForProtocol: vi.fn(),
  }
})

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
    when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as any)
    when(vi.mocked(useProtocolAnalysisErrors)).calledWith(RUN_ID).thenReturn({
      analysisErrors: null,
    })
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(({
        ...noModulesProtocol,
        ...MOCK_ROTOCOL_LIQUID_KEY,
      } as unknown) as SharedData.ProtocolAnalysisOutput)
    vi.mocked(parseAllRequiredModuleModels).mockReturnValue([])
    vi.mocked(parseLiquidsInLoadOrder).mockReturnValue([])
    when(vi.mocked(useRobot))
      .calledWith(ROBOT_NAME)
      .thenReturn(mockConnectedRobot)
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ complete: true })
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(false)
    when(vi.mocked(SetupRobotCalibration))
      .calledWith(
        expect.objectContaining({
          robotName: ROBOT_NAME,
          runId: RUN_ID,
        }),
        // @ts-expect-error Potential Vitest issue. Seems this actually takes two args.
        expect.anything()
      )
      .thenReturn(<span>Mock SetupRobotCalibration</span>)
    when(vi.mocked(SetupLabware))
      .calledWith(
        expect.objectContaining({
          protocolRunHeaderRef: null,
          robotName: ROBOT_NAME,
          runId: RUN_ID,
        }),
        // @ts-expect-error Potential Vitest issue. Seems this actually takes two args.
        expect.anything()
      )
      .thenReturn(<span>Mock SetupLabware</span>)
    vi.mocked(SetupRobotCalibration).mockReturnValue(
      <div>Mock SetupRobotCalibration</div>
    )
    vi.mocked(SetupModuleAndDeck).mockReturnValue(<div>Mock SetupModules</div>)
    vi.mocked(SetupLiquids).mockReturnValue(<div>Mock SetupLiquids</div>)
    vi.mocked(EmptySetupStep).mockReturnValue(<div>Mock EmptySetupStep</div>)
    vi.mocked(getSimplestDeckConfigForProtocol).mockReturnValue([])
    vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([])
    vi.mocked(getRequiredDeckConfig).mockReturnValue([])
    when(vi.mocked(useUnmatchedModulesForProtocol))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ missingModuleIds: [], remainingAttachedModules: [] })
    vi.mocked(getIsFixtureMismatch).mockReturnValue(false)
    vi.mocked(useNotifyRunQuery).mockReturnValue({} as any)
    when(vi.mocked(useRunPipetteInfoByMount))
      .calledWith(RUN_ID)
      .thenReturn({ left: null, right: null })
  })
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders null if robot is null', () => {
    when(vi.mocked(useRobot)).calledWith(ROBOT_NAME).thenReturn(null)
    const { container } = render()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders loading data message if robot-analyzed and app-analyzed protocol data is null', () => {
    when(vi.mocked(useMostRecentCompletedAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    when(vi.mocked(useStoredProtocolAnalysis))
      .calledWith(RUN_ID)
      .thenReturn(null)
    render()
    screen.getByText('Loading data...')
  })

  it('renders calibration ready when robot calibration complete', () => {
    render()
    screen.getByText('Calibration ready')
  })

  it('renders calibration needed when robot calibration not complete', () => {
    when(vi.mocked(useRunCalibrationStatus))
      .calledWith(ROBOT_NAME, RUN_ID)
      .thenReturn({ complete: false })
    render()
    screen.getByText('Calibration needed')
  })

  it('does not render calibration status when run has started', () => {
    when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(true)
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
    it('renders robot calibration setup for Flex', () => {
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
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
      when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(true)

      render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(screen.getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(screen.getByText('Mock SetupLabware')).not.toBeVisible()
      screen.getByText('Setup is view-only once run has started')
    })
  })

  describe('when modules are in the protocol', () => {
    beforeEach(() => {
      vi.mocked(parseAllRequiredModuleModels).mockReturnValue([
        'magneticModuleV1',
        'temperatureModuleV1',
      ])
      when(vi.mocked(useMostRecentCompletedAnalysis))
        .calledWith(RUN_ID)
        .thenReturn({
          ...withModulesProtocol,
          ...MOCK_ROTOCOL_LIQUID_KEY,
        } as any)
      when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(false)
      when(vi.mocked(useModuleCalibrationStatus))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({ complete: true })
    })
    afterEach(() => {
      vi.clearAllMocks()
    })

    it('renders calibration ready if robot is Flex and modules are calibrated', () => {
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
      when(vi.mocked(useModuleCalibrationStatus))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({ complete: true })

      render()
      expect(screen.getAllByText('Calibration ready').length).toEqual(2)
    })

    it('renders calibration needed if robot is Flex and modules are not calibrated', () => {
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
      when(vi.mocked(useModuleCalibrationStatus))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({ complete: false })

      render()
      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText('Calibration needed')
    })

    it('does not render calibration element if robot is OT-2', () => {
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(false)

      render()
      expect(screen.getAllByText('Calibration ready').length).toEqual(1)
    })

    it('renders action needed if robot is Flex and modules are not connected', () => {
      when(vi.mocked(useUnmatchedModulesForProtocol))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({
          missingModuleIds: ['temperatureModuleV1'],
          remainingAttachedModules: [],
        })
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
      when(vi.mocked(useModuleCalibrationStatus))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({ complete: false })

      render()
      screen.getByText('STEP 2')
      screen.getByText('Modules & deck')
      screen.getByText('Action needed')
    })

    it('renders action needed if robot is Flex and deck config is not configured', () => {
      vi.mocked(useDeckConfigurationCompatibility).mockReturnValue([
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
      vi.mocked(getRequiredDeckConfig).mockReturnValue([
        {
          cutoutId: 'cutoutA1',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          requiredAddressableAreas: ['D4'],
          compatibleCutoutFixtureIds: [
            STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          ],
        },
      ] as any)
      vi.mocked(getIsFixtureMismatch).mockReturnValue(true)
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
      when(vi.mocked(useModuleCalibrationStatus))
        .calledWith(ROBOT_NAME, RUN_ID)
        .thenReturn({ complete: false })

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
      when(vi.mocked(useMostRecentCompletedAnalysis))
        .calledWith(RUN_ID)
        .thenReturn({
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
      vi.mocked(parseAllRequiredModuleModels).mockReturnValue([
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
      when(vi.mocked(useIsFlex)).calledWith(ROBOT_NAME).thenReturn(true)
      when(vi.mocked(useMostRecentCompletedAnalysis))
        .calledWith(RUN_ID)
        .thenReturn({
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
      vi.mocked(parseAllRequiredModuleModels).mockReturnValue([
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
      when(vi.mocked(useRunHasStarted)).calledWith(RUN_ID).thenReturn(true)

      render()
      await new Promise(resolve => setTimeout(resolve, 1000))
      expect(screen.getByText('Mock SetupRobotCalibration')).not.toBeVisible()
      expect(screen.getByText('Mock SetupModules')).not.toBeVisible()
      expect(screen.getByText('Mock SetupLabware')).not.toBeVisible()
      screen.getByText('Setup is view-only once run has started')
    })

    it('renders analysis error message if there is an analysis error', async () => {
      when(vi.mocked(useProtocolAnalysisErrors))
        .calledWith(RUN_ID)
        .thenReturn({
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
