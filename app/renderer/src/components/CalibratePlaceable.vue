<template>

<div class="calibration-modal mode-bottom">
	<!-- Images based on container type. -->
	<div class="well-img">
		<!-- <img src="assets/img/well_top.png" class="top" />
		<img src="assets/img/well_bottom.png" class="bottom" /> -->
	</div>
	<div class="update">
		<a href="#" class="position bottom">Bottom</a>
		<button class="btn-update save bottom" data-save="bottom">Save </button>
		<button class="btn-update moveto">Move To </button>
	</div>
</div>
<!-- End Calibration Modal -->
	
</template>

<script>
  export default {
    name: 'CalibratePlaceable',
    props: ['instrument', 'placeable', 'type'],
    data: function () {
      return {}
    }
  }
</script>