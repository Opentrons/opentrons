import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, SPACING, StyledText } from '@opentrons/components'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectFixtures(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])

  return (
    <WizardBody
      stepNumber={5}
      header={t('add_fixtures')}
      disabled={false}
      goBack={() => {
        goBack(1)
      }}
      proceed={() => {
        proceed(1)
      }}
    >
      <>
        <StyledText
          desktopStyle="headingSmallBold"
          marginBottom={SPACING.spacing16}
        >
          {t('which_fixtures')}
        </StyledText>
        <Flex gridGap={SPACING.spacing4}>TODO: add fixture info</Flex>
      </>
    </WizardBody>
  )
}
