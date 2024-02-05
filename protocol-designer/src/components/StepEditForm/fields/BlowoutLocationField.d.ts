import { Options } from '@opentrons/components';
import { FieldProps } from '../types';
type BlowoutLocationDropdownProps = FieldProps & {
    className?: string;
    options: Options;
};
export declare const BlowoutLocationField: (props: BlowoutLocationDropdownProps) => JSX.Element;
export {};
