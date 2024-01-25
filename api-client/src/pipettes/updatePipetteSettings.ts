import { PATCH, request } from '../request'

import type { ResponsePromise } from '../request'
import type { HostConfig } from '../types'
import type {
  IndividualPipetteSettings,
  UpdatePipetteSettingsData,
} from './types'

export function updatePipetteSettings(
  config: HostConfig,
  pipetteId: string,
  data: UpdatePipetteSettingsData
): ResponsePromise<IndividualPipetteSettings> {
  return request<IndividualPipetteSettings, UpdatePipetteSettingsData>(
    PATCH,
    `/settings/pipettes/${pipetteId}`,
    data,
    config
  )
}
