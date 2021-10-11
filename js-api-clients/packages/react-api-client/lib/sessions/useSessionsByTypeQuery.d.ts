import { Sessions, SessionType } from '@opentrons/api-client';
import { UseQueryResult } from 'react-query';
export declare function useSessionsByTypeQuery(args: {
    sessionType: SessionType;
}): UseQueryResult<Sessions>;
