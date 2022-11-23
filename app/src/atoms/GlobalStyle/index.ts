import { createGlobalStyle } from 'styled-components'
import { COLORS } from '@opentrons/components'
import 'typeface-open-sans'

interface GlobalStyleProps {
  isOnDevice?: boolean
}

export const GlobalStyle = createGlobalStyle<GlobalStyleProps>`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    /* font-family: 'Open Sans', sans-serif; */
    @font-face {
      font-family: 'Public Sans';
      src: url("../../assets/font/PublicSans-Regular.ttf");
    }
    /* font-family:${props =>
      props.isOnDevice ?? false ? 'Open Sans' : 'Open Sans'}, sans-serif; */

    font-family:sans-serif;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    color: ${COLORS.darkBlackEnabled};
  }

  a {
    text-decoration: none;
  }

  button {
    border: none;

    &:focus,
    &:active {
      outline: 0;
    }
  }
`
