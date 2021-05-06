import type { InvariantContext, RobotState, Timeline, CurriedCommandCreator } from '../types';
export declare const commandCreatorsTimeline: (commandCreators: CurriedCommandCreator[], invariantContext: InvariantContext, initialRobotState: RobotState) => Timeline;
