/// <reference types="react" />
import type { ModuleDefinition } from '@opentrons/shared-data';
interface FlexModuleTagProps {
    dimensions: ModuleDefinition['dimensions'];
    displayName: string;
}
export declare function FlexModuleTag(props: FlexModuleTagProps): JSX.Element;
export {};
