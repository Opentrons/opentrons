Basic usage (click overlay to close):

```js
const [state, setState] = React.useState({ isOpen: true })
;<div style={{ position: 'relative', width: '32em', height: '16rem' }}>
  {state.isOpen && (
    <Modal
      onCloseClick={() => setState({ isOpen: false })}
      restrictOuterScroll={false}
    >
      <span>Modal contents</span>
    </Modal>
  )}
  <button onClick={() => setState({ isOpen: true })}>Open modal</button>
</div>
```

Optional heading (click overlay to close):

```js
const [state, setState] = React.useState({ isOpen: true })
;<div style={{ position: 'relative', width: '32em', height: '16rem' }}>
  {state.isOpen && (
    <Modal
      restrictOuterScroll={false}
      onCloseClick={() => setState({ isOpen: false })}
      heading={'Optional styled heading'}
    >
      <span>Modal contents</span>
    </Modal>
  )}
  <button onClick={() => setState({ isOpen: true })}>Open modal</button>
</div>
```
