/// <reference types="react" />
import type { LabwareEntity } from '@opentrons/step-generation';
import type { LabwareOnDeck } from '../../../step-forms';
interface Props {
    labwareOnDeck: LabwareOnDeck | LabwareEntity;
}
export declare function BrowseLabware(props: Props): JSX.Element | null;
export {};
