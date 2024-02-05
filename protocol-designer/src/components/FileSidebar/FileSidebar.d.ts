import * as React from 'react';
import type { ProtocolFile, RobotType } from '@opentrons/shared-data';
import type { InitialDeckSetup, SavedStepFormState } from '../../step-forms';
export interface AdditionalEquipment {
    [additionalEquipmentId: string]: {
        name: 'gripper' | 'wasteChute' | 'stagingArea' | 'trashBin';
        id: string;
        location?: string;
    };
}
export interface Props {
    loadFile: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
    createNewFile?: () => unknown;
    canDownload: boolean;
    onDownload: () => unknown;
    fileData?: ProtocolFile | null;
    pipettesOnDeck: InitialDeckSetup['pipettes'];
    modulesOnDeck: InitialDeckSetup['modules'];
    savedStepForms: SavedStepFormState;
    robotType: RobotType;
    additionalEquipment: AdditionalEquipment;
}
export declare function v8WarningContent(t: any): JSX.Element;
export declare function FileSidebar(): JSX.Element;
