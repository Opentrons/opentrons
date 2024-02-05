import { RobotType } from '@opentrons/shared-data';
import type { SavedStepFormState } from '../../../step-forms';
/** Pull out all entities never specified by step forms. Assumes that all forms share the entityKey */
export declare function getUnusedEntities<T>(entities: Record<string, T>, stepForms: SavedStepFormState, entityKey: 'pipette' | 'moduleId', robotType: RobotType): T[];
