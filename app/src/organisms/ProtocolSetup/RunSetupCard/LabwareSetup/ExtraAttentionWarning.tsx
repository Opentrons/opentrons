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
  SPACING_5,
  COLOR_WARNING,
  COLOR_WARNING_LIGHT,
  C_DARK_GRAY,
  TEXT_DECORATION_UNDERLINE,
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
): JSX.Element => {
  const { moduleTypes } = props
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleTypesThatRequiresExtraAttention | null>(null)
  const { t } = useTranslation('protocol_setup')
  return (
    <React.Fragment>
      {secureLabwareModalType != null && (
        <SecureLabwareModal
          type={secureLabwareModalType}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
      <Box
        marginX={SPACING_5}
        marginY={SPACING_3}
        backgroundColor={COLOR_WARNING_LIGHT}
        color={C_DARK_GRAY}
        id={'ExtraAttentionWarning'}
      >
        <Box margin={SPACING_3}>
          <Flex margin={SPACING_2}>
            <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
              <Icon name="alert-circle" color={COLOR_WARNING} />
            </Box>
            <Text as="h4" marginY={SPACING_2}>
              {t('extra_attention_warning_title')}
            </Text>
          </Flex>
          {moduleTypes.map(moduleType => (
            <ModuleWarning
              key={moduleType}
              moduleType={moduleType}
              onLinkClick={() => setSecureLabwareModalType(moduleType)}
            />
          ))}
        </Box>
      </Box>
    </React.Fragment>
  )
}
