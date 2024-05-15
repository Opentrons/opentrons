import * as React from 'react'
import { useTranslation } from 'react-i18next'
<<<<<<< HEAD
import { COLORS, TYPOGRAPHY, StyledText } from '@opentrons/components'
<<<<<<< HEAD
=======
import { COLORS, TYPOGRAPHY } from '@opentrons/components'
>>>>>>> 9359adf484 (chore(monorepo): migrate frontend bundling from webpack to vite (#14405))
import { MAGNETIC_MODULE_V1, MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
=======
import { MAGNETIC_MODULE_V2 } from '@opentrons/shared-data'
>>>>>>> f3c86ff7d8 (fix(app, components, protocol-designer, shared-data): import type lint rule to error, fix occurrences (#15168))
import { StatusLabel } from '../../atoms/StatusLabel'
import type { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import type { MagneticStatus } from '../../redux/modules/api-types'

interface MagModuleProps {
  moduleStatus: MagneticStatus
  moduleHeight: number
  moduleModel: typeof MAGNETIC_MODULE_V1 | typeof MAGNETIC_MODULE_V2
}

export const MagneticModuleData = (
  props: MagModuleProps
): JSX.Element | null => {
  const { moduleStatus, moduleHeight, moduleModel } = props
  const { t } = useTranslation('device_details')

  return (
    <>
      <StatusLabel
        status={moduleStatus}
        backgroundColor={COLORS.blue30}
        iconColor={COLORS.blue60}
        pulse={moduleStatus === 'engaged'}
      />
      <StyledText
        fontSize={TYPOGRAPHY.fontSizeCaption}
        data-testid="mag_module_data"
      >
        {t(
          moduleModel === MAGNETIC_MODULE_V2
            ? 'magdeck_gen2_height'
            : 'magdeck_gen1_height',
          {
            height: moduleHeight,
          }
        )}
      </StyledText>
    </>
  )
}
