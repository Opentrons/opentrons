import * as React from 'react'
import { connect } from 'react-redux'
import { getConfig, addManualIp } from '../../redux/config'
import { startDiscovery } from '../../redux/discovery'
import { useFormik } from 'formik'
// import { IpHostnameField } from './IpHostnameField'
import {
  Flex,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
  TYPOGRAPHY,
  SPACING,
  Icon,
  SIZE_2,
  Text,
  Link,
  COLORS,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { TertiaryButton } from '../../atoms/Buttons'

import type { MapDispatchToProps } from 'react-redux'
import type { State } from '../../redux/types'
import type { DiscoveryCandidates } from '../../redux/config/types'
import { restartAfterCommitEpic } from '../../redux/buildroot/epic'

interface SP {
  candidates: DiscoveryCandidates
}

interface DP {
  addManualIp: (ip: string) => unknown
}

type Props = SP & DP

export function ManualIpHostnameFormComponent(props: Props): JSX.Element {
  const { t } = useTranslation('app_settings')
  const [showSpinner, setShowSpinner] = React.useState(false)
  const [showRefreshBtn, setShowRefreshBtn] = React.useState(false)
  const [showTryBtn, setShowTryBtn] = React.useState(false)

  const formik = useFormik({
    initialValues: {
      ip: '',
    },
    onSubmit: (values, { resetForm }) => {
      console.log('values', values)
      setShowSpinner(true)
      const ip = values.ip.trim()
      props.addManualIp(ip)
      resetForm({ values: undefined })
      setShowSpinner(false)
    },
    validate: values => {
      let errors
      const ip = values.ip.trim()
      if (!ip) {
        errors.ip = t('add_ip_error')
      }
      return errors
    },
  })

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const displayLinkBtn = (btnLabel: string) => {
    const ip = formik.values.ip.trim()
    return (
      <Link
        role="button"
        css={TYPOGRAPHY.pSemiBold}
        color={COLORS.blue}
        onClick={() => props.addManualIp(ip)}
        id="GeneralSettings_previousVersionLink"
      >
        {btnLabel}
      </Link>
    )
  }

  return (
    <>
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          paddingRight={SPACING.spacing3}
          marginTop={SPACING.spacing2}
        >
          <form onSubmit={formik.handleSubmit}>
            <input
              id="ip"
              name="ip"
              type="text"
              onChange={formik.handleChange}
              value={formik.values.ip}
            />
            <TertiaryButton
              fontSize={TYPOGRAPHY.fontSizeH6}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              lineHeight={TYPOGRAPHY.lineHeight12}
              marginTop={SPACING.spacing2}
              // onClick={null} // call startDiscovery
              width="100%"
              type="submit"
            >
              {t('add_ip_button')}
            </TertiaryButton>
          </form>
        </Flex>
        {formik.errors.ip && (
          <Text
            fontSize={TYPOGRAPHY.fontSizeH6}
            lineHeight={TYPOGRAPHY.lineHeight12}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            fontStyle={TYPOGRAPHY.fontStyleNormal}
            color={COLORS.error}
          >
            {formik.errors.ip}
          </Text>
        )}
        {showSpinner && (
          <Flex marginTop={SPACING.spacing5} marginBottom={SPACING.spacing4}>
            <Icon name="ot-spinner" size={SIZE_2} spin />
          </Flex>
        )}
        {showRefreshBtn && displayLinkBtn(t('ip_refresh_button'))}
        {showTryBtn && displayLinkBtn(t('ip_reconnect_button'))}
      </Flex>
    </>
  )
}

function mapStateToProps(state: State): SP {
  return {
    candidates: getConfig(state)?.discovery.candidates ?? [],
  }
}

const mapDispatchToProps: MapDispatchToProps<DP, {}> = dispatch => {
  return {
    addManualIp: ip => {
      dispatch(addManualIp(ip))
      dispatch(startDiscovery())
    },
  }
}

export const ManualIpHostnameForm = connect(
  mapStateToProps,
  mapDispatchToProps
)(ManualIpHostnameFormComponent)
