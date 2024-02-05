import * as React from 'react';
import { LocationLiquidState } from '@opentrons/step-generation';
import { SubstepIdentifier, SubstepWellData, WellIngredientVolumeData, WellIngredientNames } from '../../steplist/types';
interface SubstepRowProps {
    volume: number | string | null | undefined;
    source?: SubstepWellData;
    dest?: SubstepWellData;
    ingredNames: WellIngredientNames;
    className?: string;
    stepId: string;
    substepIndex: number;
    selectSubstep?: (substepIdentifier: SubstepIdentifier) => unknown;
}
interface PillTooltipContentsProps {
    ingreds: WellIngredientVolumeData | LocationLiquidState;
    ingredNames: WellIngredientNames;
    well: string;
}
export declare const PillTooltipContents: (props: PillTooltipContentsProps) => JSX.Element;
declare function SubstepRowComponent(props: SubstepRowProps): JSX.Element;
export declare const SubstepRow: React.MemoExoticComponent<typeof SubstepRowComponent>;
export {};
