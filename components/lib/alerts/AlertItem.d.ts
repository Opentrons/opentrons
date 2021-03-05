import * as React from 'react';
import type { IconProps } from '../icons';
export interface AlertItemProps {
    /** name constant of the icon to display */
    type: 'success' | 'warning' | 'error' | 'info';
    /** title/main message of colored alert bar */
    title: string | JSX.Element;
    /** Alert message body contents */
    children?: React.ReactNode;
    /** Additional class name */
    className?: string;
    /** optional handler to show close button/clear alert  */
    onCloseClick?: () => unknown;
    /** Override the default Alert Icon */
    icon?: IconProps;
}
/**
 * Alert overlay,
 * change style and icon by using type 'success' 'warning' 'error'
 */
declare const ALERT_PROPS_BY_TYPE: Record<AlertItemProps['type'], Pick<AlertItemProps, 'icon' | 'className'>>;
export declare type AlertType = keyof typeof ALERT_PROPS_BY_TYPE;
export declare function AlertItem(props: AlertItemProps): JSX.Element;
export {};
