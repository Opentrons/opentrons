import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  FLEX_ROBOT_TYPE,
  ModuleLocation,
  getDeckDefFromRobotType,
  getModuleDisplayName,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  RESPONSIVENESS,
  TYPOGRAPHY,
  SPACING,
  SIZE_1,
  DeckLocationSelect,
} from '@opentrons/components'
import { Banner } from '../../atoms/Banner'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import type { ModuleCalibrationWizardStepProps } from './types'

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`
interface SelectLocationProps extends ModuleCalibrationWizardStepProps {
  setSlotName: React.Dispatch<React.SetStateAction<string>>
  availableSlotNames: string[]
}
export const SelectLocation = (
  props: SelectLocationProps
): JSX.Element | null => {
  const {
    proceed,
    attachedModule,
    slotName,
    setSlotName,
    availableSlotNames,
  } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  const handleOnClick = (): void => {
    proceed()
  }
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const bodyText = (
    <>
      <Banner type="warning" size={SIZE_1} marginY={SPACING.spacing4}>
        {t('module_secured')}
      </Banner>
      <StyledText css={BODY_STYLE}>
        {t('select_the_slot', { module: moduleName })}
      </StyledText>
    </>
  )
  return (
    <GenericWizardTile
      header={t('select_location')}
      rightHandBody={
        <DeckLocationSelect
          deckDef={deckDef}
          selectedLocation={{ slotName }}
          setSelectedLocation={loc => setSlotName(loc.slotName)}
          disabledLocations={deckDef.locations.addressableAreas.reduce<
            ModuleLocation[]
          >((acc, slot) => {
            if (availableSlotNames.some(slotName => slotName === slot.id))
              return acc
            return [...acc, { slotName: slot.id }]
          }, [])}
          isThermocycler={
            attachedModule.moduleType === THERMOCYCLER_MODULE_TYPE
          }
        />
      }
      bodyText={bodyText}
      proceedButtonText={t('confirm_location')}
      proceed={handleOnClick}
    />
  )
}
