import type { RobotState, RobotStateAndWarnings, InvariantContext } from '../';
export declare type ImmutableStateUpdater<P> = (params: P, invariantContext: InvariantContext, robotState: RobotState) => RobotStateAndWarnings;
export declare type MutableStateUpdater<P> = (params: P, invariantContext: InvariantContext, robotStateAndWarnings: RobotStateAndWarnings) => void;
export declare function makeImmutableStateUpdater<P>(commandFn: MutableStateUpdater<P>): ImmutableStateUpdater<P>;
