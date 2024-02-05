export interface SlotDropdownProps {
    fieldName: string;
    disabled: boolean;
    tabIndex: number;
    options: Array<{
        name: string;
        value: string;
        disabled?: boolean;
    }>;
}
export declare const SlotDropdown: (props: SlotDropdownProps) => JSX.Element;
