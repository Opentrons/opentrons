import { HydratedMixFormDataLegacy } from '../../../form-types';
import { MixArgs } from '@opentrons/step-generation';
type MixStepArgs = MixArgs;
export declare const mixFormToArgs: (hydratedFormData: HydratedMixFormDataLegacy) => MixStepArgs;
export {};
