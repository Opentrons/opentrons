import * as React from 'react';
import type { IconName } from '../icons';
export interface OutsideLinkTabProps {
    /** optional click event for nav button */
    onClick?: React.MouseEventHandler;
    /** link to outside URL */
    to: string;
    /** position a single button on the bottom of the page */
    isBottom?: boolean;
    /** classes to apply */
    className?: string;
    /** disabled attribute (setting disabled removes onClick) */
    disabled?: boolean;
    /** optional title to display below the icon */
    title?: string;
    /** Icon name for button's icon */
    iconName: IconName;
    /** Display a notification dot */
    notification?: boolean;
    /** selected styling (can also use react-router & `activeClassName`) */
    selected?: boolean;
}
/** Very much like NavTab, but used for opening external links in a new tab/window */
export declare function OutsideLinkTab(props: OutsideLinkTabProps): JSX.Element;
