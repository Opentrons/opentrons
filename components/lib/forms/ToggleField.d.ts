import * as React from 'react';
export interface ToggleFieldProps {
    /** change handler */
    onChange: (event: React.SyntheticEvent<HTMLInputElement>) => unknown;
    /** checkbox is checked if value is true */
    value?: boolean;
    /** classes to apply */
    className?: string;
    /** classes to apply to inner label text div */
    labelTextClassName?: string | null | undefined;
    /** name of field in form */
    name?: string;
    /** label text for toggled off */
    offLabel?: string;
    /** label text for toggled on */
    onLabel?: string;
    /** checkbox is disabled if value is true */
    disabled?: boolean;
    /** html tabindex property */
    tabIndex?: number;
}
export declare function ToggleField(props: ToggleFieldProps): JSX.Element;
