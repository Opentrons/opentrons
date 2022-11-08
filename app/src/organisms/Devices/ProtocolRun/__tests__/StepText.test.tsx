import * as React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'

import { RunCommandSummary } from '@opentrons/api-client'
import { renderWithProviders } from '@opentrons/components'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { getSlotLabwareName } from '../utils/getSlotLabwareName'
import { i18n } from '../../../../i18n'
import { getLabwareLocation } from '../../ProtocolRun/utils/getLabwareLocation'
import {
  useLabwareRenderInfoForRunById,
  useProtocolDetailsForRun,
} from '../../hooks'
import { RunLogProtocolSetupInfo } from '../RunLogProtocolSetupInfo'
import { StepText } from '../StepText'

import type { RunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command'

jest.mock('@opentrons/shared-data/js/helpers')
jest.mock('../../ProtocolRun/utils/getLabwareLocation')
jest.mock('../../hooks')
jest.mock('./../RunLogProtocolSetupInfo')
jest.mock('../utils/getSlotLabwareName')

const mockUseProtocolDetailsForRun = useProtocolDetailsForRun as jest.MockedFunction<
  typeof useProtocolDetailsForRun
>
const mockUseLabwareRenderInfoForRunById = useLabwareRenderInfoForRunById as jest.MockedFunction<
  typeof useLabwareRenderInfoForRunById
>
const mockGetLabwareDisplayName = getLabwareDisplayName as jest.MockedFunction<
  typeof getLabwareDisplayName
>
const mockGetLabwareLocation = getLabwareLocation as jest.MockedFunction<
  typeof getLabwareLocation
>
const mockRunLogProtocolSetupInfo = RunLogProtocolSetupInfo as jest.MockedFunction<
  typeof RunLogProtocolSetupInfo
>
const mockGetSlotLabwareName = getSlotLabwareName as jest.MockedFunction<
  typeof getSlotLabwareName
>

const render = (props: React.ComponentProps<typeof StepText>) => {
  return renderWithProviders(<StepText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const ROBOT_NAME = 'otie'
const RUN_ID = 'ab60e8ff-e281-4219-9f7c-61fc816482dd'

const MOCK_ANALYSIS_COMMAND: RunTimeCommand = {
  id: 'some_id',
  commandType: 'custom',
  status: 'queued',
  params: {},
} as any

const MOCK_COMMAND_SUMMARY: RunCommandSummary = {
  id: '123',
  commandType: 'custom',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
} as any

const MOCK_LOAD_COMMAND = {
  id: '1234',
  commandType: 'loadModule',
  params: {},
  status: 'running',
  result: {},
  startedAt: 'start timestamp',
  completedAt: 'end timestamp',
}

describe('StepText', () => {
  beforeEach(() => {
    mockUseProtocolDetailsForRun.mockReturnValue({
      protocolData: { commands: [] },
    } as any)
    mockUseLabwareRenderInfoForRunById.mockReturnValue({} as any)
    mockRunLogProtocolSetupInfo.mockReturnValue(
      <div>Mock Protocol Setup Step</div>
    )
    mockGetSlotLabwareName.mockReturnValue({
      slotName: 'fake_labware_location',
      labwareName: 'fake_display_name',
    })
  })
  afterEach(() => {
    jest.resetAllMocks()
    resetAllWhenMocks()
  })

  it('renders correct command text for custom legacy commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: MOCK_ANALYSIS_COMMAND,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        params: { legacyCommandText: 'legacy command text' } as any,
      },
    })
    getByText('legacy command text')
  })

  it('renders correct command text for pause commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'pause',
        params: {
          message: 'THIS IS THE PAUSE MESSAGE',
        },
      },
    })
    getByText('THIS IS THE PAUSE MESSAGE')
  })

  it('renders correct command text for wait for resume commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'waitForResume',
        params: {
          message: 'THIS IS THE PAUSE MESSAGE',
        },
      },
    })
    getByText('THIS IS THE PAUSE MESSAGE')
  })

  it('renders correct text for wait for resume without message', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'waitForResume',
        params: {},
      },
    })
    getByText('Pausing protocol')
  })

  it('renders correct command text for load commands', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: MOCK_LOAD_COMMAND as RunCommandSummary,
    })
    getByText('Mock Protocol Setup Step')
  })

  it('renders correct command text for pick up tip', () => {
    const labwareId = 'labwareId'
    const wellName = 'wellName'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'pickUpTip',
        params: {
          wellName,
          labwareId,
        },
      },
    })
    getByText('Picking up tip from wellName of fake_display_name')
  })

  it('renders correct command text for for legacy command with non-string text', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'custom',
        params: {
          legacyCommandType: 'anyLegacyCommand',
          legacyCommandText: { someKey: ['someValue', 'someOtherValue'] },
        },
      },
    })
    getByText('{"someKey":["someValue","someOtherValue"]}')
  })

  it('renders correct command text for engage magnetic module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'magneticModule/engage',
        params: {
          moduleId: 'moduleId',
          height: 10,
        },
      },
    })
    getByText('Engaging Magnetic Module')
  })

  it('renders correct command text for disengage magnetic module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'magneticModule/disengage',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Disengaging Magnetic Module')
  })

  it('renders correct command text for set temperature on temp module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'temperatureModule/setTargetTemperature',
        params: {
          moduleId: 'moduleId',
          celsius: 50,
        },
      },
    })
    getByText('Setting Temperature Module to 50°C (rounded to nearest integer)')
  })

  it('renders correct command text for deactivating temp module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'temperatureModule/deactivate',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Deactivating Temperature Module')
  })

  it('renders correct command text for awaiting temp on temperature module', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'temperatureModule/waitForTemperature',
        params: {
          moduleId: 'moduleId',
          celsius: 50,
        },
      },
    })
    getByText(
      'Waiting for Temperature Module to reach 50°C (rounded to nearest integer)'
    )
  })

  it('renders correct command text for setting TC block temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/setTargetBlockTemperature',
        params: {
          moduleId: 'moduleId',
          celsius: 50,
          volume: 10,
        },
      },
    })
    getByText('Setting Thermocycler block temperature to 50°C')
  })

  it('renders correct command text for setting TC lid temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/setTargetLidTemperature',
        params: {
          moduleId: 'moduleId',
          celsius: 50,
        },
      },
    })
    getByText('Setting Thermocycler lid temperature to 50°C')
  })

  it('renders correct command text for awaiting TC block temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/waitForBlockTemperature',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Waiting for Thermocycler block to reach target temperature')
  })

  it('renders correct command text for awaiting TC lid temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/waitForLidTemperature',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Waiting for Thermocycler lid to reach target temperature')
  })

  it('renders correct command text for opening tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/openLid',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Opening Thermocycler lid')
  })

  it('renders correct command text for closing tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/closeLid',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Closing Thermocycler lid')
  })

  it('renders correct command text for deactivating tc block', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/deactivateBlock',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Deactivating Thermocycler block')
  })

  it('renders correct command text for deactivating tc lid', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/deactivateLid',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Deactivating Thermocycler lid')
  })
  it('renders correct command text for tc profile starting', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/runProfile',
        params: {
          moduleId: 'moduleId',
          profile: [
            { holdSeconds: 60, celsius: 50 },
            { holdSeconds: 20, celsius: 30 },
            { holdSeconds: 10, celsius: 10 },
          ],
          blockMaxVolumeUl: 40,
        },
      },
    })
    getByText(
      'Thermocycler starting 3 repetitions of cycle composed of the following steps:'
    )
    getByText('temperature: 50°C, seconds: 60')
    getByText('temperature: 30°C, seconds: 20')
    getByText('temperature: 10°C, seconds: 10')
  })

  it('renders correct command text for TC profile to complete', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'thermocycler/awaitProfileComplete',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Waiting for Thermocycler profile to complete')
  })

  it('renders correct command text for setting HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/setTargetTemperature',
        params: {
          moduleId: 'moduleId',
          celsius: 50,
        },
      },
    })
    getByText('Setting Target Temperature of Heater-Shaker to 50°C')
  })

  it('renders correct command text for setting HS shake', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/setAndWaitForShakeSpeed',
        params: {
          moduleId: 'moduleId',
          rpm: 500,
        },
      },
    })
    getByText(
      'Setting Heater-Shaker to shake at 500 rpm and waiting until reached'
    )
  })

  it('renders correct command text for waiting HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/waitForTemperature',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Waiting for Heater-Shaker to reach target temperature')
  })

  it('renders correct command text for deactivate HS temp', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/deactivateHeater',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Deactivating heater')
  })

  it('renders correct command text for deactivate HS shake', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/deactivateShaker',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Deactivating shaker')
  })

  it('renders correct command text for close hs latch', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/closeLabwareLatch',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Latching labware on Heater-Shaker')
  })

  it('renders correct command text for open hs latch', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'heaterShaker/openLabwareLatch',
        params: {
          moduleId: 'moduleId',
        },
      },
    })
    getByText('Unlatching labware on Heater-Shaker')
  })

  it('renders correct command text for wait for duration with message', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'waitForDuration',
        params: {
          seconds: 60,
          message: 'Wait to thaw reagent',
        },
      },
    })
    getByText('Pausing for 60 seconds. Wait to thaw reagent')
  })

  it('renders correct command text for wait for duration with no message', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'waitForDuration',
        params: {
          seconds: 60,
        },
      },
    })
    getByText('Pausing for 60 seconds.')
  })

  it('renders correct command text for aspirate', () => {
    const labwareId = 'labwareId'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'aspirate',
        params: {
          volume: 100,
          flowRate: 130,
          wellName: 'wellName',
          labwareId: 'labwareId',
        },
      },
    })
    getByText(
      'Aspirating 100 uL from wellName of fake_display_name in fake_labware_location at 130 uL/sec'
    )
  })
  it('renders correct command text for dispense', () => {
    const labwareId = 'labwareId'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'dispense',
        params: {
          volume: 100,
          flowRate: 130,
          wellName: 'wellName',
          labwareId: 'labwareId',
        },
      },
    })
    getByText(
      'Dispensing 100 uL into wellName of fake_display_name in fake_labware_location at 130 uL/sec'
    )
  })
  it('renders correct command text for blowout', () => {
    const labwareId = 'labwareId'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'blowout',
        params: {
          flowRate: 130,
          wellName: 'wellName',
          labwareId: 'labwareId',
        },
      },
    })
    getByText(
      'Blowing out at wellName of fake_display_name in fake_labware_location at 130 uL/sec'
    )
  })
  it('renders correct command text for touchTip', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'touchTip',
      },
    })
    getByText('Touching tip')
  })
  it('renders correct command text for moveToSlot', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'moveToSlot',
        params: { slotName: 'slot 5' },
      },
    })
    getByText('Moving to slot 5')
  })
  it('renders correct command text for moveToWell', () => {
    const labwareId = 'labwareId'
    when(mockGetLabwareDisplayName)
      .calledWith('fake_def' as any)
      .mockReturnValue('fake_display_name')
    when(mockGetLabwareLocation)
      .calledWith(labwareId, [])
      .mockReturnValue({ slotName: 'fake_labware_location' })
    mockUseLabwareRenderInfoForRunById.mockReturnValue({
      labwareId: {
        labwareDef: 'fake_def',
      },
    } as any)
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'moveToWell',
        params: {
          wellName: 'wellName',
          labwareId: 'labwareId',
        },
      },
    })
    getByText(
      'Moving to wellName of fake_display_name in fake_labware_location'
    )
  })
  it('renders correct command text for moveRelative', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'moveRelative',
        params: { distance: '4', axis: 'y' },
      },
    })
    getByText('Moving 4 mm along y axis')
  })
  it('renders correct command text for moveToCoordinates', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'moveToCoordinates',
        params: { coordinates: { x: '4', y: '5', z: '2' } },
      },
    })
    getByText('Moving to (X: 4, Y: 5, Z: 2)')
  })

  it('renders correct command text for home', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'home',
        params: {
          axes: ['x', 'y', 'leftZ', 'rightZ', 'leftPLunger', 'rightPlunger'],
        },
      },
    })
    getByText('Homing all gantry, pipette, and plunger axes')
  })

  it('renders correct command text for savingPosition', () => {
    const { getByText } = render({
      robotName: ROBOT_NAME,
      runId: RUN_ID,
      analysisCommand: null,
      runCommand: {
        ...MOCK_COMMAND_SUMMARY,
        commandType: 'savePosition',
        params: {
          pipetteId: 'pipetteId',
        },
      },
    })
    getByText('Saving position')
  })
})
