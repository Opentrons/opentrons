import * as React from 'react';
import type { IconName } from '../icons';
interface ListItemProps {
    /** click handler */
    onClick?: (event: React.SyntheticEvent) => unknown;
    /** mouse enter handler */
    onMouseEnter?: (event: React.MouseEvent) => unknown;
    /** mouse leave handler */
    onMouseLeave?: (event: React.MouseEvent) => unknown;
    /** mouse enter handler */
    onPointerEnter?: (event: React.PointerEvent) => unknown;
    /** mouse leave handler */
    onPointerLeave?: (event: React.PointerEvent) => unknown;
    /** if URL is specified, ListItem is wrapped in a React Router NavLink */
    url?: string | null;
    /** if URL is specified NavLink can receive an active class name */
    activeClassName?: string;
    /** if URL is specified NavLink can receive an exact property for matching routes */
    exact?: boolean;
    /** Additional class name */
    className?: string;
    /** if disabled, the onClick handler / NavLink will be disabled */
    isDisabled?: boolean;
    /** name constant of the icon to display */
    iconName?: IconName;
    'aria-describedby'?: string;
    ref?: {
        current: Element | null;
    } | ((current: Element | null) => unknown);
    children?: React.ReactNode;
}
/**
 * A styled `<li>` with an optional icon, and an optional url for a React Router `NavLink`
 *
 */
export declare const ListItem: React.ForwardRefExoticComponent<Pick<ListItemProps, "exact" | "children" | "url" | "className" | "aria-describedby" | "onClick" | "onMouseEnter" | "onMouseLeave" | "onPointerEnter" | "onPointerLeave" | "iconName" | "isDisabled" | "activeClassName"> & React.RefAttributes<React.RefObject<Element>>>;
export {};
