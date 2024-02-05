import type { ModuleType } from '@opentrons/shared-data';
import type { FormModulesByType } from '../../../step-forms';
import type { FormState } from './types';
export declare const FLEX_TRASH_DEFAULT_SLOT = "cutoutA3";
export declare const getLastCheckedEquipment: (values: FormState) => string | null;
export declare const getCrashableModuleSelected: (modules: FormModulesByType, moduleType: ModuleType) => boolean;
export declare const getTrashBinOptionDisabled: (values: FormState) => boolean;
export declare const MOVABLE_TRASH_CUTOUTS: {
    value: string;
    slot: string;
}[];
export declare const getTrashSlot: (values: FormState) => string;
