import { FieldProps } from '../types';
type TextFieldProps = FieldProps & {
    className?: string;
    caption?: string | null;
    units?: string | null;
};
export declare const TextField: (props: TextFieldProps) => JSX.Element;
export {};
