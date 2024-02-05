import { StepFieldName, FormData } from '../../../form-types';
import { FieldPropsByName, FocusHandlers } from '../types';
interface ShowFieldErrorParams {
    name: StepFieldName;
    focusedField: StepFieldName | null;
    dirtyFields?: StepFieldName[];
}
export declare const showFieldErrors: ({ name, focusedField, dirtyFields, }: ShowFieldErrorParams) => boolean | undefined | StepFieldName[];
export declare const makeSingleEditFieldProps: (focusHandlers: FocusHandlers, formData: FormData, handleChangeFormInput: (name: string, value: unknown) => void, hydratedForm: {
    [key: string]: any;
}, t: any) => FieldPropsByName;
export {};
