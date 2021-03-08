import * as React from 'react';
import type { PrimitiveComponent } from '../primitives';
export interface RobotCoordsForeignDivProps {
    width?: string | number;
    height?: string | number;
    x?: string | number;
    y?: string | number;
    children?: React.ReactNode;
    className?: string;
    innerDivProps?: React.ComponentProps<PrimitiveComponent<'div'>>;
    transformWithSVG?: boolean;
    extraTransform?: string;
}
export declare const RobotCoordsForeignDiv: (props: RobotCoordsForeignDivProps) => JSX.Element;
