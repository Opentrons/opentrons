import { DisabledFields, MultiselectFieldValues } from '../../ui/steps/selectors';
import { FieldPropsByName } from '../StepEditForm/types';
export declare const makeBatchEditFieldProps: (fieldValues: MultiselectFieldValues, disabledFields: DisabledFields, handleChangeFormInput: (name: string, value: unknown) => void, t: any) => FieldPropsByName;
