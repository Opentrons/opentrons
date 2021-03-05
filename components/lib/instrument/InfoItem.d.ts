/// <reference types="react" />
export interface InfoItemProps {
    title: string;
    value: string;
    className?: string;
}
/**
 * Used by `InstrumentInfo` for its titled values.
 * But if you're using this, you probably want `LabeledValue` instead.
 */
export declare function InfoItem(props: InfoItemProps): JSX.Element;
