/// <reference types="react" />
import type { StepItemSourceDestRow, SubstepIdentifier, WellIngredientNames } from '../../steplist/types';
interface MultiChannelSubstepProps {
    rowGroup: StepItemSourceDestRow[];
    ingredNames: WellIngredientNames;
    stepId: string;
    substepIndex: number;
    selectSubstep: (substepIdentifier: SubstepIdentifier) => void;
    highlighted?: boolean;
}
export declare function MultiChannelSubstep(props: MultiChannelSubstepProps): JSX.Element;
export {};
