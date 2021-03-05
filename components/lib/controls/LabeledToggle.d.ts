import * as React from 'react';
export interface LabeledToggleProps {
    label: string;
    toggledOn: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
    onClick: () => unknown;
    /** optional data test id for the container */
    'data-test'?: string;
}
export declare function LabeledToggle(props: LabeledToggleProps): JSX.Element;
