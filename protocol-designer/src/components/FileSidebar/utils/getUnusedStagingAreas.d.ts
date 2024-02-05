import type { CreateCommand } from '@opentrons/shared-data';
import type { AdditionalEquipment } from '../FileSidebar';
export declare const getUnusedStagingAreas: (additionalEquipment: AdditionalEquipment, commands?: CreateCommand[]) => string[];
