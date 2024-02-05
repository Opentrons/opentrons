import * as React from 'react';
import { TerminalItemId } from '../../../steplist';
export { TerminalItemLink } from './TerminalItemLink';
export interface TerminalItemProps {
    children?: React.ReactNode;
    id: TerminalItemId;
    title: string;
}
export declare const TerminalItem: (props: TerminalItemProps) => JSX.Element;
