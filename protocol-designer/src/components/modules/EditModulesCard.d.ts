/// <reference types="react" />
import { ModuleType } from '@opentrons/shared-data';
import { ModulesForEditModulesCard } from '../../step-forms';
export interface Props {
    modules: ModulesForEditModulesCard;
    openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => void;
}
export declare function EditModulesCard(props: Props): JSX.Element;
