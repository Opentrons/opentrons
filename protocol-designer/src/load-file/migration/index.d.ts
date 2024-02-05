import { PDProtocolFile } from '../../file-types';
export declare const OLDEST_MIGRATEABLE_VERSION = "1.0.0";
type Version = string;
export declare const getMigrationVersionsToRunFromVersion: (migrationsByVersion: {}, version: Version) => Version[];
export declare const migration: (file: any) => {
    file: PDProtocolFile;
    didMigrate: boolean;
    migrationsRan: string[];
};
export {};
