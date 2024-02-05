import * as React from 'react';
import type { GenericRect } from '../collision-types';
interface SelectionRectProps {
    onSelectionMove?: (e: MouseEvent, arg: GenericRect) => void;
    onSelectionDone?: (e: MouseEvent, arg: GenericRect) => void;
    svg?: boolean;
    children?: React.ReactNode;
    originXOffset?: number;
    originYOffset?: number;
}
export declare function SelectionRect(props: SelectionRectProps): JSX.Element;
export {};
