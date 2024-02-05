import { LabwareDefinition2 } from '@opentrons/shared-data';
import * as StepGeneration from '@opentrons/step-generation';
import { Selector } from '../../types';
import { WellContentsByLabware, ContentsByWell } from '../../labware-ingred/types';
import { getWellContentsAllLabware } from './getWellContentsAllLabware';
export { getWellContentsAllLabware };
export type { WellContentsByLabware };
export declare function _wellContentsForLabware(labwareLiquids: StepGeneration.SingleLabwareLiquidState, labwareDef: LabwareDefinition2): ContentsByWell;
export declare const getAllWellContentsForActiveItem: Selector<WellContentsByLabware | null>;
export declare const getSelectedWellsMaxVolume: Selector<number>;
interface CommonWellValues {
    ingredientId: string | null | undefined;
    volume: number | null | undefined;
}
/** Returns the common single ingredient group of selected wells,
 * or null if there is not a single common ingredient group */
export declare const getSelectedWellsCommonValues: Selector<CommonWellValues>;
export declare const getSelectedWellsCommonIngredId: Selector<string | null | undefined>;
export declare const getSelectedWellsCommonVolume: Selector<number | null | undefined>;
