import * as React from 'react';
export interface WellMouseEvent {
    wellName: string;
    event: React.MouseEvent;
}
export declare type WellFill = Record<string, string>;
export declare type WellGroup = Record<string, null>;
