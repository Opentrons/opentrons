/// <reference types="react" />
import type { ButtonProps } from '../buttons';
export interface TitleBarProps {
    title: string;
    subtitle?: string;
    back?: ButtonProps;
    className?: string;
    onBackClick?: () => unknown;
    backClickDisabled?: boolean;
    backButtonLabel?: string;
}
export declare function TitleBar(props: TitleBarProps): JSX.Element;
