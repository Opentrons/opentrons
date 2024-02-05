import { PipetteOnDeck } from '../../../step-forms';
import { StepIdType, FormData } from '../../../form-types';
/** returns the last used pipette or, if no pipette has been used,
 * the 'left' pipette (or 'right' if there is no 'left' ) */
export declare function getNextDefaultPipetteId(savedForms: Record<StepIdType, FormData>, orderedStepIds: StepIdType[], equippedPipettesById: Record<string, PipetteOnDeck>): string;
