import { AnalyticsEvent } from './mixpanel';
import { Middleware } from 'redux';
import { BaseState } from '../types';
export declare const reduxActionToAnalyticsEvent: (state: BaseState, action: any) => AnalyticsEvent | null;
export declare const trackEventMiddleware: Middleware<BaseState, any>;
