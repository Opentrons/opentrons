import { LabwareDefinition2 } from '@opentrons/shared-data';
import { WellOrderOption } from '../../form-types';
export declare function getOrderedWells(unorderedWells: string[], labwareDef: LabwareDefinition2, wellOrderFirst: WellOrderOption, wellOrderSecond: WellOrderOption): string[];
