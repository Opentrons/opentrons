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
  forVacuumStartRunProfile as _forVacuumStartRunProfile,
  forVacuumStopPump as _forVacuumStopPump,
  handleWaitForTaskForVacuums,
} from '../vacuumUpdates'

import type {
  VacuumModuleSetTargetPressureCreateCommand,
  VacuumModuleStartRunProfileCreateCommand,
} from '@opentrons/shared-data'
import type {
  InvariantContext,
  RobotState,
  VacuumModuleState,
} from '../../types'

const forVacuumOpenVent = makeImmutableStateUpdater(_forVacuumOpenVent)
const forVacuumCloseVent = makeImmutableStateUpdater(_forVacuumCloseVent)
const forVacuumSetPumpPressure = makeImmutableStateUpdater(
  _forVacuumSetPumpPressure
)
const forVacuumSetPumpPower = makeImmutableStateUpdater(_forVacuumSetPumpPower)
const forVacuumStopPump = makeImmutableStateUpdater(_forVacuumStopPump)
const forVacuumStartRunProfile = makeImmutableStateUpdater(
  _forVacuumStartRunProfile
)

const vacuumModuleId = 'vacuumModuleId'
const otherVacuumModuleId = 'otherVacuumModuleId'
const missingModuleId = 'missingVacuumModuleId'
const temperatureModuleId = 'temperatureModuleId'
const vacuumTaskId = 'vacuum-task-1'

const baseVacuumState = (): VacuumModuleState => ({
  type: VACUUM_MODULE_TYPE,
  ventStatus: null,
  numPumpActivitiesStarted: 0,
  currentPumpActivity: { type: 'pumpDeactivated' },
})

/** Matches `forVacuumSetPumpPressure` / `forVacuumSetPumpPower` hold branch */
const heldPressure = (targetPressure: number) => ({
  type: 'indefiniteHold',
  mode: VACUUM_MODE_PRESSURE,
  targetPressure,
})

const heldPower = (targetPower: number) => ({
  type: 'indefiniteHold',
  mode: VACUUM_MODE_POWER,
  targetPower,
})

const timedPressureHold = (
  targetPressure: number,
  durationSeconds: number,
  taskId: string = vacuumTaskId,
  ventAfter: boolean = true
) => ({
  type: 'timedHold' as const,
  mode: VACUUM_MODE_PRESSURE,
  targetPressure,
  durationSeconds,
  taskId,
  ventAfter,
})

const timedPowerHold = (
  targetPower: number,
  durationSeconds: number,
  taskId: string = vacuumTaskId,
  ventAfter: boolean = true
) => ({
  type: 'timedHold' as const,
  mode: VACUUM_MODE_POWER,
  targetPower,
  durationSeconds,
  taskId,
  ventAfter,
})

const pumpDeactivated = { type: 'pumpDeactivated' as const }

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
  targetPressure: number
): NonNullable<VacuumModuleState['currentPumpActivity']> {
  return {
    type: 'indefiniteHold',
    mode: VACUUM_MODE_PRESSURE,
    targetPressure,
  }
}

function powerRun(
  targetPower: number
): NonNullable<VacuumModuleState['currentPumpActivity']> {
  return {
    type: 'indefiniteHold',
    mode: VACUUM_MODE_POWER,
    targetPower,
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
  it('opens vent without changing currentPumpActivity (including prior power run)', () => {
    const priorActivity = powerRun(50)
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: priorActivity,
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
    expect(updated.currentPumpActivity).toEqual(priorActivity)
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
    const currentPumpActivity = pressureRun(100)
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity,
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
    expect(updated.currentPumpActivity).toEqual(currentPumpActivity)
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
  it('holds target with vent closed when duration is omitted (indefinite hold)', () => {
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
    expect(updated.currentPumpActivity).toEqual(heldPressure(250))
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
    expect(updated.currentPumpActivity).toEqual(heldPressure(99))
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
    expect(updated.currentPumpActivity).toEqual(heldPressure(100))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('uses timed hold with vent closed and increments numPumpActivitiesStarted when duration and taskId are set', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: pressureRun(50),
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumSetPumpPressure(
      {
        moduleId: vacuumModuleId,
        gaugePressure: 200,
        duration: 10,
        taskId: vacuumTaskId,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.currentPumpActivity).toEqual(
      timedPressureHold(200, 10, vacuumTaskId)
    )
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
    expect(updated.numPumpActivitiesStarted).toBe(1)
  })

  it('treats duration with omitted taskId as indefinite hold with vent closed', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: powerRun(75),
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
    expect(updated.currentPumpActivity).toEqual(heldPressure(300))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
    expect(updated.numPumpActivitiesStarted).toBe(0)
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
    expect(updated.currentPumpActivity).toEqual(heldPower(percentPower))
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
    expect(updated.currentPumpActivity).toEqual(heldPower(33))
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('uses timed hold with vent closed when duration and taskId are set', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: pressureRun(10),
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumSetPumpPower(
      {
        moduleId: vacuumModuleId,
        percentPower: 80,
        duration: 5,
        ventAfter: true,
        taskId: vacuumTaskId,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.currentPumpActivity).toEqual(
      timedPowerHold(80, 5, vacuumTaskId)
    )
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
    expect(updated.numPumpActivitiesStarted).toBe(1)
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
  it('sets pump deactivated and opens vent when vent was already open', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: powerRun(60),
      ventStatus: VACUUM_VENT_OPEN,
    })

    const result = forVacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.currentPumpActivity).toEqual(pumpDeactivated)
    expect(updated.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('sets pump deactivated and opens vent when vent was closed', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: {
        type: 'indefiniteHold',
        mode: VACUUM_MODE_PRESSURE,
        targetPressure: 400,
      },
      ventStatus: VACUUM_VENT_CLOSED,
    })

    const result = forVacuumStopPump(
      { moduleId: vacuumModuleId },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.currentPumpActivity).toEqual(pumpDeactivated)
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('is idempotent for pumpDeactivated activity and still opens vent', () => {
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
      currentPumpActivity: pumpDeactivated,
      ventStatus: VACUUM_VENT_CLOSED,
      numPumpActivitiesStarted: 0,
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

const sampleVacuumProfile: VacuumModuleStartRunProfileCreateCommand['params']['steps'] =
  [
    {
      enablePump: true,
      holdSeconds: 2,
      gaugePressureMbar: 150,
      ventAfter: false,
    },
  ]

describe('forVacuumStartRunProfile', () => {
  it('sets profile activity and increments numPumpActivitiesStarted when module and taskId are present', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      currentPumpActivity: powerRun(60),
      ventStatus: VACUUM_VENT_CLOSED,
      numPumpActivitiesStarted: 0,
    })

    const result = forVacuumStartRunProfile(
      {
        moduleId: vacuumModuleId,
        steps: sampleVacuumProfile,
        taskId: vacuumTaskId,
      },
      invariantContext,
      robot
    )

    const updated = result.robotState.modules[vacuumModuleId]
      .moduleState as VacuumModuleState
    expect(updated.currentPumpActivity).toEqual({
      type: 'profile',
      profileElements: sampleVacuumProfile,
      taskId: vacuumTaskId,
      ventAfter: true,
    })
    expect(updated.numPumpActivitiesStarted).toBe(1)
    expect(updated.ventStatus).toBe(VACUUM_VENT_CLOSED)
  })

  it('no-ops when module is missing or taskId is null', () => {
    const robot = robotWithVacuum(emptyModulesRobot, vacuumModuleId, {
      ...baseVacuumState(),
      numPumpActivitiesStarted: 2,
    })
    const before = cloneDeep(robot)

    expect(
      forVacuumStartRunProfile(
        {
          moduleId: missingModuleId,
          steps: sampleVacuumProfile,
          taskId: vacuumTaskId,
        },
        invariantContext,
        emptyModulesRobot
      ).robotState
    ).toEqual(emptyModulesRobot)

    const paramsWithNullTask = {
      moduleId: vacuumModuleId,
      profile: sampleVacuumProfile,
      taskId: null,
    } as unknown as VacuumModuleStartRunProfileCreateCommand['params']

    expect(
      forVacuumStartRunProfile(paramsWithNullTask, invariantContext, before)
        .robotState
    ).toEqual(before)
  })
})

describe('handleWaitForTaskForVacuums', () => {
  it('returns true, deactivates pump, and opens vent when completing a profile with ventAfter true', () => {
    const moduleState: VacuumModuleState = {
      ...baseVacuumState(),
      ventStatus: VACUUM_VENT_CLOSED,
      currentPumpActivity: {
        type: 'profile',
        profileElements: sampleVacuumProfile,
        taskId: vacuumTaskId,
        ventAfter: true,
      },
    }

    const handled = handleWaitForTaskForVacuums(moduleState)

    expect(handled).toBe(true)
    expect(moduleState.currentPumpActivity).toEqual(pumpDeactivated)
    expect(moduleState.ventStatus).toBe(VACUUM_VENT_OPEN)
  })

  it('returns false and does not change activity or vent for indefinite hold', () => {
    const activity = pressureRun(88)
    const moduleState: VacuumModuleState = {
      ...baseVacuumState(),
      ventStatus: VACUUM_VENT_CLOSED,
      currentPumpActivity: activity,
    }
    const snapshot = cloneDeep(moduleState)

    const handled = handleWaitForTaskForVacuums(moduleState)

    expect(handled).toBe(false)
    expect(moduleState).toEqual(snapshot)
  })
})
