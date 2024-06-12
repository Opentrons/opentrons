import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TYPOGRAPHY, StyledText } from '@opentrons/components'
import type { AbsorbanceReaderModule } from '../../redux/modules/types'

interface AbsorbanceReaderProps {
  moduleData: AbsorbanceReaderModule['data']
}

export const AbsorbanceReaderData = (
  props: AbsorbanceReaderProps
): JSX.Element | null => {
  const { moduleData } = props
  const { t } = useTranslation('device_details')

  return (
    <>
      <StyledText
        fontSize={TYPOGRAPHY.fontSizeCaption}
        data-testid="abs_module_data"
      >
        {t('abs_reader_status', {
          status: moduleData.status,
        })}
      </StyledText>
    </>
  )
}
