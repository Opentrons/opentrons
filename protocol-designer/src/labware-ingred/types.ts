import { $Keys } from "utility-types";
import type { LocationLiquidState } from "@opentrons/step-generation";
// TODO Ian 2018-02-19 make these shared in component library, standardize with Run App
//  ===== LABWARE ===========
export type DisplayLabware = {
  nickname: string | null | undefined;
};
export type LabwareTypeById = Record<string, string | null | undefined>;
// ==== WELLS ==========
// TODO: Ian 2019-06-08 remove this in favor of WellGroup
export type Wells = Record<string, string>;
export type WellContents = {
  // non-ingredient well state, for SelectableLabware
  wellName: string;
  // eg 'A1', 'A2' etc
  groupIds: Array<string>;
  ingreds: LocationLiquidState;
};
export type ContentsByWell = Record<string, WellContents> | null;
export type WellContentsByLabware = Record<string, ContentsByWell>;
// ==== INGREDIENTS ====
export type OrderedLiquids = Array<{
  ingredientId: string;
  name: string | null | undefined;
}>;
// TODO: Ian 2018-10-15 audit & rename these confusing types
export type LiquidGroup = {
  name: string | null | undefined;
  description: string | null | undefined;
  serialize: boolean;
};
export type IngredInputs = LiquidGroup & {
  volume?: number | null | undefined;
};
export type IngredGroupAccessor = $Keys<IngredInputs>;
export type LiquidGroupsById = Record<string, LiquidGroup>;
export type AllIngredGroupFields = Record<string, IngredInputs>;