<template>
  
    <section id="task-view">
      <section id="placeable-pane">  
        <h1 :class="{calibrated : instrument().calibrated,  active: $route.params.placeable }">{{$route.params.placeable}} at slot {{$route.params.slot}}</h1>
        <deck-navigation  :instrument='instrument()' :deck='deck()'></deck-navigation>  
      </section>

      <section id="instrument-pane">
        <h1>{{instrument().label}} {{channels}} [{{instrumentLocation}}]</h1>
        <!-- TODO: Refactor into PipetteNavigation Component w/props -->
        <button  v-for="instrument in tasks().instruments" 
        class="tab" :class="{active : activePipette(instrument)}"  
        @click="togglePipette(instrument.axis)"> 
        {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span></button>
        <div class="pipette-modal" :class="plungerMode">
        <div class="plunger-nav">
          <ul>
            <li @click="modePlunger('top')" class="top">Top</li>
            <li @click="modePlunger('bottom')" class="bottom">Bottom</li>
            <li @click="modePlunger('blowout')" class="blowout">Blowout</li>
            <li @click="modePlunger('droptip')" class="droptip">Drop Tip</li>
          </ul>
        </div>
        <div class="plunger-img">
          <img src='../assets/img/pipette_top.png' class='top'/>
          <img src='../assets/img/pipette_bottom.png' class='bottom'/>
          <img src='../assets/img/pipette_blowout.png' class='blowout'/>
          <img src='../assets/img/pipette_droptip.png' class='droptip'/>
        </div>
        </section>

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
        axis: this.$route.params.instrument,
        plungerMode: 'mode-top'
      }
    },
    components: {
      DeckNavigation
    },
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      },
      instrumentLocation () {
        return this.instrument().axis === 'a' ? 'right' : 'left'
      }
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
      activePipette (instrument) {
        return instrument.axis === this.axis
      },
      togglePipette (axis) {
        this.$router.push({ name: 'instrument', params: { instrument: axis, slot: null, placeable: null } })
      },
      modePlunger (mode) {
        this.plungerMode = 'mode-' + mode
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