import { FieldProps } from '../types';
type ToggleRowProps = FieldProps & {
    offLabel?: string;
    onLabel?: string;
    className?: string;
};
export declare const ToggleRowField: (props: ToggleRowProps) => JSX.Element;
export {};
