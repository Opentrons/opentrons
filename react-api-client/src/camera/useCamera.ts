import { useQuery } from 'react-query'
import type { AxiosError } from 'axios'
import {GetCamera} from '@opentrons/api-client'

import { useHost } from '../api'

import type { UseQueryResult } from 'react-query'
import type { HostConfig, CameraResponse } from '@opentrons/api-client'

export function useCamera(): UseQueryResult<CameraResponse, AxiosError>{
    const host = useHost()
    console.log("test")
    const query = useQuery<CameraResponse, AxiosError>(
    [useHost, 'camera'],
    () =>
        GetCamera(host as HostConfig).then(response => response.data).catch((e:AxiosError)=> {
            throw e
        }),
        { enabled: host !== null}

)
    console.log("🚀 ~ useCamera ~ query:", query)
return query
}