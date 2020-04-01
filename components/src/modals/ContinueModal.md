Basic usage:

```js
const [state, setState] = React.useState({ continue: null })
;<div style={{ position: 'relative', width: '48em', height: '24rem' }}>
  {state.continue == null && (
    <ContinueModal
      onCancelClick={() => setState({ continue: 'cancel' })}
      onContinueClick={() => setState({ continue: 'continue' })}
    >
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
      velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
      cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
      est laborum.
    </ContinueModal>
  )}
  <p>
    Decided to:
    <strong>{state.continue}</strong>
  </p>
  <button onClick={() => setState({ continue: null })}>Do a thing</button>
</div>
```
