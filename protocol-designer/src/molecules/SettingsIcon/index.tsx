import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BORDERS,
  Btn,
  COLORS,
  Flex,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { getFileMetadata } from '../../file-data/selectors'
import { BUTTON_LINK_STYLE } from '../../atoms/constants'

//  TODO(ja): this icon needs to be updated to match css states and correct svg
export const SettingsIcon = (): JSX.Element => {
  const location = useLocation()
  const navigate = useNavigate()
  const metadata = useSelector(getFileMetadata)

  const handleNavigate = (): void => {
    if (metadata?.created != null && location.pathname === '/settings') {
      navigate(-1)
    } else if (location.pathname !== '/settings') {
      navigate('/settings')
    } else {
      navigate('/')
    }
  }

  return (
    <Flex
      data-testid="SettingsIcon"
      borderRadius={BORDERS.borderRadiusFull}
      backgroundColor={
        location.pathname === '/settings' ? COLORS.grey30 : COLORS.transparent
      }
      cursor="pointer"
      width="2rem"
      height="2rem"
      justifyContent={JUSTIFY_CENTER}
    >
      <Btn
        onClick={handleNavigate}
        css={BUTTON_LINK_STYLE}
        data-testid="SettingsIconButton"
      >
        <Flex justifyContent={JUSTIFY_CENTER}>
          <Icon size="1rem" name="settings" />
        </Flex>
      </Btn>
    </Flex>
  )
}
