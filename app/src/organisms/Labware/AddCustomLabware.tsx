import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
import { useAddLabware } from './hooks'

export interface AddCustomLabwareProps {
  isExpanded: boolean
  onCloseClick: () => unknown
}

export function AddCustomLabware(props: AddCustomLabwareProps): JSX.Element {
  const { t } = useTranslation('labware_landing')

  return (
    <Slideout
      title={t('import_custom_def')}
      onCloseClick={props.onCloseClick}
      isExpanded={props.isExpanded}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing4}
      >
        <StyledText as="p">{t('choose_file_to_upload')}</StyledText>
        <PrimaryButton onClick={useAddLabware()}>
          {t('choose_file')}
        </PrimaryButton>
      </Flex>
    </Slideout>
  )
}
