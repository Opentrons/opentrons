import type { DispenseParams } from '@opentrons/shared-data/lib/protocol/types/schemaV3';
import type { InvariantContext, RobotStateAndWarnings } from '../types';
export declare function forDispense(params: DispenseParams, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings): void;
