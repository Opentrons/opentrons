import { ThermocyclerProfileStepArgs, ThermocyclerStateStepArgs } from '@opentrons/step-generation';
import type { FormData } from '../../../form-types';
export declare const thermocyclerFormToArgs: (formData: FormData) => ThermocyclerProfileStepArgs | ThermocyclerStateStepArgs | null;
