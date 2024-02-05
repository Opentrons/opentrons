import type { ProtocolFileV6 } from '@opentrons/shared-data';
import type { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV7';
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands';
export declare const migrateFile: (appData: ProtocolFileV6<DesignerApplicationData>) => ProtocolFile;
