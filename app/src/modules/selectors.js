// @flow
import { createSelector } from 'reselect'
import sortBy from 'lodash/sortBy'
import countBy from 'lodash/countBy'

import { selectors as RobotSelectors } from '../robot'
import * as Copy from './i18n'
import * as Types from './types'

import type { State } from '../types'
import type { SessionModule } from '../robot/types'
import { PREPARABLE_MODULES, THERMOCYCLER } from './constants'

export const getAttachedModules: (
  state: State,
  robotName: string | null
) => Array<Types.AttachedModule> = createSelector(
  (state, robotName) =>
    robotName !== null ? state.modules[robotName]?.modulesById : {},
  modulesById => sortBy(modulesById, 'serial')
)

export const getAttachedModulesForConnectedRobot = (
  state: State
): Array<Types.AttachedModule> => {
  const robotName = RobotSelectors.getConnectedRobotName(state)
  return getAttachedModules(state, robotName)
}

const isModulePrepared = (module: Types.AttachedModule): boolean => {
  if (module.name === THERMOCYCLER) return module.data.lid === 'open'
  return false
}

export const getUnpreparedModules: (
  state: State
) => Array<Types.AttachedModule> = createSelector(
  getAttachedModulesForConnectedRobot,
  RobotSelectors.getModules,
  (attachedModules, protocolModules) => {
    const preparableSessionModules = protocolModules
      .filter(m => PREPARABLE_MODULES.includes(m.name))
      .map(m => m.name)

    // return actual modules that are both
    // a) required to be prepared by the session
    // b) not prepared according to isModulePrepared
    return attachedModules.filter(
      m => preparableSessionModules.includes(m.name) && !isModulePrepared(m)
    )
  }
)

export const getMissingModules: (
  state: State
) => Array<SessionModule> = createSelector(
  getAttachedModulesForConnectedRobot,
  RobotSelectors.getModules,
  (attachedModules, protocolModules) => {
    const requiredCountMap: { [string]: number } = countBy(
      protocolModules,
      'name'
    )
    const actualCountMap: { [string]: number } = countBy(
      attachedModules,
      'name'
    )

    return protocolModules.filter(
      m => requiredCountMap[m.name] > (actualCountMap[m.name] || 0)
    )
  }
)

// selector to return a reason for module control being disabled if they
// should be disabled. Omit `robotName` arg to refer to currently connected
// RPC robot
export const getModuleControlsDisabled = (state: State, robotName?: string) => {
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
