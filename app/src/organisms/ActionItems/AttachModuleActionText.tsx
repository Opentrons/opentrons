import { getModuleDisplayName } from '@opentrons/shared-data'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { AttachingModuleAction } from '@opentrons/react-api-client/src/accessControl/types'
import type { ModuleModel } from '@opentrons/shared-data'

export const AttachModuleActionText = ({
  action,
  t,
  className,
}: {
  action: AttachingModuleAction
  t: TFunction
  className?: string
}): ReactNode => {
  const moduleName = getModuleDisplayName(
    action.module.moduleModel as ModuleModel
  )
  const text = t('attach_module', {
    module: moduleName,
  })

  return <div className={className}>{text}</div>
}
