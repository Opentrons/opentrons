import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getOffDeckRenderInfo } from '@opentrons/shared-data'

import { LabwareListItem } from './LabwareListItem'

import type { Dispatch, SetStateAction } from 'react'
import type {
  LabwareDefinitionsByURI,
  StackedItemsOnDeck,
  StackItem,
} from '@opentrons/shared-data'

interface OffDeckLabwareListProps {
  labwareItems: StackedItemsOnDeck
  isFlex: boolean
  definitionsByURI: LabwareDefinitionsByURI
  setSelectedStack: Dispatch<
    SetStateAction<{ slotName: string; stack: StackItem[] } | null>
  >
}
export function OffDeckLabwareList(
  props: OffDeckLabwareListProps
): JSX.Element | null {
  const { labwareItems, isFlex, definitionsByURI, setSelectedStack } = props
  const { t } = useTranslation('protocol_setup')
  const offDeckItems = getOffDeckRenderInfo(labwareItems)
  if (offDeckItems.length < 1) return null
  return (
    <>
      <LegacyStyledText
        as="h3"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        margin={`${SPACING.spacing16} ${SPACING.spacing16} ${SPACING.spacing8}`}
      >
        {t('additional_off_deck_labware')}
      </LegacyStyledText>
      <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
        {offDeckItems.map((labwareItem, index) => (
          <LabwareListItem
            key={index}
            attachedModuleInfo={{}}
            extraAttentionModules={[]}
            stackedItems={[labwareItem]}
            offDeckQuantity={labwareItem.quantity}
            slotName="offDeck"
            isFlex={isFlex}
            showLabwareSVG
            definitionsByURI={definitionsByURI}
            onClick={() => {
              setSelectedStack({ slotName: 'offDeck', stack: [labwareItem] })
            }}
          />
        ))}
      </Flex>
    </>
  )
}
