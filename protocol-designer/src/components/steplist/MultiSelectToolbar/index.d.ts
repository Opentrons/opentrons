import * as React from 'react';
import { IconName } from '@opentrons/components';
export interface ClickableIconProps {
    id?: string;
    iconName: IconName;
    tooltipText: string;
    width?: string;
    alignRight?: boolean;
    isLast?: boolean;
    onClick?: (event: React.MouseEvent) => unknown;
}
export declare const ClickableIcon: (props: ClickableIconProps) => JSX.Element;
interface Props {
    isMultiSelectMode: boolean;
}
interface AccordionProps {
    expanded: boolean;
    children: React.ReactNode;
}
export declare const Accordion: (props: AccordionProps) => JSX.Element;
export declare const MultiSelectToolbar: (props: Props) => JSX.Element;
export {};
