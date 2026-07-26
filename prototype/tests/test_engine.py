from prototype.src.engine import (
    calculate_final_score,
    check_urgent_events,
    evaluate_project_status,
    process_yearly_closing,
)
from prototype.src.entities import PM, Customer, Developer, Project, Task, Team


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


def test_evaluate_project_status_and_scoring():
    customer = Customer("c1", "テスト顧客", "QUALITY_ORIENTED")
    project = Project("テストPJ", 4, customer)
    pm = PM()
    dev = Developer("dev1", "テスト開発者", age=30)
    project.assign_member(dev)

    tasks = [Task("t1", "タスク1", 10.0)]

    # 完了前
    assert evaluate_project_status(project, tasks) == "IN_PROGRESS"

    # タスク完了
    tasks[0].status = "DONE"
    assert evaluate_project_status(project, tasks) == "SUCCESS"

    # スコア評価テスト
    score = calculate_final_score(project, pm)
    assert "total_score" in score
    assert "rank" in score
    assert score["total_score"] > 0
