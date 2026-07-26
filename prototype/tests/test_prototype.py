from prototype.src.engine import check_urgent_events, process_yearly_closing
from prototype.src.entities import PM, Customer, Developer, Project, Team


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


def test_team_structure():
    team = Team("team_1", "開発チームA")
    pl = Developer("pl_1", "リーダー", leadership_skill=4)
    dev = Developer("dev_1", "メンバー", tech_skill=3)

    team.set_leader(pl)
    team.assign_member(dev)

    assert team.leader == pl
    assert len(team.members) == 1
    assert team.all_members == [pl, dev]
    assert pl.assigned_role == "PL"
    assert dev.assigned_role == "DEV"


def test_urgent_events():
    customer = Customer("c1", "テスト顧客", "QUALITY_ORIENTED")
    project = Project("テストPJ", 4, customer)
    pm = PM()

    team = Team("team_1", "開発チーム")
    dev = Developer("dev1", "テスト開発者", age=30)
    team.assign_member(dev)
    project.register_team(team)

    # 正常時はアラートなし
    assert check_urgent_events(project, pm) is None

    # 疲労蓄積で過労アラート
    dev.fatigue = 80.0
    urgent = check_urgent_events(project, pm)
    assert urgent is not None
    assert urgent["type"] == "MEMBER_OVERWORK"


def test_process_yearly_closing():
    pm = PM()
    dev_young = Developer("dev_y", "若手", age=24, resolution=0)
    dev_old = Developer("dev_o", "ベテラン", age=64, resolution=1)
    developers = [dev_young, dev_old]

    logs = process_yearly_closing(pm, developers)
    assert len(logs) > 0

    assert pm.completed_projects == 1
    assert pm.career_years == 2
    # 若手は加齢(25歳)し、解像度が1向上
    assert dev_young.age == 25
    assert dev_young.resolution == 1
    # ベテランは65歳で退職し、リストから除外される
    assert not any(d.id == "dev_o" for d in developers)
    # 新入社員が配属されている
    assert any("新入社員" in d.name for d in developers)


def test_project_public_methods():
    customer = Customer("c1", "テスト顧客", "QUALITY_ORIENTED")
    project = Project("テストPJ", 4, customer)

    pl = Developer("pl_1", "リーダー", leadership_skill=4)
    dev = Developer("dev_1", "開発者", tech_skill=3)

    # PL と Member のアサイン
    assert project.assign_pl(pl)
    assert project.assign_member(dev)

    assert len(project.teams) == 1
    assert project.main_team.leader == pl
    assert len(project.main_team.members) == 1

    # 状態取得テスト
    summary = project.get_status_summary()
    assert "テストPJ" in summary
    assert "テスト顧客" in summary

    status_dict = project.get_status_dict()
    assert status_dict["name"] == "テストPJ"
    assert status_dict["total_developers"] == 2
