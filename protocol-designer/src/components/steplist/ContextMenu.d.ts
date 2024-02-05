import * as React from 'react';
import { StepIdType } from '../../form-types';
interface Props {
    children: (args: {
        makeStepOnContextMenu: (stepIdType: StepIdType) => (event: MouseEvent) => unknown;
    }) => React.ReactNode;
}
export declare const ContextMenu: (props: Props) => JSX.Element;
export {};
