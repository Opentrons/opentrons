import * as React from 'react';
export interface TextInputProps {
    onChange: (value: string) => unknown;
    placeholder: string;
    children?: React.ReactNode;
}
export declare function TextInput(props: TextInputProps): JSX.Element;
