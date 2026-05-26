import { useMutation } from 'react-query'

import { getOAuth2Token } from '@opentrons/api-client'

import { getQueryKey, useHost } from '../../api'

import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  HostConfig,
  OAuth2TokenResponse,
  RefreshRequest,
  Response,
  ROPCRequest,
} from '@opentrons/api-client'

export type GetOAuth2TokenMutationResult = UseMutationResult<
  Response<OAuth2TokenResponse>,
  unknown,
  ROPCRequest | RefreshRequest
> & {
  getOAuth2Token: UseMutateFunction<
    Response<OAuth2TokenResponse>,
    unknown,
    ROPCRequest | RefreshRequest
  >
}

export type GetOAuth2TokenMutationOptions = UseMutationOptions<
  Response<OAuth2TokenResponse>,
  unknown,
  ROPCRequest | RefreshRequest
>

export function useGetOAuth2TokenMutation(
  options: GetOAuth2TokenMutationOptions = {},
  hostOverride?: HostConfig | null
): GetOAuth2TokenMutationResult {
  const contextHost = useHost()
  const host =
    hostOverride != null ? { ...contextHost, ...hostOverride } : contextHost

  const mutation = useMutation(
    getQueryKey(host, 'auth/oauth2/token'),
    body => getOAuth2Token(host!, body),
    options
  )
  return {
    ...mutation,
    getOAuth2Token: mutation.mutate,
  }
}
