import type { LoadLiquidCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup';
export interface DesignerApplicationData {
    ingredients: Record<string, {
        name?: string | null;
        description?: string | null;
        serialize: boolean;
    }>;
    ingredLocations: {
        [labwareId: string]: {
            [wellName: string]: {
                [liquidId: string]: {
                    volume: number;
                };
            };
        };
    };
    savedStepForms: Record<string, any>;
    orderedStepIds: string[];
}
export declare const getLoadLiquidCommands: (ingredients?: DesignerApplicationData['ingredients'], ingredLocations?: DesignerApplicationData['ingredLocations']) => LoadLiquidCreateCommand[];
