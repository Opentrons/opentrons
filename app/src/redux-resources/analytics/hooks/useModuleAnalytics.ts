import type { AttachedModule} from '@opentrons/api-client'
import { useTrackEvent, ANALYTICS_MODULE_COMMAND_ERROR, ANALYTICS_MODULE_COMMAND_COMPLETED
} from '/app/redux/analytics'
import { useModulesQuery } from '@opentrons/react-api-client'
import type { CommandStatus, ModuleOnlyParams, ModuleType, TemperatureParams, RunTimeCommand} from '@opentrons/shared-data'
import type {CommandData} from '@opentrons/api-client'
import {
    getAttachedProtocolModuleMatches,
    getProtocolModulesInfo,
} from '/app/transformations/analysis'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import {
    FLEX_ROBOT_TYPE,
    getDeckDefFromRobotType,
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
    'heaterShaker/closeLabwareLatch' 
];

export type ModuleAnalyticKind = 'protocolCommand' | 'liveCommand'

interface BaseModuleAnalytics {
    kind: ModuleAnalyticKind,
    analyticCommand: RunTimeCommand | string,
    result: {status: CommandStatus | undefined; data: CommandData['data'] | undefined},
    errorDetails: string;
}
export interface ModuleAnalyticProtocolCommand extends BaseModuleAnalytics {
    kind: 'protocolCommand'
    runId: string,
    params: CommandData['data']['params'] | undefined,

}

export interface ModuleAnalyticLiveCommand extends BaseModuleAnalytics {
    kind: 'liveCommand'
    moduleType: ModuleType | string,
    serialNumber: string,
    temperature?: number | string,
    firmwareVersion: string,

}

export type ModuleAnalyticType =
  | ModuleAnalyticProtocolCommand
  | ModuleAnalyticLiveCommand

export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command completes. */
    reportModuleCommand: (params: ModuleAnalyticType) => void;
}

const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery()
const moduleQuery = useModulesQuery()

export function useModuleCommandAnalytics(modules?: AttachedModule[]): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent();
    const reportModuleCommand = ({
        kind,
        analyticCommand, 
        errorDetails,
        ... rest
    }: BaseModuleAnalytics): void => {
        if (!isValidCommandType(analyticCommand)){
            return;
        }
        const attachedModules = moduleQuery?.data?.data ?? []
        const mostRecentAnalysis = useMostRecentCompletedAnalysis('runId' in rest && typeof rest.runId === 'string' ? rest.runId : null);
        const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
        const protocolModulesInfo =
            mostRecentAnalysis != null
            ? getProtocolModulesInfo(mostRecentAnalysis, deckDef)
            : []
        const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
            attachedModules,
            protocolModulesInfo,
            deckConfig
        )
        const matchedModules = attachedProtocolModuleMatches.map(module=> ({
            moduleType: module.attachedModuleMatch?.moduleType,
            moduleId: module.attachedModuleMatch?.id,
            serialNumber: module.attachedModuleMatch?.serialNumber,
            firmwareVersion: module.attachedModuleMatch?.firmwareVersion
        }))
        const { moduleId, celsius } = isParamType('params' in rest ? rest.params: null);
        const matchedModule = matchedModules.find(module => module.moduleId === moduleId);
        const reportedSerialNumber = 'serialNumber' in rest ? rest.serialNumber : matchedModule?.serialNumber ?? null;
        const reportedTemperature = 'temperature' in rest ? rest.temperature : celsius ?? null;
        const reportedFirmwareVersion = 'firmwareVersion' in rest ? rest.firmwareVersion : matchedModule?.firmwareVersion ?? null
        const reportedModuleType = 'moduleType' in rest ? rest.moduleType : matchedModule?.moduleType ?? null
        const reportedErrorDetails = 'errorDetails' in rest ? rest.errorDetails : null
        doTrackEvent({
            name: reportedErrorDetails ? ANALYTICS_MODULE_COMMAND_ERROR : ANALYTICS_MODULE_COMMAND_COMPLETED,
            properties: {
                reportedModuleType,
                analyticCommand,
                ...(reportedErrorDetails
                    ? { reportedErrorDetails }
                    : { resultStatus: 'result' in rest ? rest.result: null}),
                serialNumber: reportedSerialNumber,
                reportedTemperature,
                reportedFirmwareVersion
            },
        });
    };

    return { reportModuleCommand };
}

function isModuleOnlyParams(params: any): params is ModuleOnlyParams {
    return params && typeof params === "object" && "moduleId" in params;
}

function isTemperatureParams(params: any): params is TemperatureParams {
    return params && typeof params === "object" && "celsius" in params;
}

/* Checks param type and returns variables found */
function isParamType(params: any): { moduleId: string; celsius: string } {
    if (isModuleOnlyParams(params)) {
        return { moduleId: String(params.moduleId), celsius: "" };
    }
    if (isTemperatureParams(params)) {
        return { moduleId: String(params.moduleId), celsius: String(params.celsius) };
    }
    return { moduleId: "", celsius: "" }; 
}

function isValidCommandType(cmd: any): cmd is RunTimeCommand['commandType'] {
    return typeof cmd === 'string' && ANALYTIC_COMMAND_TYPES.includes(cmd as RunTimeCommand['commandType']);
  }