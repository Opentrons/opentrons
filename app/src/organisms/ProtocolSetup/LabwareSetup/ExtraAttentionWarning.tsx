import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Btn,
  Box,
  Link,
  Text,
  ALIGN_FLEX_END,
  SPACING_2,
  SPACING_3,
  SPACING_5,
  OVERLAY_LIGHT_GRAY_50,
  SPACING_1,
  C_DARK_GRAY,
  C_BLUE,
} from '@opentrons/components'
import { SecureLabwareModal } from './SecureLabwareModal'
import type { ModuleTypesThatRequiresExtraAttention } from './utils/getModuleTypesThatRequireExtraAttention'

interface ExtraAttentionWarningProps {
  moduleTypes: ModuleTypesThatRequiresExtraAttention[]
}
export const ExtraAttentionWarning = (
  props: ExtraAttentionWarningProps
): JSX.Element => {
  const { moduleTypes } = props
  const { t } = useTranslation('protocol_setup')
  const [
    secureLabwareModalType,
    setSecureLabwareModalType,
  ] = React.useState<ModuleTypesThatRequiresExtraAttention | null>(null)
  return (
    <React.Fragment>
      {secureLabwareModalType && (
        <SecureLabwareModal
          type={secureLabwareModalType}
          onCloseClick={() => setSecureLabwareModalType(null)}
        />
      )}
      <Box
        marginX={SPACING_5}
        marginY={SPACING_3}
        backgroundColor={OVERLAY_LIGHT_GRAY_50}
        color={C_DARK_GRAY}
      >
        <Text as="h5" margin={SPACING_2}>
          Some labware and modules require extra attention
        </Text>
        {moduleTypes.map(moduleType => {
          if (moduleType === 'magneticModuleType') {
            return (
              <Box>
                <Text
                  as="h5"
                  marginTop={SPACING_2}
                  marginBottom={SPACING_1}
                  marginX={SPACING_2}
                >
                  Magnetic Module
                </Text>
                <Trans
                  t={t}
                  i18nKey="magnetic_module_attention_warning"
                  components={{
                    block: <Text marginX={SPACING_2} fontSize={'0.7rem'} />,
                    a: (
                      <Btn
                        as={Link}
                        color={C_BLUE}
                        alignSelf={ALIGN_FLEX_END}
                        onClick={() =>
                          setSecureLabwareModalType('magneticModuleType')
                        }
                      />
                    ),
                  }}
                />
              </Box>
            )
          } else if (moduleType === 'thermocyclerModuleType') {
            return (
              <Box>
                <Text
                  as="h5"
                  marginTop={SPACING_2}
                  marginBottom={SPACING_1}
                  marginX={SPACING_2}
                >
                  Thermocycler
                </Text>
                <Trans
                  t={t}
                  i18nKey="thermocycler_attention_warning"
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
                        as={Link}
                        color={C_BLUE}
                        alignSelf={ALIGN_FLEX_END}
                        onClick={() =>
                          setSecureLabwareModalType('thermocyclerModuleType')
                        }
                      />
                    ),
                  }}
                />
              </Box>
            )
          } else {
            return null
          }
        })}
      </Box>
    </React.Fragment>
  )
}
