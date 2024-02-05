import { ModuleType, ModuleModel } from '@opentrons/shared-data';
import type { ModuleOnDeck } from '../../../step-forms/types';
import type { ModelModuleInfo } from '../../EditModules';
export interface EditModulesModalProps {
    moduleType: ModuleType;
    moduleOnDeck: ModuleOnDeck | null;
    onCloseClick: () => void;
    editModuleModel: (model: ModuleModel) => void;
    editModuleSlot: (slot: string) => void;
    displayModuleWarning: (module: ModelModuleInfo) => void;
}
export interface EditModulesFormValues {
    selectedModel: ModuleModel | null;
    selectedSlot: string;
}
export declare const EditModulesModal: (props: EditModulesModalProps) => JSX.Element;
