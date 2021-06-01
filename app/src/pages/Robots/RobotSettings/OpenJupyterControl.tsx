import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'

import {
  SecondaryBtn,
  Link,
  Flex,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_3,
  SPACING_4,
  SIZE_4,
} from '@opentrons/components'
import { useTrackEvent } from '../../../redux/analytics'
import { LabeledValue } from '../../../atoms/structure'

const EVENT_JUPYTER_OPEN = { name: 'jupyterOpen', properties: {} }

export interface OpenJupyterControlProps {
  robotIp: string
}

export function OpenJupyterControl(
  props: OpenJupyterControlProps
): JSX.Element {
  const { robotIp } = props
  const { t } = useTranslation(['robot_advanced_settings', 'shared'])
  const href = `http://${robotIp}:48888`
  const trackEvent = useTrackEvent()

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING_3}
    >
      <LabeledValue
        label={t('open_jupyter_label')}
        value={
          <Trans
            t={t}
            i18nKey="open_jupyter_description"
            components={{
              jn: <Link external href="https://jupyter.org/" />,
              docs: (
                <Link
                  external
                  href="https://docs.opentrons.com/v2/new_advanced_running.html#jupyter-notebook"
                />
              ),
            }}
          />
        }
      />
      <SecondaryBtn
        onClick={() => trackEvent(EVENT_JUPYTER_OPEN)}
        as={Link}
        href={href}
        minWidth={SIZE_4}
        marginLeft={SPACING_4}
        external
      >
        {t('shared:open')}
      </SecondaryBtn>
    </Flex>
  )
}
