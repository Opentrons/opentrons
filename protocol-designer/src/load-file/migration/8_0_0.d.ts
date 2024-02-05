import type { ProtocolFileV7 } from '@opentrons/shared-data';
import type { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV8';
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands';
export declare const migrateFile: (appData: ProtocolFileV7<DesignerApplicationData>) => ProtocolFile;
