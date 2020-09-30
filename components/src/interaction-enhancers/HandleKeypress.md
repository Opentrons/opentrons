Use `<HandleKeypress>` to register listeners for keypress events:

```js
const [state, setState] = React.useState({ key: '' })
;<HandleKeypress
  handlers={[
    { key: 'q', onPress: () => setState({ key: 'q' }) },
    { key: 'w', onPress: () => setState({ key: 'w' }) },
    { key: 'e', onPress: () => setState({ key: 'e' }) },
    {
      key: 'ArrowLeft',
      shiftKey: false,
      onPress: () => setState({ key: 'left' }),
    },
    {
      key: 'ArrowRight',
      shiftKey: true,
      onPress: () => setState({ key: 'shift + right' }),
    },
  ]}
>
  Key: {state.key}
</HandleKeypress>
```
