import type { InvariantContext } from '@opentrons/step-generation';
import type { ProfileFormError } from './profileErrors';
type HydratedFormData = any;
export declare const getMoveLabwareFormErrors: (hydratedForm: HydratedFormData, invariantContext: InvariantContext) => ProfileFormError[];
export {};
