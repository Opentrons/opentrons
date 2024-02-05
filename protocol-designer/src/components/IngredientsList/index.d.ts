/// <reference types="react" />
type RemoveWellsContents = (args: {
    liquidGroupId: string;
    wells: string[];
}) => unknown;
export interface CommonProps {
    removeWellsContents: RemoveWellsContents;
    selected?: boolean;
}
export declare function IngredientsList(): JSX.Element;
export {};
