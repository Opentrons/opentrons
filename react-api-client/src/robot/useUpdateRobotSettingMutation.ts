import { useMutation } from 'react-query'
import { updateRobotSetting } from '@opentrons/api-client'
import { useHost } from '../api'

import type { AxiosError } from 'axios'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from 'react-query'
import type {
  ErrorResponse,
  HostConfig,
  RobotSettings,
} from '@opentrons/api-client'

export interface UpdateRobotSettingVariables {
  id: string
  value: boolean
}

export type UseUpdateRobotSettingMutationResult = UseMutationResult<
  RobotSettings,
  AxiosError<ErrorResponse>,
  UpdateRobotSettingVariables
> & {
  updateRobotSetting: UseMutateFunction<
    RobotSettings,
    AxiosError<ErrorResponse>,
    UpdateRobotSettingVariables
  >
}

export type UseUpdateRobotSettingnMutationOptions = UseMutationOptions<
  RobotSettings,
  AxiosError<ErrorResponse>,
  UpdateRobotSettingVariables
>

export function useUpdateRobotSettingMutation(
  options: UseUpdateRobotSettingnMutationOptions = {}
): UseUpdateRobotSettingMutationResult {
  const host = useHost()
  // const queryClient = useQueryClient()

  const mutation = useMutation<
    RobotSettings,
    AxiosError<ErrorResponse>,
    UpdateRobotSettingVariables
  >(
    [host, 'robot_settings'],
    ({ id, value }) =>
      updateRobotSetting(host as HostConfig, id, value).then(response => {
        // TODO: investigate ODD top level behavior when invalidating this query
        // queryClient
        //   .invalidateQueries([host, 'robot_settings'])
        //   .catch((e: Error) => {
        //     throw e
        //   })
        return response.data?.settings ?? []
      }),
    options
  )
  return {
    ...mutation,
    updateRobotSetting: mutation.mutate,
  }
}
