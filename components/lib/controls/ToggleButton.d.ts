/// <reference types="react" />
import type { ButtonProps } from '../buttons';
export interface ToggleButtonProps extends ButtonProps {
    toggledOn: boolean;
}
export declare function ToggleButton(props: ToggleButtonProps): JSX.Element;
