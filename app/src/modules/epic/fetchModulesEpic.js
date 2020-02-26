// @flow
import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import {
  MAGDECK,
  TEMPDECK,
  THERMOCYCLER,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import type { MagneticModuleModel, TemperatureModuleModel, ThermocyclerModuleModel } from '@opentrons/shared-data'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchModulesAction, AttachedModule } from '../types'
import type {
  ApiAttachedModule,
  ApiAttachedModuleLegacy,
  TemperatureData,
  MagneticData,
  ThermocyclerData,
  TemperatureStatus,
  MagneticStatus,
  ThermocyclerStatus,
} from '../api-types'

const mapActionToRequest: ActionToRequestMapper<FetchModulesAction> = action => ({
  method: GET,
  path: Constants.MODULES_PATH,
})

type IdentifierWithData =
  | {|
      type: typeof MAGNETIC_MODULE_TYPE,
      model: MagneticModuleModel,
      data: MagneticData,
      status: MagneticStatus,
    |}
  | {|
      type: typeof TEMPERATURE_MODULE_TYPE,
      model: TemperatureModuleModel,
      data: TemperatureData,
      status: TemperatureStatus,
    |}
  | {|
      type: typeof THERMOCYCLER_MODULE_TYPE,
      model: ThermocyclerModuleModel,
      data: ThermocyclerData,
      status: ThermocyclerStatus,
    |}

const normalizeModuleInfoLegacy = (
  response: ApiAttachedModuleLegacy
): IdentifierWithData => {
  switch (response.name) {
    case MAGDECK:
      return {
        type: MAGNETIC_MODULE_TYPE,
        model: MAGNETIC_MODULE_V1,
        data: (response.data: MagneticData),
        status: (response.status: MagneticStatus),
      }
    case TEMPDECK:
      return {
        type: TEMPERATURE_MODULE_TYPE,
        model: TEMPERATURE_MODULE_V1,
        data: (response.data: TemperatureData),
        status: (response.status: TemperatureStatus),
      }
    case THERMOCYCLER:
      return {
        type: THERMOCYCLER_MODULE_TYPE,
        model: THERMOCYCLER_MODULE_V1,
        data: (response.data: ThermocyclerData),
        status: (response.status: ThermocyclerStatus),
      }
    default:
      throw new Error(`bad module name ${response.name}`)
  }
}

const normalizeModuleInfoNew = (
  response: ApiAttachedModule
): IdentifierWithData => {
  switch (response.moduleModel) {
    case MAGNETIC_MODULE_V1:
    case MAGNETIC_MODULE_V2:
      return {
        model: response.moduleModel,
        type: MAGNETIC_MODULE_TYPE,
        data: (response.data: MagneticData),
        status: (response.status: MagneticStatus),
      }
    case TEMPERATURE_MODULE_V1:
    case TEMPERATURE_MODULE_V2:
      return {
        model: response.moduleModel,
        type: TEMPERATURE_MODULE_TYPE,
        data: (response.data: TemperatureData),
        status: (response.status: TemperatureStatus),
      }
    case THERMOCYCLER_MODULE_V1:
      return {
        model: response.moduleModel,
        type: THERMOCYCLER_MODULE_TYPE,
        data: (response.data: ThermocyclerData),
        status: (response.status: ThermocyclerStatus),
      }
    default:
      throw new Error(`bad module model ${response.moduleModel}`)
  }
}

const normalizeModuleInfo = (
  response: ApiAttachedModule | ApiAttachedModuleLegacy
): IdentifierWithData => {
  if (response.moduleModel) {
    return normalizeModuleInfoNew(response)
  } else {
    return normalizeModuleInfoLegacy(response)
  }
}

const normalizeModuleResponse = (
  response: ApiAttachedModule
): AttachedModule => {
  return {
    ...normalizeModuleInfo(response),
    revision: response.revision ? response.revision : response.model,
    port: response.port,
    serial: response.serial,
    fwVersion: response.fwVersion,
    hasAvailableUpdate: response.hasAvailableUpdate,
  }
}

const mapResponseToAction: ResponseToActionMapper<FetchModulesAction> = (
  response,
  originalAction
) => {
  const { host, body, ...responseMeta } = response
  const meta = { ...originalAction.meta, response: responseMeta }
  return response.ok
    ? Actions.fetchModulesSuccess(
        host.name,
        body.modules.map(normalizeModuleResponse),
        meta
      )
    : Actions.fetchModulesFailure(host.name, body, meta)
}

export const fetchModulesEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType(Constants.FETCH_MODULES),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
