import { InvariantContext } from '@opentrons/step-generation';
import type { StepFieldName } from '../../form-types';
export type { StepFieldName };
export declare const getFieldErrors: (name: StepFieldName, value: unknown) => string[];
export declare const getProfileFieldErrors: (name: string, value: unknown) => string[];
export declare const castField: (name: StepFieldName, value: unknown) => unknown;
export declare const maskField: (name: StepFieldName, value: unknown) => unknown;
export declare const maskProfileField: (name: string, value: unknown) => unknown;
export declare const hydrateField: (state: InvariantContext, name: StepFieldName, value: string) => unknown;
