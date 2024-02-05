import * as React from 'react';
export interface SlideoutProps {
    title: string | React.ReactElement;
    children: React.ReactNode;
    onCloseClick: () => unknown;
    isExpanded?: boolean;
    footer?: React.ReactNode;
}
export declare const Slideout: (props: SlideoutProps) => JSX.Element;
