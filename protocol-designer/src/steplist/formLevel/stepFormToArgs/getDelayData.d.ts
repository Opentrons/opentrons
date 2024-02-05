import { InnerDelayArgs } from '@opentrons/step-generation';
import { DelayCheckboxFields, DelaySecondFields, HydratedMoveLiquidFormData, HydratedMixFormDataLegacy } from '../../../form-types';
export declare function getMoveLiquidDelayData(hydratedFormData: HydratedMoveLiquidFormData['fields'], checkboxField: DelayCheckboxFields, secondsField: DelaySecondFields, mmFromBottomField: 'aspirate_delay_mmFromBottom' | 'dispense_delay_mmFromBottom'): InnerDelayArgs | null;
export declare function getMixDelayData(hydratedFormData: HydratedMixFormDataLegacy, checkboxField: DelayCheckboxFields, secondsField: DelaySecondFields): number | null;
