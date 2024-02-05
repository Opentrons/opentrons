import { ProtocolFile } from '@opentrons/shared-data/protocol/types/schemaV3';
import { PDProtocolFile as PDProtocolFileV1, PDMetadata } from './1_1_0';
export type PDProtocolFile = ProtocolFile<PDMetadata>;
export declare const PD_VERSION = "3.0.0";
export declare const SCHEMA_VERSION = 3;
export declare const migrateFile: (fileData: PDProtocolFileV1) => PDProtocolFile;
