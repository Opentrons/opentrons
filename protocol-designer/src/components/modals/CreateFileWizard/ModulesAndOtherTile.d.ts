/// <reference types="react" />
import { ModuleModel } from '@opentrons/shared-data';
import type { WizardTileProps } from './types';
export declare const DEFAULT_SLOT_MAP: {
    [moduleModel in ModuleModel]?: string;
};
export declare const FLEX_SUPPORTED_MODULE_MODELS: ModuleModel[];
export declare function ModulesAndOtherTile(props: WizardTileProps): JSX.Element;
