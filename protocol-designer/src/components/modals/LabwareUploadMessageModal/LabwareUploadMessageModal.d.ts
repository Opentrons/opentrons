import { LabwareUploadMessage } from '../../../labware-defs';
export interface LabwareUploadMessageModalProps {
    message?: LabwareUploadMessage | null;
    dismissModal: () => unknown;
    overwriteLabwareDef?: () => unknown;
}
export declare const LabwareUploadMessageModal: () => JSX.Element | null;
