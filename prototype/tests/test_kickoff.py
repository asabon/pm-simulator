from prototype.src.data import get_initial_developer_pool, get_initial_project_data
from prototype.src.entities import PM, Team
from prototype.src.kickoff import KickoffPhase


def test_kickoff_phase_initialization():
    project, _ = get_initial_project_data(1)
    team_pool = get_initial_developer_pool()
    team = Team(team_id="t1", name="Test Team")
    team.set_leader(team_pool[0])

    pm = PM()
    kickoff = KickoffPhase(project, team, pm)

    assert kickoff.ap == 3
    assert kickoff.max_ap == 3
    assert kickoff.obtained_knowledge == set()
    assert kickoff.interview_ap_invested["PL"] == 0


def test_kickoff_diminishing_returns():
    project, _ = get_initial_project_data(1)
    team_pool = get_initial_developer_pool()
    team = Team(team_id="t1", name="Test Team")
    team.set_leader(team_pool[0])

    pm = PM()
    kickoff = KickoffPhase(project, team, pm)

    # 1回目のAP投入
    kickoff._execute_action("PL", "1", 1)
    assert "PL_TECH_ANXIETY" in kickoff.obtained_knowledge

    # 3回目のAP投入 (頭打ち: +0%)
    kickoff._execute_action("PL", "1", 3)
    # エラーなく動作し、0%加算になること
