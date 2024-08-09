import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, SPACING, StyledText } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { WizardBody } from './WizardBody'

import type { WizardTileProps } from './types'

export function SelectModules(props: WizardTileProps): JSX.Element | null {
  const { goBack, proceed, watch } = props
  const { t } = useTranslation(['create_new_protocol', 'shared'])
  const fields = watch('fields')
  const robotType = fields.robotType
  return (
    <WizardBody
      stepNumber={robotType === FLEX_ROBOT_TYPE ? 4 : 3}
      header={t('add_modules')}
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
          {t('which_mods')}
        </StyledText>
        <Flex gridGap={SPACING.spacing4}>TODO: add module info</Flex>
      </>
    </WizardBody>
  )
}
