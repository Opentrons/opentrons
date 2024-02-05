import { ProtocolFileV5 } from '@opentrons/shared-data';
import type { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV6';
import type { DesignerApplicationData } from './utils/getLoadLiquidCommands';
export declare const migrateSavedStepForms: (savedStepForms?: Record<string, any>) => Record<string, any>;
export declare const migrateFile: (appData: ProtocolFileV5<DesignerApplicationData>) => ProtocolFile;
