import type { InvariantContext, RobotState, CommandCreatorResult, CurriedCommandCreator } from '../types';
export declare const reduceCommandCreators: (commandCreators: Array<CurriedCommandCreator>, invariantContext: InvariantContext, initialRobotState: RobotState) => CommandCreatorResult;
