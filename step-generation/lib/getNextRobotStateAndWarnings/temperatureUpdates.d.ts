import type { TemperatureParams, ModuleOnlyParams } from '@opentrons/shared-data/lib/protocol/types/schemaV4';
import type { InvariantContext, RobotStateAndWarnings } from '../types';
export declare function forSetTemperature(params: TemperatureParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
export declare function forAwaitTemperature(params: TemperatureParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
export declare function forDeactivateTemperature(params: ModuleOnlyParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
