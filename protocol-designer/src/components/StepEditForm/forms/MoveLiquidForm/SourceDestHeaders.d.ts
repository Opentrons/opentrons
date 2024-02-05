import type { FormData } from '../../../../form-types';
import type { FieldPropsByName } from '../../types';
interface Props {
    className?: string | null;
    collapsed?: boolean | null;
    formData: FormData;
    prefix: 'aspirate' | 'dispense';
    propsForFields: FieldPropsByName;
    toggleCollapsed: () => void;
}
export declare const SourceDestHeaders: (props: Props) => JSX.Element;
export {};
