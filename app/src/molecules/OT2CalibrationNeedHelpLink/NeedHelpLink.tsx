import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  Flex,
  Icon,
  Link,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ComponentProps, ReactNode } from 'react'

const SUPPORT_PAGE_URL = 'https://support.opentrons.com/s/ot2-calibration'

interface NeedHelpLinkProps extends ComponentProps<typeof Flex> {
  href?: string
}

export function NeedHelpLink(props: NeedHelpLinkProps): ReactNode {
  const { href = SUPPORT_PAGE_URL, ...flexProps } = props
  const { t } = useTranslation('robot_calibration')
  return (
    <Flex alignItems={ALIGN_CENTER} {...flexProps}>
      <Icon
        color={COLORS.grey50}
        size={SIZE_1}
        marginRight={SPACING.spacing4}
        name="help"
      />
      <Link
        external
        fontSize={TYPOGRAPHY.fontSizeP}
        css={TYPOGRAPHY.darkLinkLabelSemiBold}
        href={href}
      >
        {t('need_help')}
      </Link>
    </Flex>
  )
}
