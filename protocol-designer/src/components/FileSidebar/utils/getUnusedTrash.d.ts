import { CreateCommand } from '@opentrons/shared-data';
import type { InitialDeckSetup } from '../../../step-forms';
interface UnusedTrash {
    trashBinUnused: boolean;
    wasteChuteUnused: boolean;
}
export declare const getUnusedTrash: (additionalEquipment: InitialDeckSetup['additionalEquipmentOnDeck'], commands?: CreateCommand[]) => UnusedTrash;
export {};
