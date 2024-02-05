import { Mount } from '@opentrons/components';
import { ModuleType, ModuleModel, MAGNETIC_MODULE_TYPE, TEMPERATURE_MODULE_TYPE, THERMOCYCLER_MODULE_TYPE, HEATERSHAKER_MODULE_TYPE, MAGNETIC_BLOCK_TYPE, NozzleConfigurationStyle } from '@opentrons/shared-data';
import { DeckSlot } from '../types';
import { TemperatureStatus, ModuleEntity, PipetteEntity, LabwareEntity, AdditionalEquipmentEntity } from '@opentrons/step-generation';
export interface FormPipette {
    pipetteName: string | null | undefined;
    tiprackDefURI: string | null | undefined;
}
export interface FormPipettesByMount {
    left: FormPipette;
    right: FormPipette;
}
export interface FormModule {
    onDeck: boolean;
    model: ModuleModel | null;
    slot: DeckSlot;
}
export type FormModulesByType = Record<ModuleType, FormModule>;
export type ModuleEntities = Record<string, ModuleEntity>;
export interface MagneticModuleState {
    type: typeof MAGNETIC_MODULE_TYPE;
    engaged: boolean;
}
export interface TemperatureModuleState {
    type: typeof TEMPERATURE_MODULE_TYPE;
    status: TemperatureStatus;
    targetTemperature: number | null;
}
export interface ThermocyclerModuleState {
    type: typeof THERMOCYCLER_MODULE_TYPE;
    blockTargetTemp: number | null;
    lidTargetTemp: number | null;
    lidOpen: boolean | null;
}
export interface HeaterShakerModuleState {
    type: typeof HEATERSHAKER_MODULE_TYPE;
    targetTemp: number | null;
    targetSpeed: number | null;
    latchOpen: boolean | null;
}
export interface MagneticBlockState {
    type: typeof MAGNETIC_BLOCK_TYPE;
}
export interface ModuleTemporalProperties {
    slot: DeckSlot;
    moduleState: MagneticModuleState | TemperatureModuleState | ThermocyclerModuleState | HeaterShakerModuleState | MagneticBlockState;
}
export type ModuleOnDeck = ModuleEntity & ModuleTemporalProperties;
export type ModulesForEditModulesCard = Partial<Record<ModuleType, ModuleOnDeck | null | undefined>>;
export type NormalizedLabwareById = Record<string, {
    labwareDefURI: string;
}>;
export type NormalizedLabware = NormalizedLabwareById[keyof NormalizedLabwareById];
export interface LabwareTemporalProperties {
    slot: DeckSlot;
}
export interface PipetteTemporalProperties {
    mount: Mount;
    nozzles?: NozzleConfigurationStyle;
    prevNozzles?: NozzleConfigurationStyle;
}
export type LabwareOnDeck = LabwareEntity & LabwareTemporalProperties;
export type PipetteOnDeck = PipetteEntity & PipetteTemporalProperties;
export type AdditionalEquipmentOnDeck = AdditionalEquipmentEntity;
export type InitialDeckSetup = AllTemporalPropertiesForTimelineFrame;
export interface AllTemporalPropertiesForTimelineFrame {
    labware: {
        [labwareId: string]: LabwareOnDeck;
    };
    pipettes: {
        [pipetteId: string]: PipetteOnDeck;
    };
    modules: {
        [moduleId: string]: ModuleOnDeck;
    };
    additionalEquipmentOnDeck: {
        [additionalEquipmentId: string]: AdditionalEquipmentOnDeck;
    };
}
