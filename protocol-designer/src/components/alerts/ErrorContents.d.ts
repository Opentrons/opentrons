import type { AlertLevel } from './types';
interface ErrorContentsProps {
    errorType: string;
    level: AlertLevel;
}
export declare const ErrorContents: (props: ErrorContentsProps) => JSX.Element | null;
export {};
