import { createGlobalStyle } from 'styled-components'
import { COLORS } from '@opentrons/components'
import 'typeface-open-sans'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Open Sans', sans-serif;
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
