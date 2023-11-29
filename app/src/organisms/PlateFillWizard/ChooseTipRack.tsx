import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SPACING,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { MediumButton, SmallButton } from '../../atoms/buttons'
import { LabwareDefinition2, getLabwareDefURI, getLabwareDisplayName } from '@opentrons/shared-data'

interface ChooseTipRackProps {
  handleGoBack: () => void
  handleProceed: () => void
  handleChooseTipRack: (tipRackDef: LabwareDefinition2) => void
  allTipRackDefs: LabwareDefinition2[]
}

export const ChooseTipRack = (
  props: ChooseTipRackProps
): JSX.Element | null => {
  const {
    handleProceed,
    handleGoBack,
    handleChooseTipRack,
    allTipRackDefs,
  } = props
  const [selectedTipRackDef, setSelectedTipRackDef] = React.useState(allTipRackDefs[0])
  const { t } = useTranslation(['plate_fill_wizard', 'shared'])

  return (
    <Flex
      width="100%"
      alignItems={ALIGN_CENTER}
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing24}
      padding={SPACING.spacing32}
    >
      <Flex paddingBottom={SPACING.spacing8}>
        {allTipRackDefs.map(tipRackDef => (
          <MediumButton
            key={getLabwareDefURI(tipRackDef)}
            buttonType={
              getLabwareDefURI(tipRackDef) === getLabwareDefURI(selectedTipRackDef) ? 'primary' : 'secondary'
            }
            flex="1"
            onClick={() => setSelectedTipRackDef(tipRackDef)}
            buttonText={getLabwareDisplayName(tipRackDef)}
            justifyContent={JUSTIFY_FLEX_START}
            paddingLeft={SPACING.spacing8}
          />
        ))}
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END} width="100%">
        <SmallButton
          buttonText={t('back')}
          onClick={() => handleGoBack()}
        />
        <SmallButton
          buttonText={t('confirm_tip_rack')}
          onClick={() => {
            handleChooseTipRack(selectedTipRackDef)
            handleProceed()
          }}
        />
      </Flex>
    </Flex>
  )
}
