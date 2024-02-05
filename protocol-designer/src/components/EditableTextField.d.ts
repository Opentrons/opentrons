/// <reference types="react" />
interface Props {
    className?: string;
    value?: string | null;
    saveEdit: (newValue: string) => unknown;
}
export declare function EditableTextField(props: Props): JSX.Element;
export {};
