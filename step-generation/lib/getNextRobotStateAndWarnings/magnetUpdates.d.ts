import type { EngageMagnetParams, ModuleOnlyParams } from '@opentrons/shared-data/lib/protocol/types/schemaV4';
import type { InvariantContext, RobotStateAndWarnings } from '../types';
export declare function forEngageMagnet(params: EngageMagnetParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
export declare function forDisengageMagnet(params: ModuleOnlyParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
