import * as React from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
export interface TitledListProps {
    /** text of title */
    title: string;
    /** optional icon left of the title */
    iconName?: IconName | null;
    /** props passed down to icon (`className` and `name` are ignored) */
    iconProps?: Omit<React.ComponentProps<typeof Icon>, 'name'>;
    /** optional data test id for the container */
    'data-test'?: string;
    /** children must all be `<li>` */
    children?: React.ReactNode;
    /** additional classnames */
    className?: string;
    /** component with descriptive text about the list */
    description?: JSX.Element;
    /** optional click action (on title div, not children) */
    onClick?: (event: React.MouseEvent) => unknown;
    /** optional right click action (on wrapping div) */
    onContextMenu?: (event: React.MouseEvent) => unknown;
    /** optional mouseEnter action */
    onMouseEnter?: (event: React.MouseEvent) => unknown;
    /** optional mouseLeave action */
    onMouseLeave?: (event: React.MouseEvent) => unknown;
    /** caret click action; if defined, list is expandable and carat is visible */
    onCollapseToggle?: (event: React.MouseEvent) => unknown;
    /** collapse the list if true (false by default) */
    collapsed?: boolean;
    /** set to true when TitledList is selected (eg, user clicked it) */
    selected?: boolean;
    /** set to true when TitledList is hovered (but not when its contents are hovered) */
    hovered?: boolean;
    /** disables the whole TitledList if true */
    disabled?: boolean;
    /** appear disabled, but preserve collapsibility */
    inert?: boolean;
}
/**
 * An ordered list with optional title, icon, and description.
 */
export declare function TitledList(props: TitledListProps): JSX.Element;
