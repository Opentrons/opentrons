import * as React from 'react';
export interface RobotCoordsTextProps {
    x: number;
    y: number;
    children?: React.ReactNode;
}
/** SVG text reflected to use take robot coordinates as props */
export declare function RobotCoordsText(props: RobotCoordsTextProps): JSX.Element;
