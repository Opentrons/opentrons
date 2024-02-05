/// <reference types="react" />
import { ContentsByWell } from '../../labware-ingred/types';
import { WellIngredientNames } from '../../steplist/types';
import { LabwareDefinition2 } from '@opentrons/shared-data';
interface Props {
    definition?: LabwareDefinition2 | null;
    ingredNames: WellIngredientNames;
    wellContents: ContentsByWell;
}
export declare function BrowsableLabware(props: Props): JSX.Element | null;
export {};
