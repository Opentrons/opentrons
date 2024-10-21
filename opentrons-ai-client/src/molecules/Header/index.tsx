import { useTranslation } from 'react-i18next'
import styled from 'styled-components';

import {
    Flex,
    StyledText,
    Link as LinkButton,
    POSITION_ABSOLUTE,
    TYPOGRAPHY,
    COLORS,
    POSITION_RELATIVE,
    ALIGN_CENTER,
    JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { useAuth0 } from '@auth0/auth0-react'

const HeaderBar = styled(Flex)`
    position: ${POSITION_RELATIVE};
    background-color: ${COLORS.white};
    width: 100%;
    align-items: ${ALIGN_CENTER};
    height: 60px;
`;

const HeaderBarContent = styled(Flex)`
    position: ${POSITION_ABSOLUTE};
    padding: 18px 32px;
    justify-content: ${JUSTIFY_SPACE_BETWEEN};
    width: 100%;
`;

const HeaderGradientTitle = styled(StyledText)`
  background: linear-gradient(90deg, #562566 0%, #893BA4 47.5%, #C189D4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
    font-size: 16px;
`;

const HeaderTitle = styled(StyledText)`
    font-size: 16px;
`;

const LogoutButton = styled(LinkButton)`
    color: ${COLORS.grey50};
    font-size: ${TYPOGRAPHY.fontSizeH3};
`;

export function Header(): JSX.Element {
    const { t } = useTranslation('protocol_generator')
    const { logout } = useAuth0()

    return (
        <HeaderBar>
            <HeaderBarContent>
                <Flex>
                    <HeaderTitle>{'Opentrons'}</HeaderTitle>
                    <HeaderGradientTitle>{'AI'}</HeaderGradientTitle>
                </Flex>
                <LogoutButton onClick={() => logout()}>
                    {t('Log out')}
                </LogoutButton>
            </HeaderBarContent>
        </HeaderBar>
    )
}