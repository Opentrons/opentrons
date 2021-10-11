import type { ResponsePromise } from '../request';
import type { HostConfig } from '../types';
import type { Health } from './types';
export declare function getHealth(config: HostConfig): ResponsePromise<Health>;
