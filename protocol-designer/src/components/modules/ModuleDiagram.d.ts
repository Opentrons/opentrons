/// <reference types="react" />
import { ModuleType, ModuleModel } from '@opentrons/shared-data';
interface Props {
    type: ModuleType;
    model: ModuleModel;
}
export declare function ModuleDiagram(props: Props): JSX.Element;
export {};
