import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { LabwareListItem } from './LabwareListItem'
import type { LabwareSetupItem } from './types'

interface OffDeckLabwareListProps {
  labwareItems: LabwareSetupItem[]
}
export function OffDeckLabwareList(
  props: OffDeckLabwareListProps
): JSX.Element | null {
  const { labwareItems } = props
  const { t } = useTranslation('protocol_setup')
  if (labwareItems.length < 1) return null
  return (
    <>
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        margin={`${SPACING.spacing4} ${SPACING.spacing4} ${SPACING.spacing3}`}
      >
        {t('additional_off_deck_labware')}
      </StyledText>
      {labwareItems.map((labwareItem, index) => (
        <LabwareListItem
          key={index}
          attachedModuleInfo={{}}
          extraAttentionModules={[]}
          {...labwareItem}
        />
      ))}
    </>
  )
}
