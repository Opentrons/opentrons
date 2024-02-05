import { FileUploadMessage } from '../../../load-file';
import type { ModalContents } from './types';
interface ModalProps {
    t: any;
    errorMessage?: string | null;
}
export declare const getGenericDidMigrateMessage: (props: ModalProps) => ModalContents;
export declare const getNoBehaviorChangeMessage: (props: ModalProps) => ModalContents;
export declare const getToV8MigrationMessage: (props: ModalProps) => ModalContents;
export declare const getToV3MigrationMessage: (props: ModalProps) => ModalContents;
interface MigrationMessageProps {
    migrationsRan: string[];
    t: any;
}
export declare const getMigrationMessage: (props: MigrationMessageProps) => ModalContents;
interface ModalContentsProps {
    uploadResponse?: FileUploadMessage | null;
}
export declare function useModalContents(props: ModalContentsProps): ModalContents | null;
export {};
