import { CreateCommand, NozzleConfigurationStyle } from '@opentrons/shared-data';
import { Channels } from '@opentrons/components';
import type { CurriedCommandCreator, InvariantContext, RobotState } from '@opentrons/step-generation';
import type { SubstepTimelineFrame, TipLocation } from './types';
/** Return last picked up tip in the specified commands, if any */
export declare function _getNewActiveTips(commands: CreateCommand[]): TipLocation | null | undefined;
export declare const substepTimelineSingleChannel: (commandCreator: CurriedCommandCreator, invariantContext: InvariantContext, initialRobotState: RobotState) => SubstepTimelineFrame[];
export declare const substepTimelineMultiChannel: (commandCreator: CurriedCommandCreator, invariantContext: InvariantContext, initialRobotState: RobotState, channels: Channels, nozzles: NozzleConfigurationStyle | null) => SubstepTimelineFrame[];
export declare const substepTimeline: (commandCreator: CurriedCommandCreator, invariantContext: InvariantContext, initialRobotState: RobotState, channels: Channels, nozzles: NozzleConfigurationStyle | null) => SubstepTimelineFrame[];
