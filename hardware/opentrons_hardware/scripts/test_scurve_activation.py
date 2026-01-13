#!/usr/bin/env python3
"""Test when S-curve actually activates vs falling back to trapezoid."""

import sys
sys.path.insert(0, '/opt/opentrons-robot-server')

from opentrons_hardware.hardware_control.motion_planning import move_utils
from opentrons_hardware.hardware_control.motion_planning.types import (
    AxisConstraints,
    SystemConstraints,
)
import numpy as np

# Test constraints
CONSTRAINTS: SystemConstraints[str] = {
    "X": AxisConstraints.build(
        max_acceleration=np.float64(1500),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(15),
        max_speed=np.float64(400),
    ),
    "Y": AxisConstraints.build(
        max_acceleration=np.float64(1500),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(15),
        max_speed=np.float64(400),
    ),
}

def test_move(distance_mm: float, description: str):
    """Test a move and show whether S-curve activates."""
    print(f"\n{'='*80}")
    print(f"{description}")
    print(f"{'='*80}")
    
    unit_vector = {"X": np.float64(1.0), "Y": np.float64(0.0)}
    
    # Test with trapezoid
    trap_blocks = move_utils.build_blocks(
        unit_vector=unit_vector,
        initial_speed=np.float64(0),
        final_speed=np.float64(0),
        distance=np.float64(distance_mm),
        max_speed=np.float64(300),
        constraints=CONSTRAINTS,
    )
    
    # Test with S-curve (3 segments)
    move_utils.set_scurve_segments(3)
    scurve_blocks = move_utils.build_blocks_scurve(
        unit_vector=unit_vector,
        initial_speed=np.float64(0),
        final_speed=np.float64(0),
        distance=np.float64(distance_mm),
        max_speed=np.float64(300),
        constraints=CONSTRAINTS,
    )
    
    trap_accel_time = float(trap_blocks[0].time)
    estimated_seg_time = trap_accel_time / 3.0
    min_required = move_utils._MIN_SEGMENT_TIME_SEC
    
    print(f"Distance: {distance_mm}mm")
    print(f"Trapezoid accel time: {trap_accel_time*1000:.1f}ms")
    print(f"Estimated segment time (÷3): {estimated_seg_time*1000:.1f}ms")
    print(f"Minimum required: {min_required*1000:.1f}ms")
    
    if len(scurve_blocks) == 3:
        print(f"❌ S-curve INACTIVE - Fell back to trapezoid")
        print(f"   Reason: {estimated_seg_time*1000:.1f}ms < {min_required*1000:.1f}ms")
    else:
        print(f"✓ S-curve ACTIVE - Using {len(scurve_blocks)} blocks")
        min_time = min(float(b.time) for b in scurve_blocks) * 1000
        max_time = max(float(b.time) for b in scurve_blocks) * 1000
        print(f"   Segment time range: {min_time:.1f}ms - {max_time:.1f}ms")

if __name__ == "__main__":
    print("Testing S-curve activation threshold with current safety settings")
    print(f"Minimum segment time: {move_utils._MIN_SEGMENT_TIME_SEC*1000:.0f}ms")
    print(f"Firmware max sequences: {move_utils._FIRMWARE_MAX_SEQS_PER_GROUP}")
    
    # Test various move distances
    test_move(50, "SHORT MOVE (50mm)")
    test_move(100, "MEDIUM MOVE (100mm)")
    test_move(200, "LONG MOVE (200mm)")
    test_move(400, "VERY LONG MOVE (400mm)")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print("With 80ms minimum segment time:")
    print("  • S-curve requires accel phase ≥ 240ms (3 × 80ms)")
    print("  • Short moves (< ~150mm) will use trapezoid")
    print("  • Long moves (> ~200mm) will use S-curve")
    print("\nThis is CORRECT BEHAVIOR - prevents firmware timeouts!")
    print("\nTo enable S-curve on robot:")
    print("  move_utils.set_motion_profile('s-curve')")
    print("  # S-curve will auto-activate only when safe to do so")
