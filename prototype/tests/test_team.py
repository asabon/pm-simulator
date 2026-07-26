from prototype.src.entities import Developer, Team


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
