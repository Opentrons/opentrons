import * as React from 'react';
interface ClickOutsideChildParams {
    ref: React.Ref<Element>;
}
export interface ClickOutsideProps {
    onClickOutside: (e?: React.MouseEvent | EventListenerOrEventListenerObject) => void;
    children: (params: ClickOutsideChildParams) => JSX.Element;
}
export declare class ClickOutside extends React.Component<ClickOutsideProps> {
    wrapperRef: Element | null;
    constructor(props: ClickOutsideProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    setWrapperRef: (el: Element | null) => void;
    handleClickOutside: (event?: any) => void;
    render(): JSX.Element;
}
export {};
