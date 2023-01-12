import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  // JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  Btn,
  JUSTIFY_START,
  JUSTIFY_CENTER,
  JUSTIFY_END,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SearchNetwork } from './SearchNetwork'

import type { WifiNetwork } from '../../redux/networking/types'

interface DisplayWifiListProps {
  list: WifiNetwork[]
  isSearching: boolean
  setSelectedSsid: (nwSsid: string) => void
  setIsShowSetWifiCred: (isShowSetWifiCred: boolean) => void
}

export function DisplayWifiList({
  list,
  isSearching,
  setSelectedSsid,
  setIsShowSetWifiCred,
}: DisplayWifiListProps): JSX.Element {
  return (
    <>
      <HeaderWithIPs isSearching={isSearching} />
      {list.length >= 1 ? (
        list.map(nw => (
          <Flex
            width="59rem"
            height="4rem"
            flexDirection={DIRECTION_ROW}
            padding={SPACING.spacing4}
            key={nw.ssid}
            backgroundColor="#d6d6d6"
            alignItems={ALIGN_CENTER}
            marginBottom={SPACING.spacing3}
            borderRadius="0.75rem"
            onClick={() => {
              setSelectedSsid(nw.ssid)
              setIsShowSetWifiCred(true)
            }}
          >
            <Icon name="wifi" size="2.25rem" />
            <StyledText marginLeft={SPACING.spacing4} color="#000">
              {nw.ssid}
            </StyledText>
          </Flex>
        ))
      ) : (
        <SearchNetwork />
      )}
    </>
  )
}

interface HeadWithIPsProps {
  isSearching: boolean
}

const HeaderWithIPs = ({ isSearching }: HeadWithIPsProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom="3.0625rem"
    >
      <Flex justifyContent={JUSTIFY_START}>
        <Btn onClick={() => history.push('/network-setup')}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              name="arrow-back"
              marginRight={SPACING.spacing2}
              size="1.875rem"
            />
            <StyledText
              fontSize="1.625rem"
              lineHeight="2.1875rem"
              fontWeight="700"
            >
              {t('shared:back')}
            </StyledText>
          </Flex>
        </Btn>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER}>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('connect_via', { type: t('wifi') })}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_END}>
        {isSearching ? <Icon name="ot-spinner" spin size="3.3125rem" /> : null}
      </Flex>
    </Flex>
  )
}
