import * as React from 'react';
import { HostConfig } from '@opentrons/api-client';
export declare const ApiHostContext: React.Context<HostConfig | null>;
export interface ApiHostProviderProps {
    hostname: string;
    port?: number | null;
    children?: React.ReactNode;
}
export declare function ApiHostProvider(props: ApiHostProviderProps): JSX.Element;
