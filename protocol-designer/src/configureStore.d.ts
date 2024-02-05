import { Store } from 'redux';
import { BaseState, Action } from './types';
export type StoreType = Store<BaseState, Action>;
export declare function configureStore(): StoreType;
