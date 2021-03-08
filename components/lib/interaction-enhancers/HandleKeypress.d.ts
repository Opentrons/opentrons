import * as React from 'react';
export interface KeypressHandler {
    key: string;
    shiftKey?: boolean | null | undefined;
    onPress: () => unknown;
}
export interface HandleKeypressProps {
    /** array of keypress handlers to attach to the window */
    handlers: KeypressHandler[];
    /** optionally call event.preventDefault if keypress is handled */
    preventDefault?: boolean | null | undefined;
    /** wrapped children */
    children?: React.ReactNode;
}
/**
 * Keypress handler wrapper component. Takes an array of keypress handlers
 * to call when a given key is pressed on the keyboard. Handler is called on
 * `keyup` event. `event.preventDefault` will be called if a key is handled
 * and `props.preventDefault` is true.
 */
export declare class HandleKeypress extends React.Component<HandleKeypressProps> {
    handlePressIfKey: (event: KeyboardEvent) => void;
    preventDefaultIfKey: (event: KeyboardEvent) => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
