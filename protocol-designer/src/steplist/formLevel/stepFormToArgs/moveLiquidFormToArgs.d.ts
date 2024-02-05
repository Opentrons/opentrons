import { HydratedMoveLiquidFormData } from '../../../form-types';
import type { ConsolidateArgs, DistributeArgs, TransferArgs, InnerMixArgs } from '@opentrons/step-generation';
type MoveLiquidFields = HydratedMoveLiquidFormData['fields'];
export declare function getAirGapData(hydratedFormData: MoveLiquidFields, checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox', volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'): number | null;
export declare function getMixData(hydratedFormData: any, checkboxField: any, volumeField: any, timesField: any): InnerMixArgs | null | undefined;
type MoveLiquidStepArgs = ConsolidateArgs | DistributeArgs | TransferArgs | null;
export declare const moveLiquidFormToArgs: (hydratedFormData: HydratedMoveLiquidFormData) => MoveLiquidStepArgs;
export {};
