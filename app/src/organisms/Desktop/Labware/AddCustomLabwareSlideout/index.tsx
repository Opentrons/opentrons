import { Trans, useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  Link,
  SPACING,
} from '@opentrons/components'

import { Slideout } from '/app/atoms/Slideout'
import { UploadInput } from '/app/molecules/UploadInput'
import {
  ANALYTICS_ADD_CUSTOM_LABWARE,
  useTrackEvent,
} from '/app/redux/analytics'
import {
  addCustomLabware,
  addCustomLabwareFile,
} from '/app/redux/custom-labware'
import { remote } from '/app/redux/shell/remote'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export interface AddCustomLabwareSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
}

export function AddCustomLabwareSlideout(
  props: AddCustomLabwareSlideoutProps
): ReactNode {
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
            void remote.getFilePathFrom(file).then(filePath => {
              dispatch(addCustomLabwareFile(filePath))
            })
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
            <LegacyStyledText forwardedAs="p">
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
            </LegacyStyledText>
          }
        />
      </Flex>
    </Slideout>
  )
}
