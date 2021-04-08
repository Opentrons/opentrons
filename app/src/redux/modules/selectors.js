// @flow
import { createSelector } from 'reselect'
import sortBy from 'lodash/sortBy'

import { selectors as RobotSelectors } from '../robot'
import * as Copy from './i18n'
import * as Types from './types'

import type { State } from '../types'
import type { SessionModule } from '../robot/types'
import { PREPARABLE_MODULE_TYPES } from './constants'
import {
  THERMOCYCLER_MODULE_TYPE,
  getModuleType,
  checkModuleCompatibility,
} from '@opentrons/shared-data'

export { getModuleType } from '@opentrons/shared-data'

export const getAttachedModules: (
  state: State,
  robotName: string | null
) => Array<Types.AttachedModule> = createSelector(
  (state, robotName) =>
    robotName !== null ? state.modules[robotName]?.modulesById : {},
  // sort by usbPort info, if they do not exist (robot version below 4.3), sort by serial
  modulesByPort =>
    sortBy(modulesByPort, ['usbPort.hub', 'usbPort.port', 'serial'])
)

export const getAttachedModulesForConnectedRobot = (
  state: State
): Array<Types.AttachedModule> => {
  const robotName = RobotSelectors.getConnectedRobotName(state)
  return getAttachedModules(state, robotName)
}

const isModulePrepared = (module: Types.AttachedModule): boolean => {
  if (module.type === THERMOCYCLER_MODULE_TYPE)
    return module.data.lid === 'open'
  return false
}

export const getUnpreparedModules: (
  state: State
) => Array<Types.AttachedModule> = createSelector(
  getAttachedModulesForConnectedRobot,
  RobotSelectors.getModules,
  (attachedModules, protocolModules) => {
    const preparableSessionModules = protocolModules
      .filter(m => PREPARABLE_MODULE_TYPES.includes(getModuleType(m.model)))
      .map(m => m.model)

    // return actual modules that are both
    // a) required to be prepared by the session
    // b) not prepared according to isModulePrepared
    return attachedModules.filter(
      m => preparableSessionModules.includes(m.model) && !isModulePrepared(m)
    )
  }
)

export const getMatchedModules: (
  state: State
) => Array<Types.MatchedModule> = createSelector(
  getAttachedModulesForConnectedRobot,
  RobotSelectors.getModules,
  (attachedModules, protocolModules) => {
    const matchedAmod: Array<Types.MatchedModule> = []
    const matchedPmod = []
    protocolModules.forEach(pmod => {
      const compatible =
        attachedModules.find(
          amod =>
            checkModuleCompatibility(amod.model, pmod.model) &&
            !matchedAmod.find(m => m.module === amod)
        ) ?? null
      if (compatible !== null) {
        matchedPmod.push(pmod)
        matchedAmod.push({ slot: pmod.slot, module: compatible })
      }
    })
    return matchedAmod
  }
)

export const getMissingModules: (
  state: State
) => Array<SessionModule> = createSelector(
  getAttachedModulesForConnectedRobot,
  RobotSelectors.getModules,
  (attachedModules, protocolModules) => {
    const matchedAmod = []
    const matchedPmod = []
    protocolModules.forEach(pmod => {
      const compatible = attachedModules.find(
        amod =>
          checkModuleCompatibility(amod.model, pmod.model) &&
          !matchedAmod.includes(amod)
      )
      if (compatible) {
        matchedPmod.push(pmod)
        matchedAmod.push(compatible)
      }
    })
    return protocolModules.filter(m => !matchedPmod.includes(m))
  }
)

// selector to return a reason for module control being disabled if they
// should be disabled. Omit `robotName` arg to refer to currently connected
// RPC robot
export const getModuleControlsDisabled = (
  state: State,
  robotName?: string
): null | string => {
  const connectedRobotName = RobotSelectors.getConnectedRobotName(state)
  const protocolIsRunning = RobotSelectors.getIsRunning(state)

  if (
    connectedRobotName === null ||
    (robotName != null && connectedRobotName !== robotName)
  ) {
    return Copy.CONNECT_FOR_MODULE_CONTROL
  }

  if (protocolIsRunning) {
    return Copy.CANNOT_CONTROL_MODULE_WHILE_RUNNING
  }

  return null
}
