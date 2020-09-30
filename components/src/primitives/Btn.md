Like our Button component, but smaller (in code)! Renders an unstyled `<button>` by default and accepts all primitive styling props.

```js
<>
  <Btn onClick={() => console.log('hello world')}>click me</Btn>
  <Btn marginLeft="1rem" disabled>
    but not me
  </Btn>
</>
```

We have different styled variants of buttons available:

```js
import {
  Box,
  PrimaryBtn,
  SecondaryBtn,
  LightSecondaryBtn,
  TertiaryBtn,
  C_DARK_GRAY,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
;<>
  <Box paddingX={SPACING_3} paddingY={SPACING_2}>
    <PrimaryBtn>primary</PrimaryBtn>
    <PrimaryBtn marginLeft={SPACING_3} disabled>
      not clickable
    </PrimaryBtn>
  </Box>
  <Box paddingX={SPACING_3} padding={SPACING_2}>
    <SecondaryBtn>secondary</SecondaryBtn>
    <SecondaryBtn marginLeft={SPACING_3} disabled>
      not clickable
    </SecondaryBtn>
  </Box>
  <Box paddingX={SPACING_3} padding={SPACING_2} backgroundColor={C_DARK_GRAY}>
    <LightSecondaryBtn>light secondary</LightSecondaryBtn>
    <LightSecondaryBtn marginLeft={SPACING_3} disabled>
      not clickable
    </LightSecondaryBtn>
  </Box>
  <Box paddingX={SPACING_3} padding={SPACING_2} backgroundColor={C_DARK_GRAY}>
    <TertiaryBtn>tertiary</TertiaryBtn>
    <TertiaryBtn marginLeft={SPACING_3} disabled>
      not clickable
    </TertiaryBtn>
  </Box>
</>
```
