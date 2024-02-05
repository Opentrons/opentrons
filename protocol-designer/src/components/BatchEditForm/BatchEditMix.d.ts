import { FieldPropsByName } from '../StepEditForm/types';
interface BatchEditMixProps {
    batchEditFormHasChanges: boolean;
    propsForFields: FieldPropsByName;
    handleCancel: () => unknown;
    handleSave: () => unknown;
}
export declare const BatchEditMix: (props: BatchEditMixProps) => JSX.Element;
export {};
