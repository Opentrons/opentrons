interface ButtonRowProps {
    handleClickMoreOptions: () => unknown;
    handleClose: () => unknown;
    handleSave: () => unknown;
    handleDelete: () => unknown;
    canSave: boolean;
}
export declare const ButtonRow: (props: ButtonRowProps) => JSX.Element;
export {};
