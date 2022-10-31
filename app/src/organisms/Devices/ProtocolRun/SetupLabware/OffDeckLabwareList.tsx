import { SPACING, TYPOGRAPHY } from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../../../atoms/text'
import { LabwareListItem } from './LabwareListItem'
import type { ModuleTypesThatRequiresExtraAttention } from '../../../ProtocolSetup/RunSetupCard/LabwareSetup/utils/getModuleTypesThatRequireExtraAttention'
import type { ModuleRenderInfoForProtocol } from '../../hooks'
import type { LabwareSetupItem } from './types'

interface OffDeckLabwareList {
  labwareItems: LabwareSetupItem[]
  attachedModuleInfo: { [moduleId: string]: ModuleRenderInfoForProtocol }
  extraAttentionModules: ModuleTypesThatRequiresExtraAttention[]
}
export function OffDeckLabwareList(props: OffDeckLabwareList): JSX.Element | null {
  const { labwareItems, attachedModuleInfo, extraAttentionModules } = props
  const { t } = useTranslation('protocol_setup')
  if (labwareItems.length < 1) return null
  return (
    <>
      <StyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        marginTop={SPACING.spacing4}
        marginBottom={SPACING.spacing3}
      >
        {t('additional_off_deck_labware')}
      </StyledText>
      {labwareItems.map((labwareItem, index) => (
        <LabwareListItem
          key={index}
          attachedModuleInfo={attachedModuleInfo}
          extraAttentionModules={extraAttentionModules}
          {...labwareItem}
        />
      ))}
    </>
  )
}