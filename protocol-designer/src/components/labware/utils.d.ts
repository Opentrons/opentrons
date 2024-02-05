import { AdditionalEquipmentEntities } from '@opentrons/step-generation';
import { WellFill } from '@opentrons/components';
import { ContentsByWell } from '../../labware-ingred/types';
export declare const wellFillFromWellContents: (wellContents: ContentsByWell, displayColors: string[]) => WellFill;
export declare const getHasWasteChute: (additionalEquipmentEntities: AdditionalEquipmentEntities) => boolean;
