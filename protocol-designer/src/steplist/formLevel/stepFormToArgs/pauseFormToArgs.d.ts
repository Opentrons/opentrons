import { FormData } from '../../../form-types';
import type { WaitForTemperatureArgs, PauseArgs } from '@opentrons/step-generation';
export declare const pauseFormToArgs: (formData: FormData) => PauseArgs | WaitForTemperatureArgs | null;
