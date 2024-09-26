import type * as React from 'react'
import { describe, it, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { fixture96Plate, fixtureTiprack1000ul } from '@opentrons/shared-data'
import { renderWithProviders } from '../../__testing-utils__'
import { i18n } from '../../assets/localization'
import {
  getAdditionalEquipmentEntities,
  getArgsAndErrorsByStepId,
  getBatchEditFormHasUnsavedChanges,
  getCurrentFormCanBeSaved,
  getCurrentFormHasUnsavedChanges,
  getInitialDeckSetup,
  getOrderedStepIds,
  getSavedStepForms,
} from '../../step-forms/selectors'
import { selectors as labwareIngredSelectors } from '../../labware-ingred/selectors'
import { getErrorStepId, getSubsteps } from '../../file-data/selectors'
import { getHasTimelineWarningsPerStep } from '../../top-selectors/timelineWarnings'
import { getHasFormLevelWarningsPerStep } from '../../dismiss/selectors'
import {
  getCollapsedSteps,
  getHoveredSubstep,
  getIsMultiSelectMode,
  getMultiSelectItemIds,
  getMultiSelectLastSelected,
  getSelectedStepId,
} from '../../ui/steps'
import { getLabwareNicknamesById } from '../../ui/labware/selectors'
import { ConnectedStepItem } from '../ConnectedStepItem'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('../../step-forms/selectors')
vi.mock('../../file-data/selectors')
vi.mock('../../top-selectors/timelineWarnings')
vi.mock('../../dismiss/selectors')
vi.mock('../../ui/steps')
vi.mock('../../labware-ingred/selectors')
vi.mock('../../ui/labware/selectors')

const render = (props: React.ComponentProps<typeof ConnectedStepItem>) => {
  return renderWithProviders(<ConnectedStepItem {...props} />, {
    i18nInstance: i18n,
  })
}
const pauseStepId = 'pauseId'
const magnetStepId = 'magnetStepId'
const heaterShakerStepId = 'hsStepId'
const thermocyclerStepId = 'tcStepId'
const temperatureStepId = 'tempStepId'
const moveLabwareStepId = 'moveLabwareId'
const mixStepId = 'mixStepId'
const moveLiquidStepId = 'moveLiquidStepId'

describe('ConnectedStepItem', () => {
  let props: React.ComponentProps<typeof ConnectedStepItem>
  beforeEach(() => {
    props = {
      stepId: pauseStepId,
      stepNumber: 2,
      onStepContextMenu: vi.fn(),
    }
    vi.mocked(getSavedStepForms).mockReturnValue({
      [pauseStepId]: {
        stepType: 'pause',
        id: pauseStepId,
        pauseHour: '1',
        pauseMinute: '10',
        pauseSecond: '5',
        pauseMessage: 'mock message',
        pauseTemperature: '10',
      },
      [magnetStepId]: {
        stepType: 'magnet',
        id: magnetStepId,
      },
      [heaterShakerStepId]: {
        stepType: 'heaterShaker',
        id: heaterShakerStepId,
      },
      [thermocyclerStepId]: {
        stepType: 'thermocycler',
        id: thermocyclerStepId,
      },
      [temperatureStepId]: {
        stepType: 'temperature',
        id: temperatureStepId,
      },
      [moveLabwareStepId]: {
        stepType: 'moveLabware',
        id: moveLabwareStepId,
      },
      [mixStepId]: {
        stepType: 'mix',
        id: mixStepId,
      },
      [moveLiquidStepId]: {
        stepType: 'moveLiquid',
        id: moveLiquidStepId,
      },
    })
    vi.mocked(getArgsAndErrorsByStepId).mockReturnValue({
      [pauseStepId]: {
        errors: false,
        stepArgs: null,
      },
      [magnetStepId]: {
        errors: false,
        stepArgs: null,
      },
      [heaterShakerStepId]: {
        errors: false,
        stepArgs: null,
      },
      [thermocyclerStepId]: {
        errors: false,
        stepArgs: null,
      },
      [temperatureStepId]: {
        errors: false,
        stepArgs: null,
      },
      [moveLabwareStepId]: {
        errors: false,
        stepArgs: null,
      },
      [mixStepId]: {
        errors: false,
        stepArgs: null,
      },
      [moveLiquidStepId]: {
        errors: false,
        stepArgs: null,
      },
    })
    vi.mocked(getErrorStepId).mockReturnValue(null)
    vi.mocked(getHasTimelineWarningsPerStep).mockReturnValue({
      [pauseStepId]: false,
      [magnetStepId]: false,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: false,
      [temperatureStepId]: false,
      [moveLabwareStepId]: false,
      [mixStepId]: false,
      [moveLiquidStepId]: false,
    })
    vi.mocked(getHasFormLevelWarningsPerStep).mockReturnValue({
      [pauseStepId]: false,
      [magnetStepId]: false,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: false,
      [temperatureStepId]: false,
      [moveLabwareStepId]: false,
      [mixStepId]: false,
      [moveLiquidStepId]: false,
    })
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {
        thermocyclerId: {
          id: 'thermocyclerId',
          type: 'thermocyclerModuleType',
          model: 'thermocyclerModuleV2',
          slot: 'B1',
          moduleState: {} as any,
        },
        temperatureId: {
          id: 'temperatureId',
          type: 'temperatureModuleType',
          model: 'temperatureModuleV2',
          slot: 'C3',
          moduleState: {} as any,
        },
        heaterShakerId: {
          id: 'heaterShakerId',
          type: 'heaterShakerModuleType',
          model: 'heaterShakerModuleV1',
          slot: 'D1',
          moduleState: {} as any,
        },
        magnetId: {
          id: 'magnetId',
          type: 'magneticModuleType',
          model: 'magneticModuleV2',
          slot: 'C1',
          moduleState: {} as any,
        },
      },
      additionalEquipmentOnDeck: {
        stagingAreaId: {
          name: 'stagingArea',
          location: 'B3',
          id: 'stagingAreaId',
        },
      },
      labware: {
        labwareId: {
          id: 'labwareId',
          labwareDefURI: `opentrons/fixture_96_plate/1`,
          slot: 'A2',
          def: fixture96Plate as LabwareDefinition2,
        },
        tipId: {
          id: 'tipId',
          labwareDefURI: `opentrons/${fixtureTiprack1000ul.parameters.loadName}/1`,
          slot: 'D2',
          def: fixtureTiprack1000ul as LabwareDefinition2,
        },
      },
    })
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: false,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getHoveredSubstep).mockReturnValue(null)
    vi.mocked(getSelectedStepId).mockReturnValue(pauseStepId)
    vi.mocked(getOrderedStepIds).mockReturnValue([
      pauseStepId,
      magnetStepId,
      heaterShakerStepId,
      thermocyclerStepId,
      moveLabwareStepId,
      temperatureStepId,
      mixStepId,
      moveLiquidStepId,
    ])
    vi.mocked(getMultiSelectItemIds).mockReturnValue(null)
    vi.mocked(getMultiSelectLastSelected).mockReturnValue(null)
    vi.mocked(getIsMultiSelectMode).mockReturnValue(false)
    vi.mocked(getSubsteps).mockReturnValue({
      [pauseStepId]: {
        substepType: 'pause',
        pauseStepArgs: {
          commandCreatorFnName: 'delay',
          wait: 10,
          name: 'pause',
          description: '',
          meta: { hours: 1, minutes: 10, seconds: 15 },
        },
      },
      [magnetStepId]: {
        substepType: 'magnet',
        engage: true,
        labwareNickname: 'mockLabware',
        message: 'engaging height',
      },
      [heaterShakerStepId]: {
        substepType: 'heaterShaker',
        labwareNickname: 'mockLabware',
        targetHeaterShakerTemperature: 20,
        targetSpeed: 200,
        latchOpen: false,
        heaterShakerTimerMinutes: 5,
        heaterShakerTimerSeconds: 11,
      },
      [thermocyclerStepId]: {
        substepType: 'thermocyclerProfile',
        blockTargetTempHold: 30,
        labwareNickname: 'mockLabware',
        lidOpenHold: false,
        lidTargetTempHold: 32,
        meta: { rawProfileItems: [] },
        profileSteps: [
          { holdTime: 7, temperature: 87 },
          { holdTime: 2, temperature: 55 },
        ],
        profileTargetLidTemp: 40,
        profileVolume: 21,
      },
      [temperatureStepId]: {
        substepType: 'temperature',
        temperature: 18,
        labwareNickname: 'mockLabware',
        moduleId: 'temperatureId',
        message: 'mock message',
      },
      [moveLabwareStepId]: {
        substepType: 'moveLabware',
        moveLabwareArgs: {
          commandCreatorFnName: 'moveLabware',
          name: 'move labware',
          description: '',
          labware: 'labwareId',
          useGripper: false,
          newLocation: { slotName: 'B2' },
        },
      },
      [mixStepId]: {
        substepType: 'sourceDest',
        multichannel: false,
        commandCreatorFnName: 'mix',
        parentStepId: mixStepId,
        rows: [
          {
            activeTips: null,
          },
        ],
      },
      [moveLiquidStepId]: {
        substepType: 'sourceDest',
        multichannel: false,
        commandCreatorFnName: 'transfer',
        parentStepId: moveLiquidStepId,
        rows: [
          {
            activeTips: { labwareId: 'tipId', wellName: 'A1' },
            substepIndex: 2,
            source: { well: 'A1', preIngreds: {}, postIngreds: {} },
            dest: { well: 'A1', preIngreds: {}, postIngreds: {} },
            volume: 50,
          },
        ],
      },
    })
    vi.mocked(labwareIngredSelectors.getLiquidNamesById).mockReturnValue({})
    vi.mocked(getLabwareNicknamesById).mockReturnValue({})
    vi.mocked(getAdditionalEquipmentEntities).mockReturnValue({
      stagingAreaId: { name: 'stagingArea', location: 'B3', id: 'stagingArea' },
    })
    vi.mocked(getCurrentFormCanBeSaved).mockReturnValue(true)
    vi.mocked(getCurrentFormHasUnsavedChanges).mockReturnValue(false)
    vi.mocked(getBatchEditFormHasUnsavedChanges).mockReturnValue(false)
  })
  it('renders an expanded step item for pause', () => {
    render(props)
    screen.getByText('2. pause')
    screen.getByText('Pause for Time')
    screen.getByText('1 h')
    screen.getByText('10 m')
    screen.getByText('15 s')
  })
  it('renders an expanded step item for magnet', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: false,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(magnetStepId)
    props.stepId = magnetStepId
    render(props)
    screen.getByText('2. magnet')
    screen.getByText('Magnetic module')
    screen.getByText('mockLabware')
    screen.getByText('engage')
  })
  it('renders an expanded step item for heater-shaker', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(heaterShakerStepId)
    props.stepId = heaterShakerStepId
    render(props)
    screen.getByText('2. heater-shaker')
    screen.getByText('Heater-Shaker module')
    screen.getByText('go to')
    screen.getByText('mockLabware')
    screen.getByText('20 °C')
    screen.getByText('Labware Latch')
    screen.getByText('Closed and Locked')
    screen.getByText('Shaker')
    screen.getByText('200 rpm')
    screen.getByText('Deactivate after')
  })
  it('renders an expanded step item for thermocycler', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: false,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(thermocyclerStepId)
    props.stepId = thermocyclerStepId
    render(props)
    screen.getByText('2. thermocycler')
    screen.getByText('Thermocycler module')
    screen.getByText('profile')
    screen.getByText('mockLabware')
    screen.getByText('cycling')
    screen.getByText('Lid (closed)')
    screen.getByText('40 °C')
    screen.getByText('Profile steps (0+ min)')
    screen.getByText('Ending hold')
  })
  it('renders an expanded step item for a temperature module', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: false,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(temperatureStepId)
    props.stepId = temperatureStepId
    render(props)
    screen.getByText('2. temperature')
    screen.getByText('Temperature module in Slot C3')
    screen.getByText('go to')
    screen.getByText('mockLabware')
    screen.getByText('18 °C')
    screen.getByText('"mock message"')
  })
  it('renders an expanded step for move labware', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: false,
      [mixStepId]: true,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(moveLabwareStepId)
    props.stepId = moveLabwareStepId
    render(props)
    screen.getByText('2. move labware')
    screen.getByText('Manually')
    screen.getByText('labware')
    screen.getByText('new location')
  })
  it('renders an expanded step for mix', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: false,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(mixStepId)
    props.stepId = mixStepId
    render(props)
    screen.getByText('2. mix')
    screen.getByText('uL')
    screen.getByText('μL')
  })
  it('renders an expanded step for move liquid (transfer)', () => {
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: false,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(moveLiquidStepId)
    props.stepId = moveLiquidStepId
    render(props)
    screen.getByText('2. transfer')
    screen.getByText('ASPIRATE')
    screen.getByText('DISPENSE')
    screen.getAllByText('A1')
    screen.getByText('50 μL')
  })
  it('renders a timeline warning icon for move liquid', () => {
    vi.mocked(getHasTimelineWarningsPerStep).mockReturnValue({
      [pauseStepId]: false,
      [magnetStepId]: false,
      [heaterShakerStepId]: false,
      [thermocyclerStepId]: false,
      [temperatureStepId]: false,
      [moveLabwareStepId]: false,
      [mixStepId]: false,
      [moveLiquidStepId]: true,
    })
    vi.mocked(getCollapsedSteps).mockReturnValue({
      [pauseStepId]: true,
      [magnetStepId]: true,
      [heaterShakerStepId]: true,
      [thermocyclerStepId]: true,
      [temperatureStepId]: true,
      [moveLabwareStepId]: true,
      [mixStepId]: true,
      [moveLiquidStepId]: false,
    })
    vi.mocked(getSelectedStepId).mockReturnValue(moveLiquidStepId)
    props.stepId = moveLiquidStepId
    render(props)
    screen.getByTestId('TitledStepList_icon_alert-circle')
  })
})
