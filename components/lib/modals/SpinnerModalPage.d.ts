import * as React from 'react';
import { SpinnerModal } from './SpinnerModal';
import type { TitleBarProps } from '../structure';
export interface SpinnerModalPageProps extends React.ComponentProps<typeof SpinnerModal> {
    /** Props for title bar at top of modal page */
    titleBar: TitleBarProps;
}
/**
 * Spinner Modal variant with TitleBar
 */
export declare function SpinnerModalPage(props: SpinnerModalPageProps): JSX.Element;
