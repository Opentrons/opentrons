import { Trans, useTranslation } from 'react-i18next'

import { Link, StyledText, TYPOGRAPHY } from '@opentrons/components'

import styles from './enduseragreementfooter.module.css'
import { getYearFromDate } from './utils'

import type { ReactNode } from 'react'

const PRIVACY_POLICY_URL = 'https://opentrons.com/privacy-policy'
const EULA_URL = 'https://opentrons.com/eula'

export function EndUserAgreementFooter(): ReactNode {
  const { t } = useTranslation('shared')
  return (
    <footer>
      <div className={styles.footer_container}>
        <StyledText desktopStyle="captionRegular">
          <Trans
            i18nKey="privacy_policy"
            t={t}
            components={{
              privacyPolicyLink: (
                <Link
                  external
                  href={PRIVACY_POLICY_URL}
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  className={styles.link_button}
                />
              ),
              EULALink: (
                <Link
                  external
                  href={EULA_URL}
                  textDecoration={TYPOGRAPHY.textDecorationUnderline}
                  className={styles.link_button}
                />
              ),
            }}
          />
        </StyledText>
        <StyledText desktopStyle="captionRegular">
          {t('copyright', { year: getYearFromDate() })}
        </StyledText>
      </div>
    </footer>
  )
}
