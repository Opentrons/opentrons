import { Flex } from '@opentrons/components'

import { useTranslation } from 'react-i18next'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { TwoColumn, DeckMapContent } from '/app/molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { getSlotNameAndLwLocFrom } from '../hooks/useDeckMapUtils'

import type { RecoveryContentProps } from '../types'

export function ReplaceTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    routeUpdateActions,
    failedPipetteInfo,
    failedLabwareUtils,
    deckMapUtils,
  } = props
  const { relevantWellName, failedLabware } = failedLabwareUtils
  const { proceedNextStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }
  const [slot] = getSlotNameAndLwLocFrom(failedLabware?.location ?? null, false)
  const buildTitle = (): string => {
    if (failedPipetteInfo?.data.channels === 96) {
      return t('replace_with_new_tip_rack', { slot })
    } else {
      return t('replace_used_tips_in_rack_location', {
        location: relevantWellName,
        slot,
      })
    }
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={buildTitle()}
          type="location"
          bannerText={t('replace_tips_and_select_location')}
        />
        <Flex marginTop="1.742rem">
          <DeckMapContent {...deckMapUtils} />
        </Flex>
      </TwoColumn>
      <RecoveryFooterButtons primaryBtnOnClick={primaryOnClick} />
    </RecoverySingleColumnContentWrapper>
  )
}
