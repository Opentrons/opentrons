import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  RESPONSIVENESS,
  TYPOGRAPHY,
} from '@opentrons/components'
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

export const FirmwareUpdate = (
  props: ModuleCalibrationWizardStepProps
): JSX.Element | null => {
  const { proceed, goBack } = props
  const { t } = useTranslation('module_wizard_flows')
  const handleOnClick = (): void => {
    proceed()
  }
  const bodyText = (
    <>
      <StyledText css={BODY_STYLE}>
        TODO: FIRMWARE UPDATE CONTENTS
      </StyledText>
    </>
  )
  return (
    <GenericWizardTile
      header={t('update_firmware')}
      rightHandBody={bodyText}
      bodyText={bodyText}
      proceedButtonText={t('continue')}
      proceed={handleOnClick}
      back={goBack}
    />
  )
}
