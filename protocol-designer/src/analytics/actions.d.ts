import { AnalyticsEvent } from './mixpanel';
export interface SetOptIn {
    type: 'SET_OPT_IN';
    payload: boolean;
}
export declare const optIn: () => SetOptIn;
export declare const optOut: () => SetOptIn;
export interface AnalyticsEventAction {
    type: 'ANALYTICS_EVENT';
    payload: AnalyticsEvent;
    meta?: unknown;
}
export declare const analyticsEvent: (payload: AnalyticsEvent) => AnalyticsEventAction;
