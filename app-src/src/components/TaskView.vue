<template>
  
    <section id="task-view">
      <section id="placeable-pane">  
        <deck-navigation  :instrument='instrument()' :deck='deck()'></deck-navigation>
    
      </section>
      <section id="instrument-pane">
        
      </section>
    </section>

  <!-- TODO: Move run screen logic to runlog panel at bottom of app -->
  <!--   <RunScreen class='run-screen' v-show='running()'></RunScreen> -->
</template>

<script>
  // import RunScreen from './RunScreen.vue'
  import DeckNavigation from './DeckNavigation'

  export default {
    props: ['busy'],
    data () {
      return {
        axis: this.$route.params.instrument
      }
    },
    components: {
      DeckNavigation
    },
    methods: {
      params () {
        return this.$route.params
      },
      tasks () {
        return this.$store.state.tasks
      },
      deck () {
        return this.$store.state.tasks.deck
      },
      instrument () {
        let instrument = this.$store.state.tasks.instruments.find(element => element.axis === this.axis)
        return instrument
      },
      running () {
        return this.$store.state.running || this.$store.state.protocolFinished
      }
    },
    watch: {
      '$route' (to, from) {
        this.axis = to.params.instrument
      }
    }
  }
</script>