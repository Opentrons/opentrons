/// <reference types="react" />
import { UseHoverTooltipTargetProps } from '@opentrons/components';
import { WellIngredientVolumeData, WellIngredientNames } from '../../steplist';
interface Props {
    ingreds: WellIngredientVolumeData;
    ingredNames: WellIngredientNames;
    targetProps: UseHoverTooltipTargetProps | null | undefined;
}
export declare function IngredPill(props: Props): JSX.Element;
export {};
