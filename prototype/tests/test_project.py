from prototype.src.entities import Customer, Developer, Project


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
