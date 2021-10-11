import type { ResponsePromise } from '../request';
import type { HostConfig } from '../types';
import type { Session } from './types';
export declare function getSession(config: HostConfig, sessionId: string): ResponsePromise<Session>;
