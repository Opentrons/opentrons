import { Health } from '@opentrons/api-client';
import { UseQueryResult } from 'react-query';
export declare function useHealthQuery(): UseQueryResult<Health>;
export declare function useHealth(): Health | undefined;
