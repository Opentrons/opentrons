import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { LabwareListItem } from './LabwareListItem'

import type { Dispatch, SetStateAction } from 'react'
import type { LabwareDefinitionsByURI, StackItem } from '@opentrons/shared-data'
import type { OffDeckRenderGroup } from '/app/resources/protocols/utils/getOffDeckRenderGroups'

interface OffDeckLabwareListProps {
  offDeckItems: OffDeckRenderGroup[]
  isFlex: boolean
  definitionsByURI: LabwareDefinitionsByURI
  setSelectedStack: Dispatch<
    SetStateAction<{ slotName: string; stack: StackItem[] } | null>
  >
}
export function OffDeckLabwareList(
  props: OffDeckLabwareListProps
): JSX.Element | null {
  const { offDeckItems, isFlex, definitionsByURI, setSelectedStack } = props
  const { t } = useTranslation('protocol_setup')
  if (offDeckItems.length < 1) return null

  return (
    <>
      <LegacyStyledText
        forwardedAs="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        margin={`${SPACING.spacing16} ${SPACING.spacing16} ${SPACING.spacing8}`}
      >
        {t('additional_off_deck_labware')}
      </LegacyStyledText>
      <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
        {offDeckItems.map((offDeckGroup, index) => (
          <LabwareListItem
            key={index}
            attachedModuleInfo={{}}
            extraAttentionModules={[]}
            stackedItems={[offDeckGroup.representativeItem]}
            offDeckQuantity={offDeckGroup.quantity}
            slotName="offDeck"
            isFlex={isFlex}
            showLabwareSVG
            definitionsByURI={definitionsByURI}
            onClick={() => {
              setSelectedStack({
                slotName: 'offDeck',
                stack: offDeckGroup.stackedItems,
              })
            }}
          />
        ))}
      </Flex>
    </>
  )
}
