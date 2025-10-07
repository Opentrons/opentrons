import * as errorCreators from '../../errorCreators'
import { getModuleState } from '../../robotStateSelectors'
import { curryCommandCreator, reduceCommandCreators } from '../../utils'
import { waitForTemperature } from '../atomic'
import { delay } from '../atomic/delay'
import { heaterShakerCloseLatch } from '../atomic/heaterShakerCloseLatch'
import { heaterShakerDeactivateHeater } from '../atomic/heaterShakerDeactivateHeater'
import { heaterShakerOpenLatch } from '../atomic/heaterShakerOpenLatch'
import { heaterShakerSetTargetShakeSpeed } from '../atomic/heaterShakerSetTargetShakeSpeed'
import { heaterShakerStopShake } from '../atomic/heaterShakerStopShake'
import { setTemperature } from '../atomic/setTemperature'

import type {
  CommandCreator,
  CurriedCommandCreator,
  HeaterShakerArgs,
} from '../../types'

export const heaterShaker: CommandCreator<HeaterShakerArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    timerHours,
    timerMinutes,
    timerSeconds,
    latchOpen,
    targetTemperature,
    rpm,
  } = args
  console.log('from step-gen', timerHours, timerMinutes, timerSeconds)
  if (args.moduleId == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }
  const heaterShakerState = getModuleState(prevRobotState, args.moduleId)

  const moduleId = args.moduleId ?? ''

  if (heaterShakerState == null) {
    return {
      errors: [errorCreators.missingModuleError()],
    }
  }

  const commandCreators: CurriedCommandCreator[] = []

  if (!latchOpen) {
    commandCreators.push(
      curryCommandCreator(heaterShakerCloseLatch, {
        moduleId,
      })
    )
  }

  if (targetTemperature === null) {
    commandCreators.push(
      curryCommandCreator(heaterShakerDeactivateHeater, {
        moduleId,
      })
    )
  } else {
    commandCreators.push(
      curryCommandCreator(setTemperature, {
        moduleId,
        celsius: targetTemperature,
      })
    )
  }

  if (
    rpm === null &&
    'targetSpeed' in heaterShakerState &&
    heaterShakerState.targetSpeed !== null
  ) {
    commandCreators.push(
      curryCommandCreator(heaterShakerStopShake, {
        moduleId,
      })
    )
  } else if (rpm !== null) {
    commandCreators.push(
      curryCommandCreator(heaterShakerSetTargetShakeSpeed, {
        moduleId,
        rpm,
      })
    )
  }

  const hasATime = [timerHours, timerMinutes, timerSeconds].some(
    value => value != null && value !== 0
  )

  if (hasATime) {
    if (targetTemperature !== null) {
      commandCreators.push(
        curryCommandCreator(waitForTemperature, {
          moduleId,
          celsius: targetTemperature,
        })
      )
    }

    const totalSeconds =
      (timerHours ?? 0) * 3600 + (timerMinutes ?? 0) * 60 + (timerSeconds ?? 0)
    commandCreators.push(
      curryCommandCreator(delay, {
        seconds: totalSeconds,
      })
    )
    commandCreators.push(
      curryCommandCreator(heaterShakerStopShake, {
        moduleId,
      })
    )
    commandCreators.push(
      curryCommandCreator(heaterShakerDeactivateHeater, {
        moduleId,
      })
    )
  }

  if (latchOpen) {
    commandCreators.push(
      curryCommandCreator(heaterShakerOpenLatch, {
        moduleId,
      })
    )
  }

  return reduceCommandCreators(
    commandCreators,
    invariantContext,
    prevRobotState
  )
}
