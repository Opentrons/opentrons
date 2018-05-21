AlertModal example:

```js
initialState = {alert: 'foo'}

const alertContents = {
  foo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  bar: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
}

;<div style={{position: 'relative', width: '48em', height: '24rem'}}>
  <FlatButton onClick={() => setState({alert: 'foo'})}>
    Alert foo
  </FlatButton>
  {state.alert && (
    <AlertModal
      heading={state.alert}
      onCloseClick={() => setState({alert: ''})}
      buttons={[
        {children: 'foo', onClick: () => setState({alert: 'foo'})},
        {children: 'bar', onClick: () => setState({alert: 'bar'})},
        {children: 'close', onClick: () => setState({alert: ''})}
      ]}
    >
      {alertContents[state.alert]}
    </AlertModal>
  )}
</div>
```

Optional alertOverlay prop to lighten background

```js
initialState = {alert: 'foo'}

const alertContents = {
  foo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  bar: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
}

;<div style={{position: 'relative', width: '48em', height: '24rem'}}>
  <FlatButton onClick={() => setState({alert: 'foo'})}>
    Alert foo
  </FlatButton>
  {state.alert && (
    <AlertModal
      heading={state.alert}
      onCloseClick={() => setState({alert: ''})}
      buttons={[
        {children: 'foo', onClick: () => setState({alert: 'foo'})},
        {children: 'bar', onClick: () => setState({alert: 'bar'})},
        {children: 'close', onClick: () => setState({alert: ''})}
      ]}
      alertOverlay
    >
      {alertContents[state.alert]}
    </AlertModal>
  )}
</div>
```

Alert modal without heading prop:

```js
initialState = {alert: 'foo'}

const alertContents = {
  foo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  bar: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
}

;<div style={{position: 'relative', width: '48em', height: '24rem'}}>
  <FlatButton onClick={() => setState({alert: 'foo'})}>
    Alert foo
  </FlatButton>
  {state.alert && (
    <AlertModal
      onCloseClick={() => setState({alert: ''})}
      buttons={[
        {children: 'foo', onClick: () => setState({alert: 'foo'})},
        {children: 'bar', onClick: () => setState({alert: 'bar'})},
        {children: 'close', onClick: () => setState({alert: ''})}
      ]}
    >
      {alertContents[state.alert]}
    </AlertModal>
  )}
</div>
```
