import type { ResponsePromise } from '../request';
import type { HostConfig } from '../types';
import type { Sessions, SessionType } from './types';
export declare function getSessions(config: HostConfig, params?: {
    session_type: SessionType;
}): ResponsePromise<Sessions>;
