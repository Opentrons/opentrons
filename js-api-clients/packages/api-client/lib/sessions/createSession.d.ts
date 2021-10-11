import type { ResponsePromise } from '../request';
import type { HostConfig } from '../types';
import type { Session } from './types';
import { SessionType } from '.';
export interface CreateSessionData {
    sessionType: SessionType;
    createParams?: Record<string, unknown>;
}
export declare function createSession(config: HostConfig, data?: CreateSessionData): ResponsePromise<Session>;
