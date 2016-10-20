<template>
  <span>
    <button v-for="s in slots" @click="jogToSlot(s,axis)"class="btn-deck" >{{s}}</button>
  </span>
</template>

<script>
export default {
  name: 'DeckSlot',
  props: ['slots', 'axis'],
  methods: {
    jogToSlot(s, axis) {    
      this.$store.dispatch("jogToSlot", {slot: s, axis: axis})
    }
  }
}
</script>