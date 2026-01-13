#!/usr/bin/env python3
"""Diagnostic script to check S-curve configuration and segment generation."""

import sys
sys.path.insert(0, '/opt/opentrons-robot-server')

from opentrons_hardware.hardware_control.motion_planning import move_utils
from opentrons_hardware.hardware_control.motion_planning.types import (
    AxisConstraints,
    SystemConstraints,
)
import numpy as np

# Test constraints similar to OT3
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
    "Z": AxisConstraints.build(
        max_acceleration=np.float64(100),
        max_speed_discont=np.float64(15),
        max_direction_change_speed_discont=np.float64(15),
        max_speed=np.float64(150),
    ),
}

def test_scurve_segments():
    """Test S-curve segment generation with different configurations."""
    print("=" * 80)
    print("S-CURVE CONFIGURATION DIAGNOSTICS")
    print("=" * 80)
    
    # Test different segment counts
    for seg_count in [3, 5, 7, 9]:
        print(f"\n--- Testing with {seg_count} segments ---")
        move_utils.set_scurve_segments(seg_count)
        
        # Simple XY diagonal move of 100mm
        unit_vector = {"X": np.float64(0.7071), "Y": np.float64(0.7071), "Z": np.float64(0.0)}
        
        # Test trapezoid first
        print("\nTrapezoid profile:")
        trap_blocks = move_utils.build_blocks(
            unit_vector=unit_vector,
            initial_speed=np.float64(0),
            final_speed=np.float64(0),
            distance=np.float64(100),
            max_speed=np.float64(300),
            constraints=CONSTRAINTS,
        )
        print(f"  Blocks: {len(trap_blocks)}")
        for i, block in enumerate(trap_blocks):
            print(f"    Block {i}: dist={float(block.distance):.2f}mm, "
                  f"time={float(block.time):.3f}s, accel={float(block.acceleration):.2f}mm/s²")
        
        # Test S-curve
        print(f"\nS-curve profile (segments={seg_count}):")
        try:
            scurve_blocks = move_utils.build_blocks_scurve(
                unit_vector=unit_vector,
                initial_speed=np.float64(0),
                final_speed=np.float64(0),
                distance=np.float64(100),
                max_speed=np.float64(300),
                constraints=CONSTRAINTS,
            )
            print(f"  Blocks: {len(scurve_blocks)}")
            total_time = 0.0
            min_time = float('inf')
            max_time = 0.0
            
            for i, block in enumerate(scurve_blocks):
                block_time = float(block.time)
                total_time += block_time
                min_time = min(min_time, block_time)
                max_time = max(max_time, block_time)
                if i < 3 or i >= len(scurve_blocks) - 3:  # Show first and last 3
                    print(f"    Block {i}: dist={float(block.distance):.3f}mm, "
                          f"time={block_time:.4f}s, accel={float(block.acceleration):.2f}mm/s²")
                elif i == 3:
                    print(f"    ... ({len(scurve_blocks) - 6} middle blocks omitted)")
            
            print(f"\n  Summary:")
            print(f"    Total blocks: {len(scurve_blocks)}")
            print(f"    Total time: {total_time:.3f}s")
            print(f"    Min segment time: {min_time:.4f}s")
            print(f"    Max segment time: {max_time:.4f}s")
            
            # Check against firmware limits
            FW_LIMIT = 10
            MIN_TIME = 3.0 / 31250  # _MIN_FW_BLOCK_TIME
            
            if len(scurve_blocks) > FW_LIMIT:
                print(f"    ⚠️  WARNING: Exceeds firmware limit ({len(scurve_blocks)} > {FW_LIMIT})")
            if min_time < MIN_TIME:
                print(f"    ⚠️  WARNING: Has segments below minimum time ({min_time:.6f}s < {MIN_TIME:.6f}s)")
            if len(scurve_blocks) <= FW_LIMIT and min_time >= MIN_TIME:
                print(f"    ✓ Within firmware limits")
                
        except Exception as e:
            print(f"  ERROR: {e}")

def check_current_config():
    """Check current configuration."""
    print("\n" + "=" * 80)
    print("CURRENT CONFIGURATION")
    print("=" * 80)
    print(f"Profile: {move_utils._PROFILE}")
    print(f"S-curve segments: {move_utils._SCURVE_SEGMENTS}")
    print(f"Min segment time: {move_utils._MIN_SEGMENT_TIME_SEC}s")
    print(f"Firmware max sequences: {move_utils._FIRMWARE_MAX_SEQS_PER_GROUP}")
    print(f"Min FW block time: {move_utils._MIN_FW_BLOCK_TIME:.6f}s")

if __name__ == "__main__":
    check_current_config()
    test_scurve_segments()
    
    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    print("Based on firmware stability:")
    print("  - Use segment count of 3 for most reliable operation")
    print("  - Use segment count of 5 for smoother motion on longer moves")
    print("  - Avoid segment counts > 7 unless moves are very long (> 200mm)")
    print("\nTo change configuration:")
    print("  move_utils.set_motion_profile('s-curve')  # or 'trapezoid'")
    print("  move_utils.set_scurve_segments(3)  # 3, 5, 7, or 9")
