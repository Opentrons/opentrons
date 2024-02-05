import type { AlertLevel } from './types';
interface WarningContentsProps {
    warningType: string;
    level: AlertLevel;
}
export declare const WarningContents: (props: WarningContentsProps) => JSX.Element | null;
export {};
