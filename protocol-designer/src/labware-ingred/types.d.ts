import { LocationLiquidState } from '@opentrons/step-generation';
export interface DisplayLabware {
    nickname: string | null | undefined;
    disambiguationNumber?: number;
}
export type LabwareTypeById = Record<string, string | null | undefined>;
export type Wells = Record<string, string>;
export interface WellContents {
    wellName?: string;
    groupIds: string[];
    ingreds: LocationLiquidState;
    highlighted?: boolean;
    selected?: boolean;
    maxVolume?: number;
}
export type ContentsByWell = {
    [wellName: string]: WellContents;
} | null;
export interface WellContentsByLabware {
    [labwareId: string]: ContentsByWell;
}
export type OrderedLiquids = Array<{
    ingredientId: string;
    name: string | null | undefined;
    displayColor: string | null | undefined;
}>;
export interface LiquidGroup {
    name: string | null | undefined;
    description: string | null | undefined;
    displayColor: string;
    serialize: boolean;
}
export type IngredInputs = LiquidGroup & {
    volume?: number | null | undefined;
};
export type IngredGroupAccessor = keyof IngredInputs;
export type LiquidGroupsById = Record<string, LiquidGroup>;
export type AllIngredGroupFields = Record<string, IngredInputs>;
