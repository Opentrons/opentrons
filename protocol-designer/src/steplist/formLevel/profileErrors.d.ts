/// <reference types="react" />
import { ProfileStepItem } from '../../form-types';
type HydratedFormData = any;
export interface ProfileFormError {
    title: string;
    body?: React.ReactNode;
    dependentProfileFields: string[];
}
export declare const profileStepValidDuration: (step: ProfileStepItem) => ProfileFormError | null;
export declare const getProfileFormErrors: (hydratedForm: HydratedFormData) => ProfileFormError[];
export {};
