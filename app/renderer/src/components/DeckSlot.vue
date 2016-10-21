<template>
  <span>
    <button v-for="slot in slots" @click="jogToSlot(slot, axis)"class="btn-deck">{{slot}}</button>
  </span>
</template>

<script>
export default {
  name: 'DeckSlot',
  props: ['slots', 'axis'],
  methods: {
    jogToSlot(slot, axis) {
      this.$store.dispatch("jogToSlot", {slot: slot, axis: axis})
    }
  }
}
</script>
