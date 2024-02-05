import { PAUSE_UNTIL_RESUME, PAUSE_UNTIL_TIME, PAUSE_UNTIL_TEMP } from './constants';
import type { IconName } from '@opentrons/components';
import type { LabwareLocation, NozzleConfigurationStyle } from '@opentrons/shared-data';
import type { AdditionalEquipmentEntity, ChangeTipOptions, LabwareEntity, PipetteEntity } from '@opentrons/step-generation';
export type StepIdType = string;
export type StepFieldName = string;
export type StepType = 'moveLabware' | 'moveLiquid' | 'mix' | 'pause' | 'manualIntervention' | 'magnet' | 'temperature' | 'thermocycler' | 'heaterShaker';
export declare const stepIconsByType: Record<StepType, IconName>;
export interface AnnotationFields {
    stepName: string;
    stepDetails: string;
}
export interface BlowoutFields {
    blowout_checkbox?: boolean;
    blowout_location?: string;
}
export interface ChangeTipFields {
    changeTip?: ChangeTipOptions;
}
export type MixForm = AnnotationFields & BlowoutFields & ChangeTipFields & {
    stepType: 'mix';
    id: StepIdType;
    labware?: string;
    pipette?: string;
    times?: string;
    volume?: string;
    wells?: string[];
    touchTip?: boolean;
};
export type PauseForm = AnnotationFields & {
    stepType: 'pause';
    id: StepIdType;
    pauseAction?: typeof PAUSE_UNTIL_RESUME | typeof PAUSE_UNTIL_TIME | typeof PAUSE_UNTIL_TEMP;
    pauseHour?: string;
    pauseMinute?: string;
    pauseSecond?: string;
    pauseMessage?: string;
    pauseTemperature?: string;
};
export interface FormData {
    stepType: StepType;
    id: StepIdType;
    [key: string]: any;
}
export declare const PROFILE_CYCLE: 'profileCycle';
export declare const PROFILE_STEP: 'profileStep';
export interface ProfileStepItem {
    type: typeof PROFILE_STEP;
    id: string;
    title: string;
    temperature: string;
    durationMinutes: string;
    durationSeconds: string;
}
export interface ProfileCycleItem {
    type: typeof PROFILE_CYCLE;
    id: string;
    steps: ProfileStepItem[];
    repetitions: string;
}
export type ProfileItem = ProfileStepItem | ProfileCycleItem;
export type PathOption = 'single' | 'multiAspirate' | 'multiDispense';
export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t';
export type BlankForm = AnnotationFields & {
    stepType: StepType;
    id: StepIdType;
};
export interface HydratedMoveLiquidFormData {
    id: string;
    stepType: 'moveLiquid';
    stepName: string;
    description: string | null | undefined;
    fields: {
        pipette: PipetteEntity;
        volume: number;
        path: PathOption;
        changeTip: ChangeTipOptions;
        aspirate_wells_grouped: boolean | null | undefined;
        preWetTip: boolean | null | undefined;
        aspirate_labware: LabwareEntity;
        aspirate_wells: string[];
        aspirate_wellOrder_first: WellOrderOption;
        aspirate_wellOrder_second: WellOrderOption;
        aspirate_flowRate: number | null | undefined;
        aspirate_mmFromBottom: number | null | undefined;
        aspirate_touchTip_checkbox: boolean;
        aspirate_touchTip_mmFromBottom: number | null | undefined;
        aspirate_mix_checkbox: boolean;
        aspirate_mix_volume: number | null | undefined;
        aspirate_mix_times: number | null | undefined;
        aspirate_airGap_checkbox: boolean;
        aspirate_airGap_volume: number | null | undefined;
        aspirate_delay_checkbox: boolean;
        aspirate_delay_seconds: number | null | undefined;
        aspirate_delay_mmFromBottom: number | null | undefined;
        dispense_airGap_checkbox: boolean;
        dispense_airGap_volume: number | null | undefined;
        dispense_delay_checkbox: boolean;
        dispense_delay_seconds: number | null | undefined;
        dispense_delay_mmFromBottom: number | null | undefined;
        dispense_labware: LabwareEntity | AdditionalEquipmentEntity;
        dispense_wells: string[];
        dispense_wellOrder_first: WellOrderOption;
        dispense_wellOrder_second: WellOrderOption;
        dispense_flowRate: number | null | undefined;
        dispense_mmFromBottom: number | null | undefined;
        dispense_touchTip_checkbox: boolean;
        dispense_touchTip_mmFromBottom: number | null | undefined;
        dispense_mix_checkbox: boolean;
        dispense_mix_volume: number | null | undefined;
        dispense_mix_times: number | null | undefined;
        disposalVolume_checkbox: boolean;
        disposalVolume_volume: number | null | undefined;
        blowout_checkbox: boolean;
        blowout_location: string | null | undefined;
        dropTip_location: string;
        nozzles: NozzleConfigurationStyle | null;
    };
}
export interface HydratedMoveLabwareFormData {
    id: string;
    stepType: 'moveLabware';
    stepName: string;
    description: string | null | undefined;
    fields: {
        labware: LabwareEntity;
        newLocation: LabwareLocation;
        useGripper: boolean;
    };
}
export interface HydratedMixFormDataLegacy {
    id: string;
    stepType: 'mix';
    stepName: string;
    stepDetails: string | null | undefined;
    pipette: PipetteEntity;
    volume: number;
    changeTip: ChangeTipOptions;
    labware: LabwareEntity;
    wells: string[];
    mix_wellOrder_first: WellOrderOption;
    mix_wellOrder_second: WellOrderOption;
    aspirate_flowRate: number | null | undefined;
    mix_mmFromBottom: number | null | undefined;
    mix_touchTip_checkbox: boolean;
    mix_touchTip_mmFromBottom: number | null | undefined;
    times: number | null | undefined;
    dispense_flowRate: number | null | undefined;
    blowout_checkbox: boolean;
    blowout_location: string | null | undefined;
    aspirate_delay_checkbox: boolean;
    aspirate_delay_seconds: number | null | undefined;
    dispense_delay_checkbox: boolean;
    dispense_delay_seconds: number | null | undefined;
    dropTip_location: string;
    nozzles: NozzleConfigurationStyle | null;
}
export type MagnetAction = 'engage' | 'disengage';
export type HydratedMagnetFormData = AnnotationFields & {
    id: string;
    stepType: 'magnet';
    stepDetails: string | null;
    moduleId: string | null;
    magnetAction: MagnetAction;
    engageHeight: string | null;
};
export interface HydratedTemperatureFormData {
    id: string;
    stepType: 'temperature';
    stepDetails: string | null;
    moduleId: string | null;
    setTemperature: 'true' | 'false';
    targetTemperature: string | null;
}
export interface HydratedHeaterShakerFormData {
    id: string;
    stepType: 'heaterShaker';
    stepDetails: string | null;
    moduleId: string;
    heaterShakerSetTimer: 'true' | 'false' | null;
    setHeaterShakerTemperature: boolean;
    setShake: boolean;
    latchOpen: boolean;
    targetHeaterShakerTemperature: string | null;
    targetSpeed: string | null;
    heaterShakerTimerMinutes: string | null;
    heaterShakerTimerSeconds: string | null;
}
export type HydratedMoveLiquidFormDataLegacy = AnnotationFields & HydratedMoveLiquidFormData['fields'] & {
    id: string;
    stepType: 'moveLiquid';
};
export type TipOffsetFields = 'aspirate_mmFromBottom' | 'dispense_mmFromBottom' | 'mix_mmFromBottom' | 'aspirate_touchTip_mmFromBottom' | 'dispense_touchTip_mmFromBottom' | 'aspirate_delay_mmFromBottom' | 'dispense_delay_mmFromBottom' | 'mix_touchTip_mmFromBottom';
export type DelayCheckboxFields = 'aspirate_delay_checkbox' | 'dispense_delay_checkbox';
export type DelaySecondFields = 'aspirate_delay_seconds' | 'dispense_delay_seconds';
export declare function getIsTouchTipField(fieldName: StepFieldName): boolean;
export declare function getIsDelayPositionField(fieldName: string): boolean;
export type CountPerStepType = Partial<Record<StepType, number>>;
export interface HydratedFormdata {
    [key: string]: any;
}
