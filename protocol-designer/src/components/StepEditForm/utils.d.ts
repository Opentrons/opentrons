import { FormData, ProfileItem, StepFieldName, StepType, PathOption } from '../../form-types';
import { Options } from '@opentrons/components';
import { ProfileFormError } from '../../steplist/formLevel/profileErrors';
import { FormWarning } from '../../steplist/formLevel/warnings';
import type { StepFormErrors } from '../../steplist/types';
export declare function getBlowoutLocationOptionsForForm(args: {
    stepType: StepType;
    path?: PathOption | null | undefined;
}): Options;
export declare const getDirtyFields: (isNewStep: boolean, formData?: FormData | null) => string[];
export declare const getVisibleFormErrors: (args: {
    focusedField?: string | null;
    dirtyFields: string[];
    errors: StepFormErrors;
}) => StepFormErrors;
export declare const getVisibleFormWarnings: (args: {
    focusedField?: string | null;
    dirtyFields: string[];
    errors: FormWarning[];
}) => FormWarning[];
export declare const getDynamicFieldFocusHandlerId: ({ id, name, }: {
    id: string;
    name: string;
}) => string;
export declare const getVisibleProfileFormLevelErrors: (args: {
    focusedField?: string | null;
    dirtyFields: string[];
    errors: ProfileFormError[];
    profileItemsById: Record<string, ProfileItem>;
}) => ProfileFormError[];
export declare const getFieldDefaultTooltip: (name: string, t: any) => string;
export declare const getFieldIndeterminateTooltip: (name: string, t: any) => string;
export declare const getSingleSelectDisabledTooltip: (name: string, stepType: string, t: any) => string;
export declare function getLabwareFieldForPositioningField(name: StepFieldName): StepFieldName;
