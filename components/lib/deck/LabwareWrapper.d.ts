import * as React from 'react';
export interface LabwareWrapperProps {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
    highlighted?: boolean;
    children?: React.ReactNode;
}
/**
 * @deprecated Use {@link RobotWorkSpace}
 */
export declare function LabwareWrapper(props: LabwareWrapperProps): JSX.Element;
