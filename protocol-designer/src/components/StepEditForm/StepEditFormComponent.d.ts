import { StepFieldName } from '../../steplist/fieldLevel';
import { FormData } from '../../form-types';
import { FieldPropsByName, FocusHandlers } from './types';
interface Props {
    canSave: boolean;
    dirtyFields: string[];
    focusHandlers: FocusHandlers;
    focusedField: StepFieldName | null;
    formData: FormData;
    propsForFields: FieldPropsByName;
    handleClose: () => unknown;
    handleDelete: () => unknown;
    handleSave: () => unknown;
    showMoreOptionsModal: boolean;
    toggleMoreOptionsModal: () => unknown;
}
export declare const StepEditFormComponent: (props: Props) => JSX.Element;
export {};
