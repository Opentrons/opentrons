import { CommandCreatorArgs } from '@opentrons/step-generation';
import type { FormData } from '../../../form-types';
type StepArgs = CommandCreatorArgs | null;
export declare const _castForm: (hydratedForm: FormData) => any;
export declare const stepFormToArgs: (hydratedForm: FormData) => StepArgs;
export {};
