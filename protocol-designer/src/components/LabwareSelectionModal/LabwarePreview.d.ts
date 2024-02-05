import { LabwareDefinition2 } from '@opentrons/shared-data';
interface Props {
    labwareDef?: LabwareDefinition2 | null;
    moduleCompatibility?: 'recommended' | 'potentiallyCompatible' | 'notCompatible' | null;
}
export declare const LabwarePreview: (props: Props) => JSX.Element | null;
export {};
