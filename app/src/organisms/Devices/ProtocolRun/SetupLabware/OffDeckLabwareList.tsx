import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SPACING, TYPOGRAPHY } from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'
import { LabwareListItem } from './LabwareListItem'
import type { RunTimeCommand } from '@opentrons/shared-data'
import type { LabwareSetupItem } from '../../../../pages/Protocols/utils'

interface OffDeckLabwareListProps {
  labwareItems: LabwareSetupItem[]
  isFlex: boolean
  commands: RunTimeCommand[]
}
export function OffDeckLabwareList(
  props: OffDeckLabwareListProps
): JSX.Element | null {
  const { labwareItems, isFlex, commands } = props
  const { t } = useTranslation('protocol_setup')
  if (labwareItems.length < 1) return null
  return (
    <>
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        margin={`${SPACING.spacing16} ${SPACING.spacing16} ${SPACING.spacing8}`}
      >
        {t('additional_off_deck_labware')}
      </StyledText>
      {labwareItems.map((labwareItem, index) => (
        <LabwareListItem
          key={index}
          attachedModuleInfo={{}}
          extraAttentionModules={[]}
          {...labwareItem}
          isFlex={isFlex}
          commands={commands}
          nestedLabwareInfo={null}
        />
      ))}
    </>
  )
}
