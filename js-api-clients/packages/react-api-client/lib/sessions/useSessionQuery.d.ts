import { Session } from '@opentrons/api-client';
import { UseQueryResult } from 'react-query';
export declare function useSessionQuery(sessionId: string): UseQueryResult<Session>;
