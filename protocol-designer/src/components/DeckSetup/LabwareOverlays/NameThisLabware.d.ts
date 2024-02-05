/// <reference types="react" />
import type { LabwareEntity } from '@opentrons/step-generation';
import type { LabwareOnDeck } from '../../../step-forms';
interface NameThisLabwareProps {
    labwareOnDeck: LabwareOnDeck | LabwareEntity;
    editLiquids: () => void;
}
export declare function NameThisLabware(props: NameThisLabwareProps): JSX.Element;
export {};
