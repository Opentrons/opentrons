/// <reference types="react" />
import { SourceDestSubstepItem, SubstepIdentifier, WellIngredientNames } from '../../steplist/types';
export interface StepSubItemProps {
    substeps: SourceDestSubstepItem;
}
type SourceDestSubstepProps = StepSubItemProps & {
    ingredNames: WellIngredientNames;
    selectSubstep: (substepIdentifier: SubstepIdentifier) => unknown;
    hoveredSubstep?: SubstepIdentifier | null;
};
export declare function SourceDestSubstep(props: SourceDestSubstepProps): JSX.Element;
export {};
