import { Session, CreateSessionData } from '@opentrons/api-client';
import { UseMutationResult, UseMutateFunction } from 'react-query';
export interface UseCreateSessionMutationResult extends UseMutationResult<Session, unknown, void> {
    createSession: UseMutateFunction<Session, unknown, void>;
}
export declare function useCreateSessionMutation(createSessionData: CreateSessionData): UseCreateSessionMutationResult;
