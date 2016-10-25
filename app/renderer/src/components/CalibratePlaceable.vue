<template>

<div class="calibration-modal">
	<!-- Images based on container type. -->
	<div class="well-img">
		<img src="../assets/img/well_bottom.png" v-show="placeableType('default')" /> 
		<img src="../assets/img/tiprack_top.png" v-show="placeableType('tiprack')"/>
		<img src="../assets/img/point_top.png" v-show="placeableType('point')"/>
	</div>
	<!--  -->
	<div class="update bottom" v-show="placeableType('default') || placeableType('point')">
		<span class="position bottom">Bottom</span>
		<button class="btn-update save bottom" >Save </button>
		<button class="btn-update moveto">Move To </button>
	</div>

	<div class="update top" v-show="placeableType('tiprack')">
		<span class="position top">Tiprack</span>
		<button class="btn-update save top" >Save </button>
		<button class="btn-update moveto">Move To </button>
		<button class="pick-tip">Pick Up Tip</button>
	</div>
</div>
<!-- End Calibration Modal -->
	
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    props: ['instrument', 'placeable', 'type'],
    methods: {
			placeableType(type){
				return this.type === type
			}
    },
    computed: { 
    	currentType(){
    		return placeableType(this.type);
    	}
    }

  }
</script>