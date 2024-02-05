import { ModuleOnDeck } from '../../../step-forms';
import { StepIdType, FormData } from '../../../form-types';
export declare function getNextDefaultTemperatureModuleId(savedForms: Record<StepIdType, FormData>, orderedStepIds: StepIdType[], equippedModulesById: Record<string, ModuleOnDeck>): string | null;
