import { Store } from 'redux';
export interface RehydratePersistedAction {
    type: 'REHYDRATE_PERSISTED';
    payload: {
        'tutorial.dismissedHints'?: Record<string, any>;
        'featureFlags.flags'?: Record<string, any>;
        'analytics.hasOptedIn'?: boolean | null;
    };
}
export declare const getLocalStorageItem: (path: string) => unknown;
export declare const _rehydrate: (path: string) => any;
export declare const _rehydrateAll: () => RehydratePersistedAction['payload'];
export declare const rehydratePersistedAction: () => RehydratePersistedAction;
export declare const localStorageAnnouncementKey = "announcementKey";
export declare const setLocalStorageItem: (path: string, value: any) => void;
export declare const getPrereleaseFeatureFlag: (value: string) => boolean;
/** Subscribe this fn to the Redux store to persist selected substates */
type PersistSubscriber = () => void;
export declare const makePersistSubscriber: (store: Store<any, any>) => PersistSubscriber;
export {};
