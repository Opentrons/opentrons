import * as React from 'react'

import { Flex } from '@opentrons/components'

import { useTranslation } from 'react-i18next'
import { RecoverySingleColumnContent } from './RecoverySingleColumnContent'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { LeftColumnLabwareInfo } from './LeftColumnLabwareInfo'
import { RecoveryMap } from './RecoveryMap'

import type { RecoveryContentProps } from '../types'

export function ReplaceTips(props: RecoveryContentProps): JSX.Element | null {
  const {
    isOnDevice,
    routeUpdateActions,
    failedPipetteInfo,
    failedLabwareUtils,
  } = props
  const { relevantWellName } = failedLabwareUtils
  const { proceedNextStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    void proceedNextStep()
  }

  const buildTitle = (): string => {
    if (failedPipetteInfo?.data.channels === 96) {
      return t('replace_with_new_tip_rack')
    } else {
      return t('replace_used_tips_in_rack_location', {
        location: relevantWellName,
      })
    }
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <LeftColumnLabwareInfo
            {...props}
            title={buildTitle()}
            moveType="refill"
            bannerText={t('replace_tips_and_select_location')}
          />
          <Flex marginTop="1.742rem">
            <RecoveryMap {...props} />
          </Flex>
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryOnClick}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
