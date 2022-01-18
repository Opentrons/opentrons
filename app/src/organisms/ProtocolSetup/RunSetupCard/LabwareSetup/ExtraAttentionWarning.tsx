import * as React from 'react'
import snakeCase from 'lodash/snakeCase'
import { Trans, useTranslation } from 'react-i18next'
import {
  Btn,
  Box,
  Flex,
  Icon,
  Text,
  ALIGN_FLEX_END,
  SIZE_2,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  COLOR_WARNING,
  COLOR_WARNING_LIGHT,
  C_DARK_GRAY,
  TEXT_DECORATION_UNDERLINE,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  COLOR_WARNING_DARK,
} from '@opentrons/components'
import { getModuleName } from './utils/getModuleName'
import { SecureLabwareModal } from './SecureLabwareModal'
import type { ModuleTypesThatRequiresExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'

interface ExtraAttentionWarningProps {
  moduleTypes: ModuleTypesThatRequiresExtraAttention[]
}

const ModuleWarning = (props: {
  moduleType: ModuleTypesThatRequiresExtraAttention
  onLinkClick: () => unknown
}): JSX.Element => {
  const { t } = useTranslation('protocol_setup')
  const moduleName = getModuleName(props.moduleType)
  return (
    <Box>
      <Text
        as="h5"
        marginTop={SPACING_2}
        marginBottom={SPACING_1}
        marginX={SPACING_2}
      >
        {moduleName}
      </Text>
      <Trans
        t={t}
        i18nKey={`${snakeCase(moduleName)}_attention_warning`}
        components={{
          block: (
            <Text
              marginX={SPACING_2}
              marginBottom={SPACING_2}
              fontSize={'0.7rem'}
            />
          ),
          a: (
            <Btn
              as={'span'}
              id={`ExtraAttentionWarning_${snakeCase(moduleName)}_link`}
              alignSelf={ALIGN_FLEX_END}
              onClick={props.onLinkClick}
              textDecoration={TEXT_DECORATION_UNDERLINE}
            />
          ),
        }}
      />
    </Box>
  )
}

export const ExtraAttentionWarning = (
  props: ExtraAttentionWarningProps
): JSX.Element | null => {
  const { moduleTypes } = props
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleTypesThatRequiresExtraAttention | null>(null)
  const { t } = useTranslation('protocol_setup')
  const [
    showExtraAttentionWarning,
    setHideExtraAttentionWarning,
  ] = React.useState(false)

  const isVisible = !showExtraAttentionWarning
  if (!isVisible) return null

  return (
    <React.Fragment>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
      <Box
        marginY={SPACING_3}
        backgroundColor={COLOR_WARNING_LIGHT}
        color={C_DARK_GRAY}
        id={'ExtraAttentionWarning'}
      >
        <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING_3}>
          <Flex margin={SPACING_2} justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Flex>
              <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
                <Icon name="alert-circle" color={COLOR_WARNING} />
              </Box>
              <Text
                as="h4"
                marginY={SPACING_2}
                id={`ExtraAttentionWarning_title`}
                color={COLOR_WARNING_DARK}
              >
                {t('extra_attention_warning_title')}
              </Text>
            </Flex>
            <Btn
              size={SIZE_2}
              onClick={() => setHideExtraAttentionWarning(true)}
              aria-label="close"
            >
              <Icon name={'close'} color={COLOR_WARNING} />
            </Btn>
          </Flex>
          {moduleTypes.map(moduleType => (
            <ModuleWarning
              key={moduleType}
              moduleType={moduleType}
              onLinkClick={() => setSecureLabwareModalType(moduleType)}
            />
          ))}
        </Flex>
      </Box>
    </React.Fragment>
  )
}
