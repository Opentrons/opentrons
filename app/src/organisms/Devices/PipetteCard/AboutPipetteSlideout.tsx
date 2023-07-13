import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  PrimaryButton,
  TYPOGRAPHY,
  COLORS,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { StyledText } from '../../../atoms/text'
import { Slideout } from '../../../atoms/Slideout'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs, PipetteMount } from '@opentrons/shared-data'

interface AboutPipetteSlideoutProps {
  pipetteId: AttachedPipette['id']
  pipetteName: PipetteModelSpecs['displayName']
  mount: PipetteMount
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const AboutPipetteSlideout = (
  props: AboutPipetteSlideoutProps
): JSX.Element | null => {
  const { pipetteId, pipetteName, isExpanded, mount, onCloseClick } = props
  const { t } = useTranslation(['device_details', 'shared'])
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrumentInfo =
    attachedInstruments?.data?.find(
      (i): i is PipetteData =>
        i.instrumentType === 'pipette' && i.ok && i.mount === mount
    ) ?? null

  return (
    <Slideout
      title={t('about_pipette_name', { name: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          onClick={onCloseClick}
          width="100%"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          data-testid="AboutPipette_slideout_close"
        >
          {t('shared:close')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {instrumentInfo?.firmwareVersion != null && (
          <>
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkGreyEnabled}
              textTransform={TYPOGRAPHY.textTransformUppercase}
            >
              {t('current_version')}
            </StyledText>
            <StyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing12}
            >
              {instrumentInfo.firmwareVersion}
            </StyledText>
          </>
        )}
        <StyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkGreyEnabled}
          data-testid={`AboutPipetteSlideout_serial_number_text_${pipetteId}`}
          textTransform={TYPOGRAPHY.textTransformUppercase}
        >
          {t('serial_number')}
        </StyledText>
        <StyledText
          as="p"
          paddingTop={SPACING.spacing4}
          data-testid={`AboutPipetteSlideout_serial_${pipetteId}`}
        >
          {pipetteId}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
