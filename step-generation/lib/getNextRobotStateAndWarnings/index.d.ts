import type { Command } from '@opentrons/shared-data/lib/protocol/types/schemaV6';
import type { InvariantContext, RobotState, RobotStateAndWarnings } from '../types';
export declare function getNextRobotStateAndWarningsSingleCommand(command: Command, invariantContext: InvariantContext, prevRobotState: RobotState): RobotStateAndWarnings;
export declare function getNextRobotStateAndWarnings(commands: Array<Command>, invariantContext: InvariantContext, initialRobotState: RobotState): RobotStateAndWarnings;
