import * as React from 'react';
import { Box } from '../primitives';
import type { TitleBarProps } from '../structure';
export interface ModalPageProps {
    /** Props for title bar at top of modal page */
    titleBar: TitleBarProps;
    contentsClassName?: string;
    heading?: React.ReactNode;
    children?: React.ReactNode;
    innerProps?: React.ComponentProps<typeof Box>;
    outerProps?: React.ComponentProps<typeof Box>;
}
export declare function ModalPage(props: ModalPageProps): JSX.Element;
