import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { Link, TYPOGRAPHY } from '@opentrons/components'

interface GoBackLinkProps {
  onClick: React.MouseEventHandler
}

export function GoBackLink(props: GoBackLinkProps): JSX.Element {
  const { onClick } = props
  const { i18n, t } = useTranslation()

  return (
    <Link
      role="button"
      css={css`
        ${TYPOGRAPHY.darkLinkH4SemiBold}
      `}
      onClick={onClick}
    >
      {i18n.format(t('shared.go_back'), 'capitalize')}
    </Link>
  )
}
