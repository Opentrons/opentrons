import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  RESPONSIVENESS,
  TYPOGRAPHY,
  SPACING,
  SIZE_1,
  Flex,
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

export const SelectLocation = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, attachedModule } = props
  const { t } = useTranslation('module_wizard_flows')
  const moduleName = getModuleDisplayName(attachedModule.moduleModel)
  // TODO: keep track of the selected slot in a state variable that can be
  // used in calibration step
  const handleOnClick = (): void => {
    proceed()
  }
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
      // TODO: swap this out with the deck map
      // if slot != null it will be pre-selected
      rightHandBody={<Flex>TODO: DECK LOCATION SELECT</Flex>}
      bodyText={bodyText}
      proceedButtonText={t('confirm_location')}
      proceed={handleOnClick}
    />
  )
}
