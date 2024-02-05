import { Action, Reducer } from 'redux';
export type GetNextState<S, A extends Action> = (args: {
    action: A;
    state: S;
    prevStateFallback: S;
}) => S;
export declare function nestedCombineReducers<S extends Record<string, any>, A extends Action>(getNextState: GetNextState<S, A>): Reducer<S, A>;
