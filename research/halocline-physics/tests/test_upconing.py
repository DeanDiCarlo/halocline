from math import inf

from halocline_physics.upconing import classify_risk, compute_upconing_risk


def test_computes_reference_critical_pumping_threshold():
    result = compute_upconing_risk(
        pumping_cubic_meters_per_day=1000,
        local_hydraulic_conductivity_meters_per_day=50,
        well_screen_bottom_depth_meters=0,
        interface_depth_meters=30,
        density_contrast_ratio=0.025,
    )

    assert result.d_meters == 30
    assert result.z_crit_meters == 9
    assert abs(result.q_crit_cubic_meters_per_day - 2120.5750411731105) <= 1e-6


def test_classifies_thresholds():
    assert classify_risk(0.49) == "low"
    assert classify_risk(0.5) == "moderate"
    assert classify_risk(0.75) == "high"
    assert classify_risk(1) == "critical"
    assert classify_risk(inf) == "critical"
