import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Btn,
  Box,
  Flex,
  Icon,
  Text,
  SIZE_2,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  COLOR_WARNING,
  COLOR_WARNING_LIGHT,
  C_DARK_GRAY,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  COLOR_WARNING_DARK,
} from '@opentrons/components'

interface UnMatchedModuleWarningProps {
  isAnyModuleUnnecessary: boolean
}

export const UnMatchedModuleWarning = (
  props: UnMatchedModuleWarningProps
): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const [showModulesMismatch, setShowModulesMismatch] = React.useState<boolean>(
    true
  )
  const isVisible = showModulesMismatch && props.isAnyModuleUnnecessary
  if (!isVisible) return null

  return (
    <React.Fragment>
      <Flex
        marginY={SPACING_3}
        backgroundColor={COLOR_WARNING_LIGHT}
        color={C_DARK_GRAY}
        id={'ModuleMismatch'}
      >
        <Flex flexDirection={DIRECTION_COLUMN} flex={'auto'} margin={SPACING_3}>
          <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
            <Flex>
              <Box size={SIZE_2} paddingY={SPACING_1} paddingRight={SPACING_2}>
                <Icon name="alert-circle" color={COLOR_WARNING} />
              </Box>
              <Text
                as="h4"
                marginY={SPACING_2}
                id={`ModuleMismatch_title`}
                color={COLOR_WARNING_DARK}
              >
                {t('module_mismatch_title')}
              </Text>
            </Flex>
            <Btn
              size={SIZE_2}
              onClick={() => setShowModulesMismatch(false)}
              aria-label="close"
            >
              <Icon name={'close'} color={COLOR_WARNING} />
            </Btn>
          </Flex>
          <Text paddingTop={SPACING_1} fontSize={'0.7rem'}>
            {t('module_mismatch_body')}
          </Text>
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
