import { AttachedModule} from '@opentrons/api-client'
import {
    useTrackEvent, ANALYTICS_MODULE_COMMAND_ERROR, ANALYTICS_MODULE_COMMAND_COMPLETED
} from '/app/redux/analytics'
import { useModulesQuery } from '@opentrons/react-api-client'
import { ModuleOnlyParams, TemperatureParams } from '@opentrons/shared-data'
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
  } from '@opentrons/shared-data'
const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

// List of commands that will be recorded
const commandType = [
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
    'heatershaker/closeLabwareLatch' 
];

// variables needed to detect find matching modules
const MODULE_REFETCH_INTERVAL_MS = 5000
const DECK_CONFIG_POLL_MS = 5000

export interface ReportModuleActionParams {
    runId?: string | null;
    moduleType?: string | Dict | null;
    firmwareVersion?: string | null;
    action?: string;
    result?: { status: string| undefined; data: any  }; 
    errorDetails?: string ; 
    serialNumber?: string | Dict | null;
    temperature?: number | null | Dict | string ;
    params?: Dict | null| undefined;
}

export interface UseModuleCommandAnalyticsResult {
    /* Report when a module command completes. */
    reportModuleCommand: (params: ReportModuleActionParams) => void;
}

// Define type guards to check the structure of params
function isModuleOnlyParams(params: any): params is ModuleOnlyParams {
    return params && typeof params === "object" && "moduleId" in params;
}

function isTemperatureParams(params: any): params is TemperatureParams {
    return params && typeof params === "object" && "celsius" in params;
}

function isParamType(params: any): { moduleId: string; celsius: string } {
    // Checks param type and returns variables found
    if (isModuleOnlyParams(params)) {
        return { moduleId: String(params.moduleId), celsius: "" };
    }
    if (isTemperatureParams(params)) {
        return { moduleId: String(params.moduleId), celsius: String(params.celsius) };
    }
    return { moduleId: "", celsius: "" }; // Default return for unexpected cases
}

export function useModuleCommandAnalytics(modules?: AttachedModule[]): UseModuleCommandAnalyticsResult {
    const doTrackEvent = useTrackEvent();
    const reportModuleCommand = ({
        runId,
        moduleType,
        action,
        result,
        errorDetails,
        serialNumber,
        temperature,
        params,
        firmwareVersion
    }: ReportModuleActionParams & { errorDetails?: string }): void => {
        if (typeof action !== 'string' || !commandType.includes(action)) {
            return; // Exit early if action is invalid or not in the commandType array
        }
        // Ensure params is either ModuleOnlyParams or TemperatureParams before processing
        if (typeof params != null){
            if (!isModuleOnlyParams(params) && !isTemperatureParams(params)) {
                console.warn("Unexpected params format:", params);
                temperature = "UNKNOWN"
                serialNumber = "UNKNOWN"
            }
            else if(typeof runId == 'string'){
                // If runId is passed, find moduleId serialNumber match
                const { data: deckConfig = [] } = useNotifyDeckConfigurationQuery({
                    refetchInterval: DECK_CONFIG_POLL_MS,
                })
                const moduleQuery = useModulesQuery({
                    refetchInterval: MODULE_REFETCH_INTERVAL_MS,
                })
                const attachedModules = moduleQuery?.data?.data ?? []
                const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
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
                    moduleModel: module.attachedModuleMatch?.moduleType,
                    moduleId: module.attachedModuleMatch?.id,
                    serialNumber: module.attachedModuleMatch?.serialNumber,
                    firmwareVersion: module.attachedModuleMatch?.firmwareVersion
                }))
                // Extract moduleId and temp
                const { moduleId, celsius } = isParamType(params);
                // update temperature
                temperature = celsius !== "" ? celsius : temperature;
                // Find the matched module serial number based on moduleId
                const matchedModule = matchedModules.find(module => module.moduleId === moduleId);
                // Use the matched module's serialNumber if available, otherwise keep serialNumber unchanged
                serialNumber = serialNumber ?? matchedModule?.serialNumber;
                }
            }       
        // Track Event
        doTrackEvent({
            name: errorDetails ? ANALYTICS_MODULE_COMMAND_ERROR : ANALYTICS_MODULE_COMMAND_COMPLETED,
            properties: {
                moduleType,
                action,
                ...(errorDetails
                    ? { errorDetails }
                    : { resultStatus: result }),
                serialNumber: serialNumber || 'UNKNOWN',
                temperature,
                firmwareVersion
            },
        });
    };

    return { reportModuleCommand };
}
