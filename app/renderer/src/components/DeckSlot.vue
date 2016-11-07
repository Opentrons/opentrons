<template>
  <section id="deck">
    <div class="deck">
      <button v-for="slot in slots" @click="jogToSlot(slot)">
        {{slot}}
      </button>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'DeckSlot',
    props: ['slots'],
    methods: {
      jogToSlot(slot) {
        //TODO - get actual axis for move to slot
        this.$store.dispatch("jogToSlot", {slot: slot, axis: "a"})
      }
    }
  }
</script>
