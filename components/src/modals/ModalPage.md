Basic usage:

```js
<div style={{position: 'relative', width: '48em', height: '24rem'}}>
  <ModalPage
    titleBar={{
      title: 'Title',
      subtitle: 'Subtitle',
      back: {
        children: 'back',
        onClick: () => alert('back button clicked')
      }
    }}
    >
    <h3>Some content in a Modal Page</h3>
    <p>Click the back button for an back action.</p>
  </ModalPage>
</div>
```
