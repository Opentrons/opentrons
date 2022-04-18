import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'
import {
  Flex,
  Link,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import {
  addCustomLabwareFile,
  addCustomLabware,
} from '../../redux/custom-labware'
import { Slideout } from '../../atoms/Slideout'
import { StyledText } from '../../atoms/text'
import { UploadInput } from '../../molecules/UploadInput'
import type { Dispatch } from '../../redux/types'

export interface AddCustomLabwareProps {
  isExpanded: boolean
  onCloseClick: () => void
  onSuccess: () => void
  onFailure: () => void
}

export function AddCustomLabware(props: AddCustomLabwareProps): JSX.Element {
  const { t } = useTranslation('labware_landing')
  const dispatch = useDispatch<Dispatch>()

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
        <UploadInput
          onUpload={(file: File) => {
            dispatch(addCustomLabwareFile(file.path))
          }}
          onClick={() => dispatch(addCustomLabware())}
          uploadText={t('choose_file_to_upload')}
          dragAndDropText={
            <StyledText as="p">
              <Trans
                t={t}
                i18nKey="drag_and_drop"
                components={{
                  a: (
                    <Link
                      color={COLORS.blue}
                      onClick={() => dispatch(addCustomLabware())}
                      role="button"
                    />
                  ),
                }}
              />
            </StyledText>
          }
        />
      </Flex>
    </Slideout>
  )
}
