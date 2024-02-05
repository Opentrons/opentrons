import { ModuleModel, ModuleType } from '@opentrons/shared-data';
export interface EditModulesProps {
    moduleToEdit: {
        moduleId?: string | null;
        moduleType: ModuleType;
    };
    onCloseClick: () => void;
}
export interface ModelModuleInfo {
    model: ModuleModel;
    slot: string;
}
export declare const EditModules: (props: EditModulesProps) => JSX.Element;
