BaseModal example, with a header, a footer, and scrollable contents

```js
import {
  ALIGN_CENTER,
  DISPLAY_FLEX,
  FONT_SIZE_HEADER,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  JUSTIFY_FLEX_END,
  SPACING_2,
  SPACING_3,
  Box,
  Flex,
  Icon,
  Text,
  SecondaryBtn,
} from '@opentrons/components'
;<Box position="relative" width="48em" height="24rem">
  <BaseModal
    fontSize={FONT_SIZE_BODY_2}
    header={
      <Text
        as="h2"
        display={DISPLAY_FLEX}
        alignItems={ALIGN_CENTER}
        fontSize={FONT_SIZE_HEADER}
        fontWeight={FONT_WEIGHT_REGULAR}
      >
        <Icon name="alert" width="1em" marginRight={SPACING_2} />
        Attention
      </Text>
    }
    footer={
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryBtn>OK</SecondaryBtn>
      </Flex>
    }
  >
    <Text marginBottom={SPACING_2}>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua.
    </Text>
    <Text marginBottom={SPACING_2}>
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
      aliquip ex ea commodo consequat.
    </Text>
    <Text>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
      dolore eu fugiat nulla pariatur
    </Text>
  </BaseModal>
</Box>
```
