import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_START,
  LegacyStyledText,
  OVERFLOW_SCROLL,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { InterventionModal } from '/app/molecules/InterventionModal'
import { useIsFlex } from '/app/redux-resources/robots'

import type { ReactNode } from 'react'
import type { AttachedModule } from '@opentrons/api-client'

export interface IncompatibleModuleDesktopModalBodyProps {
  modules: AttachedModule[]
  robotName: string
}

export function IncompatibleModuleDesktopModalBody({
  modules,
  robotName,
}: IncompatibleModuleDesktopModalBodyProps): ReactNode {
  const { t } = useTranslation('incompatible_modules')
  const isFlex = useIsFlex(robotName)
  const displayName = isFlex ? 'Flex' : 'OT-2'
  return (
    <InterventionModal
      iconHeading={
        <Trans
          forwardedAs="h4"
          fontSize={TYPOGRAPHY.fontSizeH4}
          t={t}
          i18nKey="needs_your_assistance"
          values={{ robot_name: robotName }}
        />
      }
      type="error"
    >
      <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacing32}>
        <Flex
          overflowY={OVERFLOW_SCROLL}
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          maxHeight="196px"
          // forwardedAs="ul"
        >
          {modules.map(module => (
            <li key={module.id}>
              <Flex
                flexDirection={DIRECTION_ROW}
                width="100%"
                justifyContent={JUSTIFY_FLEX_START}
                alignItems={ALIGN_CENTER}
                paddingBottom={SPACING.spacing12}
              >
                <Icon
                  name="ot-alert"
                  size={SPACING.spacing32}
                  color={COLORS.red50}
                />
                <LegacyStyledText
                  forwardedAs="p"
                  key={module.id}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  paddingLeft={SPACING.spacing12}
                >
                  <Trans
                    i18nKey="is_not_compatible"
                    values={{
                      module_name: getModuleDisplayName(module.moduleModel),
                      robot_type: displayName,
                    }}
                    t={t}
                  />
                </LegacyStyledText>
              </Flex>
            </li>
          ))}
        </Flex>
        <LegacyStyledText forwardedAs="p" paddingTop={SPACING.spacing12}>
          <Trans t={t} i18nKey="remove_before_using" />
        </LegacyStyledText>
      </Flex>
    </InterventionModal>
  )
}
