import type { OutputSelector } from 'reselect';
import type { NozzleConfigurationStyle } from '@opentrons/shared-data';
import type { RootState as Analytics } from './analytics';
import type { RootState as Dismiss } from './dismiss';
import type { RootState as FileData } from './file-data';
import type { RootState as FeatureFlags } from './feature-flags';
import type { RootState as LabwareIngred } from './labware-ingred/reducers';
import type { RootState as LoadFile } from './load-file';
import type { RootState as Navigation } from './navigation';
import type { RootState as StepForms } from './step-forms';
import type { RootState as Tutorial } from './tutorial';
import type { RootState as UI } from './ui';
import type { RootState as WellSelection } from './well-selection/reducers';
export interface BaseState {
    analytics: Analytics;
    dismiss: Dismiss;
    fileData: FileData;
    featureFlags: FeatureFlags;
    labwareIngred: LabwareIngred;
    loadFile: LoadFile;
    navigation: Navigation;
    stepForms: StepForms;
    tutorial: Tutorial;
    ui: UI;
    wellSelection: WellSelection;
}
export type GetState = () => BaseState;
export type Selector<T> = (arg: BaseState) => T;
export type MemoizedSelector<T> = OutputSelector<BaseState, void, T>;
export type ThunkDispatch<A> = (action: A | ThunkAction<A>) => A;
export type ThunkAction<A> = ((dispatch: ThunkDispatch<A>, getState: GetState) => A) | ((dispatch: ThunkDispatch<A>, getState: GetState) => void);
export interface Action {
    type: string;
    payload?: unknown;
    metadata?: unknown;
}
export type WellVolumes = Record<string, number>;
export type DeckSlot = string;
export type NozzleType = NozzleConfigurationStyle | '8-channel';
