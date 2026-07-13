import { POST, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type { HomeData, HomeResponse } from './types'

export function home(
  config: HostConfig,
  data: HomeData,
  userNotes?: string
): ResponsePromise<HomeResponse> {
  return request<HomeResponse, HomeData>(POST, '/robot/home', config, {
    body: data,
    userNotes,
  })
}
