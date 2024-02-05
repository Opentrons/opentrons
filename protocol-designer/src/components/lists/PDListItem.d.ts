/// <reference types="react" />
interface Props {
    className?: string | null;
    /** show light gray border between list items */
    border?: boolean | null;
    /** hover style when hovered (for redux-linked hover state, do not use this) */
    hoverable?: boolean | null;
    [key: string]: unknown;
}
/** Light wrapper around li for PD-specific styles */
export declare function PDListItem(props: Props): JSX.Element;
export {};
