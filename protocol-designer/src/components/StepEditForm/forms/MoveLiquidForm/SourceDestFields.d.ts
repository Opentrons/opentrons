import type { FormData } from '../../../../form-types';
import type { FieldPropsByName } from '../../types';
interface SourceDestFieldsProps {
    className?: string | null;
    prefix: 'aspirate' | 'dispense';
    propsForFields: FieldPropsByName;
    formData: FormData;
}
export declare const SourceDestFields: (props: SourceDestFieldsProps) => JSX.Element;
export {};
