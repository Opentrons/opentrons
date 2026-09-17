import { useTranslation } from 'react-i18next'

import { COLORS, ListItem, StyledText, Tag } from '@opentrons/components'

import styles from './flexstackertools.module.css'

import type { ReactNode } from 'react'

interface StackerContentItemProps {
  primaryLabwareName: string
  hasLid: boolean
  isTiprack: boolean
  quantity?: number
}
export function StackerContentItem(props: StackerContentItemProps): ReactNode {
  const { primaryLabwareName, hasLid, isTiprack, quantity } = props
  const { t } = useTranslation('form')
  return (
    <ListItem type="default" className={styles.list_item}>
      <StyledText desktopStyle="bodyDefaultRegular">
        {primaryLabwareName}
      </StyledText>
      {hasLid ? (
        <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
          {t(
            `step_edit_form.flex_stacker.with_lid.${isTiprack ? 'tiprack' : 'standard'}`
          )}
        </StyledText>
      ) : null}
      {quantity != null ? (
        <Tag
          text={t('step_edit_form.flex_stacker.quantity', {
            count: quantity,
          })}
          type="default"
          shrinkToContent
        />
      ) : null}
    </ListItem>
  )
}
