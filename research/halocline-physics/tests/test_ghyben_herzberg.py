from halocline_physics.ghyben_herzberg import (
    estimate_interface_depth_from_head,
    interface_depth_from_head,
)


def test_one_meter_freshwater_head_maps_to_40_meter_interface_depth():
    assert (
        abs(
            interface_depth_from_head(
                freshwater_head_meters=1,
                sea_level_meters=0,
            )
            - 40
        )
        <= 0.5
    )


def test_interface_depth_clamps_at_aquifer_base():
    estimate = estimate_interface_depth_from_head(
        freshwater_head_meters=2,
        sea_level_meters=0,
        aquifer_base_depth_meters=60,
    )

    assert estimate.depth_meters == 60
    assert estimate.unclamped_depth_meters == 80
    assert estimate.clamped_at_aquifer_base is True
    assert estimate.inverted_freshwater_lens is False


def test_negative_relative_head_marks_inverted_freshwater_lens():
    estimate = estimate_interface_depth_from_head(
        freshwater_head_meters=0.1,
        sea_level_meters=0.2,
        aquifer_base_depth_meters=60,
    )

    assert estimate.depth_meters == 0
    assert estimate.clamped_at_aquifer_base is False
    assert estimate.inverted_freshwater_lens is True
