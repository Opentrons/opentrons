import * as React from 'react';
export interface RadioGroupProps {
    /** blur handler */
    onBlur?: React.FocusEventHandler;
    /** change handler */
    onChange: React.ChangeEventHandler;
    /** value that is checked */
    value?: string;
    /** Array of {name, value} data with optional children */
    options?: Array<{
        name: string;
        value: string;
        children?: React.ReactNode;
    }>;
    /** Show radio buttons inline instead of stacked */
    inline?: boolean;
    /** classes to apply to outer div */
    className?: string;
    /** classes to apply to inner label text div */
    labelTextClassName?: string | null | undefined;
    /** if is included, RadioGroup will use error style. The content of the string is ignored. */
    error?: string | null | undefined;
    /** 'name' attr of input */
    name?: string;
}
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
