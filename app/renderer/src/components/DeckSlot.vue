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
    data: function() {
      return {
        slots: ['A3','B3','C3','D3','E3',
                'A2','B2','C2','D2','E2',
                'A1','B1','C1','D1','E1']
      }
    },
    methods: {
      jogToSlot(slot) {
        this.$store.dispatch("jogToSlot", {slot: slot, axis: "a"})
      }
    }
  }
</script>
