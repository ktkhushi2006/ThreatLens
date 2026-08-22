import os
import sys
import subprocess
import time

def run_tests():
    print("=" * 60)
    print("STARTING TEST RUNNER")
    print("=" * 60)

    print("\nRunning Regression Tests (Phases 1-4)...")
    res1 = subprocess.run([sys.executable, "test_phase4_steps34.py"])
    if res1.returncode != 0:
        print("Regression tests failed!")
        sys.exit(res1.returncode)

    print("\nRunning Phase 5 Tests...")
    res2 = subprocess.run([sys.executable, "test_phase5.py"])
    if res2.returncode != 0:
        print("Phase 5 tests failed!")
        sys.exit(res2.returncode)

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
