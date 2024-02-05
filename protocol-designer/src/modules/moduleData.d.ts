import { ModuleType, RobotType } from '@opentrons/shared-data';
import { DropdownOption } from '@opentrons/components';
export declare const SUPPORTED_MODULE_TYPES: ModuleType[];
type SupportedSlotMap = Record<ModuleType, DropdownOption[]>;
export declare const SUPPORTED_MODULE_SLOTS_OT2: SupportedSlotMap;
export declare const SUPPORTED_MODULE_SLOTS_FLEX: SupportedSlotMap;
export declare const OUTER_SLOTS_FLEX: DropdownOption[];
export declare function getAllModuleSlotsByType(moduleType: ModuleType, robotType: RobotType): DropdownOption[];
export {};
