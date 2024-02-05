import { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV1';
import { FormData } from '../../form-types';
export interface PDMetadata {
    pipetteTiprackAssignments: Record<string, string>;
    dismissedWarnings: {
        form: Record<string, string[] | null | undefined>;
        timeline: Record<string, string[] | null | undefined>;
    };
    ingredients: Record<string, {
        name: string | null | undefined;
        description: string | null | undefined;
        serialize: boolean;
    }>;
    ingredLocations: {
        [labwareId: string]: {
            [wellId: string]: {
                [liquidId: string]: {
                    volume: number;
                };
            };
        };
    };
    savedStepForms: Record<string, {
        stepType: 'moveLiquid' | 'mix' | 'pause' | 'manualIntervention';
        id: string;
        [key: string]: any;
    }>;
    orderedStepIds: string[];
}
export type PDProtocolFile = ProtocolFile<PDMetadata>;
export declare const INITIAL_DECK_SETUP_STEP_ID: '__INITIAL_DECK_SETUP_STEP__';
export declare const initialDeckSetupStepForm: FormData;
export declare function renameOrderedSteps(fileData: PDProtocolFile): PDProtocolFile;
export declare function addInitialDeckSetupStep(fileData: PDProtocolFile): PDProtocolFile;
export declare const TCD_DEPRECATED_FIELD_NAMES: string[];
export declare const MIX_DEPRECATED_FIELD_NAMES: string[];
export declare function updateStepFormKeys(fileData: PDProtocolFile): PDProtocolFile;
export declare function replaceTCDStepsWithMoveLiquidStep(fileData: PDProtocolFile): PDProtocolFile;
export declare function updateVersion(fileData: PDProtocolFile): PDProtocolFile;
export declare const migrateFile: (fileData: PDProtocolFile) => PDProtocolFile;
