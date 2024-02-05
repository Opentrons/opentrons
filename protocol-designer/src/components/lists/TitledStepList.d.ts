import * as React from 'react';
import { Icon, IconName } from '@opentrons/components';
export interface Props {
    /** text of title */
    title: string;
    /** icon left of the step */
    iconName: IconName;
    /** props passed down to icon (`className` and `name` are ignored) */
    iconProps?: Omit<React.ComponentProps<typeof Icon>, 'name'>;
    /** optional data test id for the container */
    'data-test'?: string;
    /** children must all be `<li>` */
    children?: React.ReactNode;
    /** additional classnames */
    className?: string;
    /** component with descriptive text about the list */
    description?: React.ReactNode;
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
    /** set to true when Step is selected (eg, user clicked it) */
    selected?: boolean;
    /** set to true when Step is hovered (but not when its contents are hovered) */
    hovered?: boolean;
    /** show checkbox icons if true */
    isMultiSelectMode?: boolean;
    /** set to true when Step is the last selected in multi select mode */
    isLastSelected?: boolean;
}
export declare function TitledStepList(props: Props): JSX.Element;
