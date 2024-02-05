import { ModuleType, ModuleModel } from '@opentrons/shared-data';
import { PipetteOnDeck, FormPipettesByMount, FormModulesByType } from '../../../step-forms';
import { NewProtocolFields } from '../../../load-file';
import type { DeckSlot } from '../../../types';
export type PipetteFieldsData = Omit<PipetteOnDeck, 'id' | 'spec' | 'tiprackLabwareDef'>;
export interface ModuleCreationArgs {
    type: ModuleType;
    model: ModuleModel;
    slot: DeckSlot;
}
export interface FormState {
    fields: NewProtocolFields;
    pipettesByMount: FormPipettesByMount;
    modulesByType: FormModulesByType;
}
export interface Props {
    closeModal: () => void;
}
export declare const FilePipettesModal: (props: Props) => JSX.Element;
