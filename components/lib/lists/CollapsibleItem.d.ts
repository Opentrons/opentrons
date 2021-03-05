import * as React from 'react';
export interface CollapsibleItemProps {
    /** text of title */
    title: string;
    /** children nodes */
    children?: React.ReactNode;
    /** additional classnames */
    className?: string;
    /** caret click action; if defined, list is expandable and carat is visible */
    onCollapseToggle: (event: React.MouseEvent) => unknown;
    /** collapse the list if true (false by default) */
    collapsed: boolean;
}
/**
 * A list item with title, and collapsible children.
 */
export declare function CollapsibleItem(props: CollapsibleItemProps): JSX.Element;
