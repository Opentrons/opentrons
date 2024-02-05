import { FieldPropsByName } from '../../types';
import { FormData } from '../../../../form-types';
interface Props {
    propsForFields: FieldPropsByName;
    isEndingHold?: boolean;
    formData: FormData;
}
export declare const StateFields: (props: Props) => JSX.Element;
export {};
