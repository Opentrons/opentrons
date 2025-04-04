import { AttachedModule} from '@opentrons/api-client'
import {
    useTrackEvent, ANALYTICS_MODULE_COMMAND_ERROR, ANALYTICS_MODULE_COMMAND_COMPLETED
} from '/app/redux/analytics'
import { useModulesQuery } from '@opentrons/react-api-client'
import { ModuleOnlyParams, NINETY_SIX_CHANNEL_WASTE_CHUTE_ADDRESSABLE_AREA, TemperatureParams } from '@opentrons/shared-data'
import { Dict } from 'mixpanel-browser'
import {
    getAttachedProtocolModuleMatches,
    getProtocolModulesInfo,
} from '/app/transformations/analysis'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useMostRecentCompletedAnalysis } from '/app/resources/runs'
import {
    FLEX_ROBOT_TYPE,
    getDeckDefFromRobotType,
    RunTimeCommand
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

export type ModuleActionDetails = 
    | moduleProtocolCommand
    | moduleLiveCommand
export interface moduleProtocolCommand {
    runId: string,
    action: string,
    result: {status: string, data: any},
    params: Dict,
    errorDetails: string;
}

export interface moduleLiveCommand {
    moduleType: string,
    action: string,
    result: {status: string, data: any},
    serialNumber: string,
    temperature?: number | string,
    firmwareVersion: string
}


export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command completes. */
    reportModuleCommand: (params: ModuleActionDetails) => void;
}

export function useModuleCommandAnalytics(modules?: AttachedModule[]): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent();
    const reportModuleCommand = ({
        action,
        result, 
        errorDetails,
        ... rest
    }: ModuleActionDetails & { errorDetails?: string }): void => {
        if (!isValidCommandType(action)){
            return;
        }
        const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery()
        const moduleQuery = useModulesQuery()
        const attachedModules = moduleQuery?.data?.data ?? []
        const mostRecentAnalysis = useMostRecentCompletedAnalysis('runId' in rest ? rest.runId : null);
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

        doTrackEvent({
            name: errorDetails ? ANALYTICS_MODULE_COMMAND_ERROR : ANALYTICS_MODULE_COMMAND_COMPLETED,
            properties: {
                reportedModuleType,
                action,
                ...(errorDetails
                    ? { errorDetails }
                    : { resultStatus: result }),
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