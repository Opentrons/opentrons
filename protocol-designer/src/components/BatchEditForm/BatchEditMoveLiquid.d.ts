import { FieldPropsByName } from '../StepEditForm/types';
export interface BatchEditMoveLiquidProps {
    batchEditFormHasChanges: boolean;
    propsForFields: FieldPropsByName;
    handleCancel: () => void;
    handleSave: () => void;
}
export declare const BatchEditMoveLiquid: (props: BatchEditMoveLiquidProps) => JSX.Element;
