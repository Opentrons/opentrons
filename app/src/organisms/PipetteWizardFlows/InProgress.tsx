import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TYPOGRAPHY, SPACING } from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'

export function InProgress(): JSX.Element {
  const { t } = useTranslation('pipette_wizard_flows')

  return (
    <InProgressModal>
      <StyledText
        css={TYPOGRAPHY.h1Default}
        marginTop={SPACING.spacing5}
        marginBottom={SPACING.spacing3}
      >
        {t('stand_back')}
      </StyledText>
    </InProgressModal>
  )
}
