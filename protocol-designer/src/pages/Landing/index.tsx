import * as React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'

export function Landing(): JSX.Element {
  const { t } = useTranslation('shared')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING.spacing24}>
      {t('create_opentrons_protocol')}
      <Flex
        alignItems={ALIGN_CENTER}
        marginTop={SPACING.spacing24}
        gridGap={SPACING.spacing16}
      >
        <NavLink to={'/createNew'}>{t('create_new')}</NavLink>
        {t('import')}
      </Flex>
    </Flex>
  )
}
