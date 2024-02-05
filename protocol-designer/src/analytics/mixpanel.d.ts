import { BaseState } from '../types';
export type AnalyticsEvent = {
    name: string;
    properties: {
        [key: string]: unknown;
    };
    superProperties?: {
        [key: string]: unknown;
    };
} | {
    superProperties: {
        [key: string]: unknown;
    };
};
export declare function initializeMixpanel(state: BaseState): void;
export declare function trackEvent(event: AnalyticsEvent, optedIn: boolean): void;
export declare function setMixpanelTracking(optedIn: boolean): void;
