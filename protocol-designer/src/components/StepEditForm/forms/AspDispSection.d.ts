import * as React from 'react';
interface Props {
    className?: string | null;
    collapsed?: boolean | null;
    toggleCollapsed: () => void;
    prefix: 'aspirate' | 'dispense';
    children?: React.ReactNode;
}
export declare const AspDispSection: (props: Props) => JSX.Element;
export {};
