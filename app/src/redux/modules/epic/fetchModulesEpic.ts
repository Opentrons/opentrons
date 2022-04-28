import { ofType } from 'redux-observable'

import { GET } from '../../robot-api/constants'
import { mapToRobotApiRequest } from '../../robot-api/operators'
import {
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  TEMPERATURE_MODULE_V2,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  THERMOCYCLER_MODULE_V1,
  HEATERSHAKER_MODULE_V1,
} from '@opentrons/shared-data'

import type {
  MagneticModuleModel,
  TemperatureModuleModel,
  ThermocyclerModuleModel,
  HeaterShakerModuleModel,
} from '@opentrons/shared-data'

import * as Actions from '../actions'
import * as Constants from '../constants'

import type { Action, Epic } from '../../types'

import type {
  ActionToRequestMapper,
  ResponseToActionMapper,
} from '../../robot-api/operators'

import type { FetchModulesAction, AttachedModule } from '../types'
import type {
  ApiAttachedModule,
  TemperatureData,
  MagneticData,
  ThermocyclerData,
  HeaterShakerData,
} from '../api-types'

const mapActionToRequest: ActionToRequestMapper<FetchModulesAction> = action => ({
  method: GET,
  path: Constants.MODULES_PATH,
})

type IdentifierWithData =
  | {
      moduleType: typeof MAGNETIC_MODULE_TYPE
      moduleModel: MagneticModuleModel
      data: MagneticData
    }
  | {
      moduleType: typeof TEMPERATURE_MODULE_TYPE
      moduleModel: TemperatureModuleModel
      data: TemperatureData
    }
  | {
      moduleType: typeof THERMOCYCLER_MODULE_TYPE
      moduleModel: ThermocyclerModuleModel
      data: ThermocyclerData
    }
  | {
      moduleType: typeof HEATERSHAKER_MODULE_TYPE
      moduleModel: HeaterShakerModuleModel
      data: HeaterShakerData
    }

const normalizeModuleInfo = (
  response: ApiAttachedModule
): IdentifierWithData => {
  switch (response.moduleModel) {
    case MAGNETIC_MODULE_V1:
    case MAGNETIC_MODULE_V2:
      return {
        moduleModel: response.moduleModel,
        moduleType: MAGNETIC_MODULE_TYPE,
        data: response.data,
      }
    case TEMPERATURE_MODULE_V1:
    case TEMPERATURE_MODULE_V2:
      return {
        moduleModel: response.moduleModel,
        moduleType: TEMPERATURE_MODULE_TYPE,
        data: response.data,
      }
    case THERMOCYCLER_MODULE_V1:
      return {
        moduleModel: response.moduleModel,
        moduleType: THERMOCYCLER_MODULE_TYPE,
        data: response.data,
      }
    case HEATERSHAKER_MODULE_V1:
      return {
        moduleModel: response.moduleModel,
        moduleType: HEATERSHAKER_MODULE_TYPE,
        data: response.data,
      }
    default:
      throw new Error(`bad module model ${(response as any).moduleModel}`)
  }
}

const normalizeModuleResponse = (
  apiModule: ApiAttachedModule
): AttachedModule => {
  return {
    ...normalizeModuleInfo(apiModule),
    id: apiModule.id,
    hardwareRevision: apiModule.hardwareRevision
      ? apiModule.hardwareRevision
      : apiModule.moduleModel,
    serialNumber: apiModule.serialNumber,
    firmwareVersion: apiModule.firmwareVersion,
    hasAvailableUpdate: apiModule.hasAvailableUpdate,
    usbPort: apiModule.usbPort ?? { hub: null, port: null },
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
        body.data.map(normalizeModuleResponse),
        meta
      )
    : Actions.fetchModulesFailure(host.name, body, meta)
}

export const fetchModulesEpic: Epic = (action$, state$) => {
  return action$.pipe(
    ofType<Action, FetchModulesAction>(Constants.FETCH_MODULES),
    mapToRobotApiRequest(
      state$,
      a => a.payload.robotName,
      mapActionToRequest,
      mapResponseToAction
    )
  )
}
