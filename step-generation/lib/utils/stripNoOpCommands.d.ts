import type { Command } from '@opentrons/shared-data/lib/protocol/types/schemaV6';
export declare const _stripNoOpMixCommands: (commands: Command[]) => Command[];
export declare const stripNoOpCommands: (commands: Command[]) => Command[];
