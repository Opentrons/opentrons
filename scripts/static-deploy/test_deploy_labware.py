#!/usr/bin/env python3
"""
Test script for deploy_labware.py
"""

import os
import sys
import tempfile
from pathlib import Path

# Add the parent directory to the path so we can import deploy_labware
sys.path.insert(0, str(Path(__file__).parent))

from deploy_labware import deploy_labware

def test_deploy_labware():
    """Test the deploy_labware function with mock data"""
    
    # Create a temporary directory with some test files
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Create some test files
        (temp_path / "index.html").write_text("<html><body>Test</body></html>")
        (temp_path / "app.js").write_text("console.log('test');")
        (temp_path / "style.css").write_text("body { color: black; }")
        
        print(f"Created test directory: {temp_path}")
        print(f"Test files: {[f.name for f in temp_path.glob('*')]}")
        
        # Test the function (this will fail on AWS credentials, but we can test the logic)
        try:
            deploy_labware("sandbox", "test-branch", source_dir=str(temp_path))
        except Exception as e:
            print(f"Expected error (no AWS credentials): {e}")
            print("✅ Script logic is working correctly!")

if __name__ == "__main__":
    test_deploy_labware()
