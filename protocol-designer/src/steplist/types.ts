import typeof { THERMOCYCLER_PROFILE, THERMOCYCLER_STATE } from "../constants";
import type { CommandCreatorArgs, PauseArgs, ThermocyclerProfileStepArgs } from "@opentrons/step-generation";
import type { StepIdType } from "../form-types";
import type { FormError } from "./formLevel/errors";
// timeline start and end
export const START_TERMINAL_ITEM_ID: "__initial_setup__" = '__initial_setup__';
export const END_TERMINAL_ITEM_ID: "__end__" = '__end__';
export const PRESAVED_STEP_ID: "__presaved_step__" = '__presaved_step__';
export type TerminalItemId = typeof START_TERMINAL_ITEM_ID | typeof END_TERMINAL_ITEM_ID | typeof PRESAVED_STEP_ID;
export type WellIngredientNames = Record<string, string>;
// TODO: IL 2019-11-26 untangle single vs multi-channel data types for substeps.
// We tried to unify them with Maybes and Unions, but really they should be
// treated as 2 distinct paths
export type WellIngredientVolumeData = Record<string, {
  volume: number;
}> | Record<string, Record<string, {
  volume: number;
}>>;
export type TipLocation = {
  labware: string;
  well: string;
};
export type SubstepIdentifier = {
  stepId: StepIdType;
  substepIndex: number;
} | null;
export type NamedIngred = {
  id: string;
  name: string;
};
export type SourceDestData = {
  wells: string[];
  preIngreds: WellIngredientVolumeData;
  postIngreds: WellIngredientVolumeData;
};
export type SubstepTimelineFrame = {
  substepIndex?: number;
  activeTips: TipLocation | null | undefined;
  source?: SourceDestData;
  dest?: SourceDestData;
  volume?: number | null | undefined;
  channelId?: number;
};
export type SubstepWellData = {
  well: string;
  preIngreds: WellIngredientVolumeData;
  postIngreds: WellIngredientVolumeData;
};
export type StepItemSourceDestRow = {
  activeTips: TipLocation | null | undefined;
  substepIndex?: number;
  source?: SubstepWellData;
  dest?: SubstepWellData;
  volume?: number | null | undefined;
  channelId?: number;
};
// NOTE: delay is NOT a source-dest-style command creator, this type exists
// mostly to tell flow that :/
type SourceDestCommandCreatorName = "transfer" | "distribute" | "consolidate" | "mix";
export type SourceDestSubstepItemSingleChannel = {
  substepType: "sourceDest";
  multichannel: false;
  commandCreatorFnName: SourceDestCommandCreatorName;
  parentStepId: StepIdType;
  rows: StepItemSourceDestRow[];
};
export type SourceDestSubstepItemMultiChannel = {
  substepType: "sourceDest";
  multichannel: true;
  commandCreatorFnName: SourceDestCommandCreatorName;
  parentStepId: StepIdType;
  volume?: number | null | undefined;
  // uniform volume for all steps
  multiRows: Array<StepItemSourceDestRow[]>; // Array of arrays.
  // NOTE: "Row" means a tabular row on the steplist, NOT a "row" of wells on the deck

};
export type SourceDestSubstepItem = SourceDestSubstepItemSingleChannel | SourceDestSubstepItemMultiChannel;
export type MagnetSubstepItem = {
  substepType: "magnet";
  engage: boolean;
  labwareNickname: string | null | undefined;
  message?: string;
};
export type TemperatureSubstepItem = {
  substepType: "temperature";
  temperature: number | null;
  labwareNickname: string | null | undefined;
  message?: string;
};
export type PauseSubstepItem = {
  substepType: "pause";
  pauseStepArgs: PauseArgs;
};
// Pause substeps use same data as processed form
export type AwaitTemperatureSubstepItem = {
  substepType: "awaitTemperature";
  temperature: number;
  labwareNickname: string | null | undefined;
  message?: string;
};
export type ThermocyclerProfileSubstepItem = {
  substepType: THERMOCYCLER_PROFILE;
  blockTargetTempHold: number | null;
  labwareNickname: string | null | undefined;
  lidOpenHold: boolean;
  lidTargetTempHold: number | null;
  message?: string;
  meta: ThermocyclerProfileStepArgs["meta"];
  profileSteps: ThermocyclerProfileStepArgs["profileSteps"];
  profileTargetLidTemp: number | null;
  profileVolume: number;
};
export type ThermocyclerStateSubstepItem = {
  substepType: THERMOCYCLER_STATE;
  labwareNickname: string | null | undefined;
  blockTargetTemp: number | null;
  lidTargetTemp: number | null;
  lidOpen: boolean;
  message?: string;
};
export type SubstepItemData = SourceDestSubstepItem | PauseSubstepItem | MagnetSubstepItem | TemperatureSubstepItem | AwaitTemperatureSubstepItem | ThermocyclerProfileSubstepItem | ThermocyclerStateSubstepItem;
export type Substeps = Record<StepIdType, SubstepItemData | null | undefined>;
export type StepFormErrors = FormError[];
export type StepArgsAndErrors = {
  errors: boolean;
  stepArgs: CommandCreatorArgs | null; // TODO: incompleteData field when this is null?

};
export type StepArgsAndErrorsById = Record<string, StepArgsAndErrors>;
export type LabwareNamesByModuleId = Record<string, {
  nickname: string;
} | null | undefined>;