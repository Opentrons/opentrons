import * as React from 'react';
interface HandleEnterProps {
    children: React.ReactNode;
    onEnter: () => void;
    disabled?: boolean;
}
export declare function HandleEnter(props: HandleEnterProps): JSX.Element;
export {};
