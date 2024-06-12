import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import { SPACING, StyledText, TYPOGRAPHY } from '@opentrons/components'
import { Slideout } from '../../atoms/Slideout'

import type { AbsorbanceReaderModule } from '../../redux/modules/types'

interface AbsorbanceReaderSlideoutProps {
  module: AbsorbanceReaderModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const AbsorbanceReaderSlideout = (
  props: AbsorbanceReaderSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const moduleName = getModuleDisplayName(module.moduleModel)

  const handleCloseSlideout = (): void => {
    onCloseClick()
  }

  return (
    <Slideout
      title={t('absorbance_reader', {
        name: moduleName,
      })}
      onCloseClick={handleCloseSlideout}
      isExpanded={isExpanded}
    >
      <StyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing4}
        data-testid={`AbsorbanceReaderSlideout_title_${module.serialNumber}`}
      >
        {t('set_absorbance_reader')}
      </StyledText>
    </Slideout>
  )
}
