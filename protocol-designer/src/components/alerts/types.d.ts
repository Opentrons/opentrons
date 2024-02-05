import { ReactNode } from 'react';
export type AlertLevel = 'timeline' | 'form';
export type AlertType = 'error' | 'warning';
export interface AlertData {
    title: string;
    description: ReactNode;
    dismissId?: string;
}
