export interface ModelDropdownProps {
    fieldName: string;
    tabIndex: number;
    options: Array<{
        name: string;
        value: string;
        disabled?: boolean;
    }>;
}
export declare const ModelDropdown: (props: ModelDropdownProps) => JSX.Element;
