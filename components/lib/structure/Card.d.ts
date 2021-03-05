import * as React from 'react';
export interface CardProps {
    /** Title for card, all cards should receive a title. */
    title?: React.ReactNode;
    /** Card contents */
    children?: React.ReactNode;
    /** If card can not be used, gray it out and remove pointer events */
    disabled?: boolean;
    /** Additional class names */
    className?: string;
}
/**
 * Renders a basic card element with a white background, dropshadow, and zero padding.
 *
 * Titles and other children handle their own styles and layout.
 */
export declare function Card(props: CardProps): JSX.Element;
