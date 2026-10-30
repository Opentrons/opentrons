import { useTranslation } from 'react-i18next'

import { DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'

import { DeckMapContent, TwoColumn } from '/app/molecules/InterventionModal'
import { LeftColumnLabwareInfo } from '/app/organisms/ErrorRecoveryFlows/shared/LeftColumnLabwareInfo'
import { RecoverySingleColumnContentWrapper } from '/app/organisms/ErrorRecoveryFlows/shared/RecoveryContentWrapper'
import { RecoveryFooterButtons } from '/app/organisms/ErrorRecoveryFlows/shared/RecoveryFooterButtons'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '/app/organisms/ErrorRecoveryFlows/types'

export function FillWell(props: RecoveryContentProps): ReactNode {
  const { routeUpdateActions, failedLabwareUtils, deckMapUtils } = props
  const { t } = useTranslation('error_recovery')
  const { goBackPrevStep, proceedNextStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          <LeftColumnLabwareInfo
            {...props}
            title={t('manually_fill_liquid_in_well', {
              well: failedLabwareUtils.relevantPickUpTipWellName,
            })}
            type="location"
            layout="default"
          />
        </Flex>
        <Flex marginTop="1.742rem">
          <DeckMapContent {...deckMapUtils} />
        </Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
