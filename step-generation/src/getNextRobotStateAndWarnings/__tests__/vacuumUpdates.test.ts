import cloneDeep from 'lodash/cloneDeep'
import merge from 'lodash/merge'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V2,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
} from '@opentrons/shared-data'

import { makeImmutableStateUpdater } from '../../__utils__'
import {
  TEMPERATURE_DEACTIVATED,
  VACUUM_APPROACHING_TARGET,
  VACUUM_AT_TARGET,
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_VENT_CLOSED,
  VACUUM_VENT_OPEN,
} from '../../constants'
import { getInitialRobotStateStandard, makeContext } from '../../fixtures'
import {
  forVacuumCloseVent as _forVacuumCloseVent,
  forVacuumOpenVent as _forVacuumOpenVent,
  forVacuumSetPumpPower as _forVacuumSetPumpPower,
  forVacuumSetPumpPressure as _forVacuumSetPumpPressure,
  forVacuumStopPump as _forVacuumStopPump,
} from '../vacuumUpdates'

import type { VacuumModuleSetTargetPressureCreateCommand } from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  VacuumModuleState,
  VacuumPumpStatus,
} from '../../types'

const forVacuumOpenVent = makeImmutableStateUpdater(_forVacuumOpenVent)
const forVacuumCloseVent = makeImmutableStateUpdater(_forVacuumCloseVent)
const forVacuumSetPumpPressure = makeImmutableStateUpdater(
  _forVacuumSetPumpPressure
)
const forVacuumSetPumpPower = makeImmutableStateUpdater(_forVacuumSetPumpPower)
const forVacuumStopPump = makeImmutableStateUpdater(_forVacuumStopPump)

const vacuumModuleId = 'vacuumModuleId'
const otherVacuumModuleId = 'otherVacuumModuleId'
const missingModuleId = 'missingVacuumModuleId'
const temperatureModuleId = 'temperatureModuleId'

const baseVacuumState = (): VacuumModuleState => ({
  type: VACUUM_MODULE_TYPE,
  vacuumState: null,
  ventStatus: null,
})

/** Matches `forVacuumSetPumpPressure` / `forVacuumSetPumpPower` hold branch */
const heldPressure = (targetPressure: number) => ({
  modeType: VACUUM_MODE_PRESSURE,
  targetPressure,
  status: VACUUM_APPROACHING_TARGET,
})

const heldPower = (targetPower: number) => ({
  modeType: VACUUM_MODE_POWER,
  targetPower,
  status: VACUUM_APPROACHING_TARGET,
})

function robotWithVacuum(
  robot: RobotState,
  moduleId: string,
  moduleState: VacuumModuleState
): RobotState {
  return merge({}, cloneDeep(robot), {
    modules: {
      [moduleId]: {
        slot: 'A3',
        moduleState,
      },
    },
  })
}

function robotWithTemperatureModule(robot: RobotState): RobotState {
  return merge({}, cloneDeep(robot), {
    modules: {
      [temperatureModuleId]: {
        slot: '3',
        moduleState: {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_DEACTIVATED,
          targetTemperature: null,
        },
      },
    },
  })
}

function pressureRun(
  targetPressure: number,
  status: VacuumPumpStatus
): NonNullable<VacuumModuleState['vacuumState']> {
  return {
    modeType: VACUUM_MODE_PRESSURE,
    targetPressure,
    status,
  }
}

function powerRun(
  targetPower: number,
  status: VacuumPumpStatus
): NonNullable<VacuumModuleState['vacuumState']> {
  return {
    modeType: VACUUM_MODE_POWER,
    targetPower,
    status,
  }
}

let invariantContext: InvariantContext
let emptyModulesRobot: RobotState

beforeEach(() => {
  invariantContext = makeContext()
  invariantContext.moduleEntities[vacuumModuleId] = {
    id: vacuumModuleId,
    type: VACUUM_MODULE_TYPE,
    model: VACUUM_MODULE_V1,
    pythonName: 'vacuum_module',
  }
  invariantContext.moduleEntities[otherVacuumModuleId] = {
    id: otherVacuumModuleId,
    type: VACUUM_MODULE_TYPE,
    model: VACUUM_MODULE_V1,
    pythonName: 'vacuum_module_other',
  }
  invariantContext.moduleEntities[temperatureModuleId] = {
    id: temperatureModuleId,
    type: TEMPERATURE_MODULE_TYPE,
    model: TEMPERATURE_MODULE_V2,
    pythonName: 'temperature_module',
  }
  emptyModulesRobot = getInitialRobotStateStandard(invariantContext)
})

describe('forVacuumOpenVent', () => {
  it('opens vent and clears vacuumState (including prior power run)', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: {
        modeType: VACUUM_MODE_POWER,
        targetPower: 50,
        status: VACUUM_AT_TARGET,
      },
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumOpenVent(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
    expect(updated.vacuumState).toBe(null)
  })

  it('sets vent open from initial null vent / null vacuum', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      baseVacuumState()
    )

    const result = forVacuumOpenVent(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    expect(
      (
        result.robotState.modules[vacuumModuleId]
          .moduleState as VacuumModuleState
      ).ventStatus
    ).toBe(VACUUM_VENT_OPEN)
  })

  it('only affects the targeted module when two vacuum modules are present', () => {
    let robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      merge({}, baseVacuumState(), { ventStatus: VACUUM_VENT_CLOSED })
    )
    robot = robotWithVacuum(
      robot,
      otherVacuumModuleId,
      merge({}, baseVacuumState(), { ventStatus: VACUUM_VENT_CLOSED })
    )

    const result = forVacuumOpenVent(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    expect(
      (
        result.robotState.modules[vacuumModuleId]
          .moduleState as VacuumModuleState
      ).ventStatus
    ).toBe(VACUUM_VENT_OPEN)
    expect(
      (
        result.robotState.modules[otherVacuumModuleId]
          .moduleState as VacuumModuleState
      ).ventStatus
    ).toBe(VACUUM_VENT_CLOSED)
  })

  it('no-ops when moduleId is missing', () => {
    const before = cloneDeep(emptyModulesRobot)
    const result = forVacuumOpenVent(
      { moduleId: missingModuleId },
      invariantContext,
      emptyModulesRobot
    )
    expect(result.warnings).toEqual([])
    expect(result.robotState).toEqual(before)
  })

  it('no-ops when the slot is not a vacuum module', () => {
    const robot = robotWithTemperatureModule(emptyModulesRobot)
    const before = cloneDeep(robot)
    const result = forVacuumOpenVent(
      { moduleId: temperatureModuleId },
      invariantContext,
      robot
    )
    expect(result.robotState).toEqual(before)
  })
})

describe('forVacuumCloseVent', () => {
  it('closes vent and leaves vacuumState unchanged', () => {
    const vacuumState = {
      modeType: VACUUM_MODE_PRESSURE,
      targetPressure: 100,
      status: VACUUM_AT_TARGET,
    } as const
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState,
      ventStatus: VACUUM_VENT_OPEN,
    })

    const result = forVacuumCloseVent(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
    expect(updated.vacuumState).toEqual(vacuumState)
  })

  it('no-ops when moduleId is missing', () => {
    const before = cloneDeep(emptyModulesRobot)
    const result = forVacuumCloseVent(
      { moduleId: missingModuleId },
      invariantContext,
      emptyModulesRobot
    )
    expect(result.robotState).toEqual(before)
  })
})

describe('forVacuumSetPumpPressure', () => {
  it('holds target with vent closed when duration is omitted', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      merge({}, baseVacuumState(), { ventStatus: VACUUM_VENT_OPEN })
    )

    const result = forVacuumSetPumpPressure(
      { moduleId: vacuumModuleId, gaugePressure: 250, ventAfter: true },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toEqual(heldPressure(250))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('treats JSON null duration like indefinite hold', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      baseVacuumState()
    )
    const params = {
      moduleId: vacuumModuleId,
      gaugePressure: 99,
      duration: null,
      ventAfter: true,
    } as unknown as VacuumModuleSetTargetPressureCreateCommand['params']

    const result = forVacuumSetPumpPressure(params, invariantContext, robot)

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toEqual(heldPressure(99))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('holds with vent closed when ventAfter is false even with a duration', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      baseVacuumState()
    )

    const result = forVacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 100,
        duration: 60,
        ventAfter: false,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toEqual(heldPressure(100))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('clears vacuum state and opens vent for timed run (default ventAfter)', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: pressureRun(50, VACUUM_AT_TARGET),
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumSetPumpPressure(
      { moduleId: vacuumModuleId, gaugePressure: 200, duration: 10 },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toBe(null)
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('clears vacuum state when duration is 0 and ventAfter is true', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: powerRun(75, VACUUM_APPROACHING_TARGET),
    })

    const result = forVacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 300,
        duration: 0,
        ventAfter: true,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toBe(null)
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('no-ops when module is missing or not a vacuum module', () => {
    const tempRobot = robotWithTemperatureModule(emptyModulesRobot)

    expect(
      forVacuumSetPumpPressure(
        { moduleId: missingModuleId, gaugePressure: 1 },
        invariantContext,
        emptyModulesRobot
      ).robotState
    ).toEqual(emptyModulesRobot)

    const beforeTemp = cloneDeep(tempRobot)
    expect(
      forVacuumSetPumpPressure(
        { moduleId: temperatureModuleId, gaugePressure: 1 },
        invariantContext,
        tempRobot
      ).robotState
    ).toEqual(beforeTemp)
  })
})

describe('forVacuumSetPumpPower', () => {
  it.each([
    { percentPower: 42, description: 'partial power' },
    { percentPower: 100, description: 'full power' },
  ])('holds $description when duration is omitted', ({ percentPower }) => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      baseVacuumState()
    )

    const result = forVacuumSetPumpPower(
      { moduleId: vacuumModuleId, percentPower },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toEqual(heldPower(percentPower))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('holds with vent closed when ventAfter is false with a duration', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      baseVacuumState()
    )

    const result = forVacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 33,
        duration: 120,
        ventAfter: false,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toEqual(heldPower(33))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('clears vacuum state and opens vent for timed run with ventAfter true', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: pressureRun(10, VACUUM_AT_TARGET),
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 80,
        duration: 5,
        ventAfter: true,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toBe(null)
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('no-ops when module is missing', () => {
    const before = cloneDeep(emptyModulesRobot)
    const result = forVacuumSetPumpPower(
      { moduleId: missingModuleId, percentPower: 50 },
      invariantContext,
      emptyModulesRobot
    )
    expect(result.robotState).toEqual(before)
  })

  it('no-ops when module is not a vacuum module', () => {
    const robot = robotWithTemperatureModule(emptyModulesRobot)
    const before = cloneDeep(robot)
    const result = forVacuumSetPumpPower(
      { moduleId: temperatureModuleId, percentPower: 50 },
      invariantContext,
      robot
    )
    expect(result.robotState).toEqual(before)
  })
})

describe('forVacuumStopPump', () => {
  it('clears vacuumState and leaves ventStatus unchanged (open)', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: powerRun(60, VACUUM_AT_TARGET),
      ventStatus: VACUUM_VENT_OPEN,
    })

    const result = forVacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toBe(null)
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('clears vacuumState and leaves vent closed', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      vacuumState: heldPressure(400),
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.vacuumState).toBe(null)
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('is idempotent when vacuumState is already null', () => {
    const robot = robotWithVacuum(
      emptyModulesRobot,
      vacuumModuleId,
      merge({}, baseVacuumState(), { ventStatus: VACUUM_VENT_CLOSED })
    )

    const result = forVacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    expect(result.robotState.modules[vacuumModuleId].moduleState).toEqual({
      type: VACUUM_MODULE_TYPE,
      vacuumState: null,
      ventStatus: VACUUM_VENT_CLOSED,
    })
  })

  it('no-ops when module is missing or not a vacuum module', () => {
    const tempRobot = robotWithTemperatureModule(emptyModulesRobot)

    expect(
      forVacuumStopPump(
        { moduleId: missingModuleId },
        invariantContext,
        emptyModulesRobot
      ).robotState
    ).toEqual(emptyModulesRobot)

    const beforeTemp = cloneDeep(tempRobot)
    expect(
      forVacuumStopPump(
        { moduleId: temperatureModuleId },
        invariantContext,
        tempRobot
      ).robotState
    ).toEqual(beforeTemp)
  })
})
