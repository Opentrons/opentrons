/// <reference types="react" />
import { ModuleDefinition, ModuleModel, ModuleOrientation } from '@opentrons/shared-data';
interface Ot2ModuleTagProps {
    dimensions: ModuleDefinition['dimensions'];
    model: ModuleModel;
    orientation: ModuleOrientation;
}
export declare function Ot2ModuleTag(props: Ot2ModuleTagProps): JSX.Element;
export {};
