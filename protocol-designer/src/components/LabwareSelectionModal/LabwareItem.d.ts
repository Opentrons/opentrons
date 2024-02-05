/// <reference types="react" />
import { IconName } from '@opentrons/components';
import { LabwareDefinition2 } from '@opentrons/shared-data';
interface Props {
    disabled?: boolean | null;
    icon?: IconName | null;
    labwareDef: LabwareDefinition2;
    onMouseEnter: () => any;
    onMouseLeave: () => any;
    selectLabware: (labwareLoadName: string) => unknown;
}
export declare function LabwareItem(props: Props): JSX.Element;
export {};
