import * as React from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation, Trans } from 'react-i18next'
import {
  Flex,
  Link,
  LEGACY_COLORS,
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
import {
  useTrackEvent,
  ANALYTICS_ADD_CUSTOM_LABWARE,
} from '../../redux/analytics'
import { UploadInput } from '../../molecules/UploadInput'
import type { Dispatch } from '../../redux/types'

export interface AddCustomLabwareSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
}

export function AddCustomLabwareSlideout(
  props: AddCustomLabwareSlideoutProps
): JSX.Element {
  const { t } = useTranslation(['labware_landing', 'shared'])
  const dispatch = useDispatch<Dispatch>()
  const trackEvent = useTrackEvent()

  return (
    <Slideout
      title={t('import_custom_def')}
      onCloseClick={props.onCloseClick}
      isExpanded={props.isExpanded}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
      >
        <UploadInput
          onUpload={(file: File) => {
            dispatch(addCustomLabwareFile(file.path))
          }}
          onClick={() => {
            dispatch(addCustomLabware())
            trackEvent({
              name: ANALYTICS_ADD_CUSTOM_LABWARE,
              properties: {},
            })
          }}
          uploadText={t('choose_file_to_upload')}
          dragAndDropText={
            <StyledText as="p">
              <Trans
                t={t}
                i18nKey="shared:drag_and_drop"
                components={{
                  a: (
                    <Link
                      color={COLORS.blue50}
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
