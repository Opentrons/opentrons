import * as React from 'react';
import type { IconName } from '../icons';
export interface SidePanelGroupProps {
    /** text of title */
    title?: string;
    /** optional icon left of the title */
    iconName?: IconName;
    /** children, most likely one or more TitledList */
    children?: React.ReactNode;
    /** additional classnames */
    className?: string;
    /** disables the whole SidePanelGroup if true */
    disabled?: boolean;
}
/**
 * A component for grouping and titling multiple lists
 */
export declare function SidePanelGroup(props: SidePanelGroupProps): JSX.Element;
