import type { AlertData, AlertType } from './types';
interface PDAlertProps {
    alertType: AlertType;
    title: string;
    description: AlertData['description'];
    onDismiss?: (() => unknown) | null;
}
export declare const PDAlert: (props: PDAlertProps) => JSX.Element;
export {};
