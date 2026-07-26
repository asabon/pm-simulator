from prototype.src.entities import PM, Developer


def test_pm_ap_reset():
    pm = PM(max_ap=3)
    assert pm.ap == 3
    pm.ap -= 2
    assert pm.ap == 1
    pm.reset_ap()
    assert pm.ap == 3


def test_developer_resolution_display():
    dev = Developer("dev1", "テスト太郎", age=25, resolution=0)
    assert "未知" in dev.get_status_display()

    dev.resolution = 1
    assert "疲労感" in dev.get_status_display()

    dev.resolution = 2
    assert "疲労度:" in dev.get_status_display()
