/// <reference types="react" />
export interface LabeledValueProps {
    /** Label */
    label: string;
    /** Value */
    value: string;
    /** Additional className */
    className?: string;
    /** Additional value className */
    valueClassName?: string;
}
export declare function LabeledValue(props: LabeledValueProps): JSX.Element;
