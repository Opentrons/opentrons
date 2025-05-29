// import { createGlobalStyle } from 'styled-components'
import { css } from '@linaria/core'

import 'typeface-open-sans'
import '@fontsource/dejavu-sans'
import '@fontsource/public-sans'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'

// TODO(ew, 06/19/23): The main font is Public Sans but it does not have subscript glyphs,
// needed to display chemical formulae on the liquids page. I've added DejaVu Sans, which
// does have the glyphs, as a fallback so subscripts will get displayed. Mel and the design
// team will want to revisit the fonts we use at some point in the future.
// eslint-disable-next-line opentrons/no-margins-in-css
export const GlobalStyle = css`
  :global() {
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Public Sans', 'DejaVu Sans', sans-serif;
    }

    html,
    body {
      width: 100%;
      height: 100%;
      color: #16212d;
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
  }
`
