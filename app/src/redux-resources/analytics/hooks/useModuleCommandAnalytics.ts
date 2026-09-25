import { useModulesQuery } from '@opentrons/react-api-client'

import {
  ANALYTICS_MODULE_COMMAND_COMPLETED,
  ANALYTICS_MODULE_COMMAND_ERROR,
  useTrackEvent,
} from '/app/redux/analytics'

import type { CommandData } from '@opentrons/api-client'
import type {
  CommandStatus,
  CompletedProtocolAnalysis,
  ModuleOnlyParams,
  ModuleType,
  RunTimeCommand,
  TemperatureModuleAwaitTemperatureParams,
  TemperatureParams,
  ThermocyclerSetTargetBlockTemperatureParams,
} from '@opentrons/shared-data'

const ANALYTIC_COMMAND_TYPES: Array<RunTimeCommand['commandType']> = [
  'thermocycler/closeLid',
  'thermocycler/openLid',
  'temperatureModule/setTargetTemperature',
  'thermocycler/setTargetLidTemperature',
  'thermocycler/setTargetBlockTemperature',
  'heaterShaker/setTargetTemperature',
  'thermocycler/deactivateLid',
  'thermocycler/deactivateBlock',
  'temperatureModule/deactivate',
  'magneticModule/disengage',
  'heaterShaker/deactivateShaker',
  'heaterShaker/deactivateHeater',
  'heaterShaker/openLabwareLatch',
  'heaterShaker/closeLabwareLatch',
]

export type ModuleAnalyticKind = 'protocolCommand' | 'liveCommand'

interface BaseModuleAnalytics {
  kind: ModuleAnalyticKind
  analyticCommand: RunTimeCommand | string
  result: {
    status: CommandStatus | undefined
    data: CommandData['data'] | undefined
  }
  errorDetails: string
  runId?: string | null
  analysis?: CompletedProtocolAnalysis | null
}

export interface ModuleAnalyticProtocolCommand extends BaseModuleAnalytics {
  kind: 'protocolCommand'
  runId: string | null
  analysis: CompletedProtocolAnalysis | null
  params: CommandData['data']['params'] | undefined
}

export interface ModuleAnalyticLiveCommand extends BaseModuleAnalytics {
  kind: 'liveCommand'
  moduleType: ModuleType | string
  serialNumber: string
  temperature?: number | string
  firmwareVersion: string
}

export type ModuleAnalyticType =
  ModuleAnalyticProtocolCommand | ModuleAnalyticLiveCommand

export interface UseModuleCommandAnalyticsResult {
  reportModuleCommand: (params: ModuleAnalyticType) => void
}

export function useModuleCommandAnalytics(): UseModuleCommandAnalyticsResult {
  const doTrackEvent = useTrackEvent()
  const moduleQuery = useModulesQuery()

  const reportModuleCommand = ({
    kind,
    analyticCommand,
    errorDetails,
    analysis,
    runId,
    ...rest
  }: BaseModuleAnalytics): void => {
    if (!isValidCommandType(analyticCommand)) return

    const attachedModules = moduleQuery?.data?.data ?? []

    const matchedModules = attachedModules.map(module => ({
      moduleType: module.moduleType,
      moduleId: module.id,
      serialNumber: module.serialNumber,
      firmwareVersion: module.firmwareVersion,
    }))

    const { moduleId, celsius } = isParamType(
      'params' in rest ? rest.params : null
    )

    const matchedModule = matchedModules.find(
      module => module.moduleId === moduleId
    )

    const reportedSerialNumber =
      'serialNumber' in rest
        ? rest.serialNumber
        : (matchedModule?.serialNumber ?? null)

    const reportedTemperature =
      'temperature' in rest ? rest.temperature : (celsius ?? null)

    const reportedFirmwareVersion =
      'firmwareVersion' in rest
        ? rest.firmwareVersion
        : (matchedModule?.firmwareVersion ?? null)

    const reportedModuleType =
      'moduleType' in rest
        ? rest.moduleType
        : (matchedModule?.moduleType ?? null)

    const reportedErrorDetails =
      'errorDetails' in rest ? rest.errorDetails : null

    doTrackEvent({
      name:
        reportedErrorDetails != null
          ? ANALYTICS_MODULE_COMMAND_ERROR
          : ANALYTICS_MODULE_COMMAND_COMPLETED,
      properties: {
        reportedModuleType,
        analyticCommand,
        ...(reportedErrorDetails != null ? { reportedErrorDetails } : {}),
        reportedSerialNumber,
        reportedTemperature,
        reportedFirmwareVersion,
        ...(runId != null ? { transactionId: runId } : {}), // Acts as an idempotency key for Mixpanel reporting.
      },
    })
  }

  return { reportModuleCommand }
}

function isModuleOnlyParams(params: unknown): params is ModuleOnlyParams {
  return typeof params === 'object' && params !== null && 'moduleId' in params
}

type AllTemperatureParams =
  | TemperatureModuleAwaitTemperatureParams
  | TemperatureParams
  | ThermocyclerSetTargetBlockTemperatureParams

function isTemperatureParams(params: unknown): params is AllTemperatureParams {
  return typeof params === 'object' && params !== null && 'celsius' in params
}

/* Checks param type and returns variables found */
function isParamType(params: unknown): { moduleId: string; celsius: string } {
  if (isTemperatureParams(params)) {
    return {
      moduleId: String(params.moduleId),
      celsius: String(params.celsius),
    }
  }
  if (isModuleOnlyParams(params)) {
    return { moduleId: String(params.moduleId), celsius: '' }
  }
  return { moduleId: '', celsius: '' }
}

function isValidCommandType(
  cmd: unknown
): cmd is RunTimeCommand['commandType'] {
  return (
    typeof cmd === 'string' &&
    ANALYTIC_COMMAND_TYPES.includes(cmd as RunTimeCommand['commandType'])
  )
}
