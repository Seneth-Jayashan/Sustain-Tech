import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import User from '@/models/User';
import Team from '@/models/Team';
import IntegrityLog from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { SCENARIOS } from '@/game/scenario';
import { ACTION_MATRIX } from '@/game/matrix';
import { getShuffledActionIds, ROUND_DEADLINE_SECONDS } from '@/game/timer';
import { calculateFinalOutcome, calculateTpi, findAction } from '@/game/engine';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const authSession = await getSession();
    if (!authSession || authSession.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 401 });
    }

    const { sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID parameter is required' }, { status: 400 });
    }

    await connectDB();

    // 1. Fetch target game session with populated references
    const gameSession = await GameSession.findById(sessionId)
      .populate('teamId')
      .populate('currentUserId', 'name email role')
      .lean();

    if (!gameSession) {
      return NextResponse.json({ error: 'Game session not found' }, { status: 404 });
    }

    const team = gameSession.teamId as any;
    const teamId = team?._id || gameSession.teamId;

    // 2. Fetch all registered competitors belonging to this team
    const teamMembers = await User.find({ teamId })
      .select('_id name email role createdAt')
      .sort({ createdAt: 1 })
      .lean();

    // 3. Fetch all integrity audit logs for this session
    const integrityLogs = await IntegrityLog.find({ gameSessionId: gameSession._id })
      .sort({ serverTimestamp: 1 })
      .lean();

    // 4. Compute Leaderboard Tournament Rank across all completed sessions
    const completedSessions = await GameSession.find({ status: 'COMPLETED' })
      .select('_id finalResult state')
      .lean();

    const getTierPriority = (tier?: string) => {
      if (!tier) return 5;
      if (tier.includes('Tier 1')) return 1;
      if (tier.includes('Tier 2')) return 2;
      if (tier.includes('Tier 3')) return 3;
      if (tier.includes('Tier 4')) return 4;
      return 5;
    };

    const sortedLeaderboard = [...completedSessions].sort((a: any, b: any) => {
      const tierA = getTierPriority(a.finalResult?.endingTier || a.finalResult?.rating);
      const tierB = getTierPriority(b.finalResult?.endingTier || b.finalResult?.rating);
      if (tierA !== tierB) return tierA - tierB;

      const tpiA = a.finalResult?.tpi ?? a.finalResult?.cps ?? 0;
      const tpiB = b.finalResult?.tpi ?? b.finalResult?.cps ?? 0;
      if (Math.abs(tpiA - tpiB) > 0.05) return tpiB - tpiA;

      const failuresA = Object.values(a.finalResult?.failureStates || {}).filter(Boolean).length;
      const failuresB = Object.values(b.finalResult?.failureStates || {}).filter(Boolean).length;
      if (failuresA !== failuresB) return failuresA - failuresB;

      const speedA = a.finalResult?.tpiDetails?.averageDecisionTimeSeconds ?? 60;
      const speedB = b.finalResult?.tpiDetails?.averageDecisionTimeSeconds ?? 60;
      return speedA - speedB;
    });

    const rankIndex = sortedLeaderboard.findIndex((s: any) => s._id.toString() === gameSession._id.toString());
    const tournamentRank = rankIndex !== -1 ? rankIndex + 1 : null;

    // 5. Build Round-by-Round Scenario Decision Audit Drill-Down
    const state = gameSession.state || {};
    const decisionHistory: any[] = state.decisionHistory || [];
    const seed = state.sessionSeed || 'default-tournament-seed';

    const roundsAudit: any[] = [];
    let runningBudget = 500;
    const financialLedger: any[] = [
      {
        round: 0,
        day: 0,
        event: 'Initial Treasury Allocation',
        expenditure: 0,
        grant: 0,
        netDelta: 0,
        endingBalance: 500,
        creditDrawn: 0,
        availableCredit: 200,
      }
    ];

    for (let bucket = 1; bucket <= 6; bucket++) {
      const scenario = SCENARIOS[bucket];
      const record = decisionHistory.find((d: any) => d.bucket === bucket);
      const configuredDuration = ROUND_DEADLINE_SECONDS[bucket] || 180;

      // Seeded presentation order of action cards
      const presentedCards = state.shuffledCardOrders?.[bucket] || getShuffledActionIds(bucket, seed);

      // Actions details
      let executedActionDetails: any[] = [];
      let roundExpenditure = 0;
      let roundGrant = 0;

      if (record) {
        // Detect executed action IDs (executedActionIds or top rankings)
        const actionIds: string[] = Array.isArray(record.executedActionIds) && record.executedActionIds.length > 0
          ? record.executedActionIds
          : (Array.isArray(record.actionIds) && record.actionIds.length > 0
              ? record.actionIds
              : (Array.isArray(record.rankings) && bucket !== 3 && bucket !== 4
                  ? record.rankings.slice(0, 3)
                  : []));

        // Evaluate standard ranking action details
        if (actionIds.length > 0 && bucket !== 3 && bucket !== 4) {
          executedActionDetails = actionIds
            .map((id: string) => {
              const action = findAction(id, bucket);
              if (!action) return null;
              const cost = action?.impacts?.emergencyBudget || 0;
              if (cost < 0) roundExpenditure += Math.abs(cost);
              if (cost > 0) roundGrant += cost;
              return {
                id,
                title: action?.title || id,
                cost,
                impacts: action?.impacts || {},
              };
            })
            .filter(Boolean);
        }

        // Handle custom allocation rounds
        if (bucket === 3) {
          if (record.allocations) {
            const alloc = record.allocations;
            const evac = Number(alloc.evacuation ?? alloc.evac ?? alloc['3A'] ?? 0);
            const water = Number(alloc.drinkingWater ?? alloc.water ?? alloc['3B'] ?? 0);
            const med = Number(alloc.medicalSupplies ?? alloc.medical ?? alloc['3C'] ?? 0);
            const totalSpent = evac + water + med;
            roundExpenditure = Math.min(100, totalSpent);
            executedActionDetails = [
              { id: '3A', title: `Evacuation Support - LKR ${evac}M`, cost: -evac, impacts: { floodPreparedness: Math.round((evac / 40) * 16) } },
              { id: '3B', title: `Drinking Water Delivery - LKR ${water}M`, cost: -water, impacts: { droughtPreparedness: Math.round((water / 50) * 18) } },
              { id: '3C', title: `Emergency Medical Supplies - LKR ${med}M`, cost: -med, impacts: { communityTrust: Math.round((med / 30) * 8) } },
            ].filter(a => Math.abs(a.cost) > 0);
          } else if (record.rankings && record.rankings.length > 0) {
            const topPkgId = record.rankings[0];
            const act = findAction(topPkgId, 3);
            const cost = act?.impacts?.emergencyBudget ?? -100;
            if (cost < 0) roundExpenditure = Math.abs(cost);
            if (cost > 0) roundGrant = cost;
            executedActionDetails = [{
              id: topPkgId,
              title: act?.title || `Package ${topPkgId}`,
              cost,
              impacts: act?.impacts || {},
            }];
          }
        } else if (bucket === 4) {
          if (record.allocations) {
            roundExpenditure = 60;
            executedActionDetails = [
              { id: '4-LOGISTICS', title: 'National Emergency Fleet Mobilization Fee', cost: -60, impacts: { operations: 'Fleet Distributed' } }
            ];
          } else if (record.rankings && record.rankings.length > 0) {
            const topPlanId = record.rankings[0];
            const act = findAction(topPlanId, 4);
            const cost = act?.impacts?.emergencyBudget ?? -60;
            if (cost < 0) roundExpenditure = Math.abs(cost);
            if (cost > 0) roundGrant = cost;
            executedActionDetails = [{
              id: topPlanId,
              title: act?.title || `Preset Fleet Plan ${topPlanId}`,
              cost,
              impacts: act?.impacts || {},
            }];
          }
        }

        // Authoritative reconciliation with game engine's stored financialEffects
        let netChange = roundGrant - roundExpenditure;
        if (record.financialEffects?.budgetDelta !== undefined) {
          netChange = record.financialEffects.budgetDelta;
          if (roundExpenditure === 0 && roundGrant === 0) {
            if (netChange < 0) roundExpenditure = Math.abs(netChange);
            if (netChange > 0) roundGrant = netChange;
          } else {
            const diff = netChange - (roundGrant - roundExpenditure);
            if (diff > 0) roundGrant += diff;
            if (diff < 0) roundExpenditure += Math.abs(diff);
          }
        }

        if (record.financialEffects?.treasuryRemaining !== undefined) {
          runningBudget = record.financialEffects.treasuryRemaining;
        } else {
          runningBudget += netChange;
        }

        const creditDrawn = runningBudget < 0 ? Math.min(200, Math.abs(runningBudget)) : 0;
        const availableCredit = Math.max(0, 200 - creditDrawn);

        const rawTitle = scenario?.title || `Round ${bucket}`;
        const cleanTitle = rawTitle.startsWith(`Day ${scenario?.day}: `)
          ? rawTitle
          : rawTitle.replace(/^Day \d+[:\- ]*/, `Day ${scenario?.day}: `);

        financialLedger.push({
          round: bucket,
          day: scenario?.day ?? (bucket - 1) * 2,
          event: cleanTitle,
          expenditure: roundExpenditure,
          grant: roundGrant,
          netDelta: netChange,
          endingBalance: runningBudget,
          creditDrawn,
          availableCredit,
        });
      }

      roundsAudit.push({
        round: bucket,
        day: scenario?.day ?? (bucket - 1) * 2,
        scenarioTitle: scenario?.title || `Round ${bucket}`,
        situation: scenario?.situation || '',
        events: scenario?.events || [],
        presentedCards,
        submittedRankings: record?.submittedRankings || record?.rankings || [],
        executedActions: executedActionDetails,
        allocations: record?.allocations || null,
        timing: {
          roundStartedAt: record?.roundStartedAt || null,
          roundDeadlineAt: record?.roundDeadlineAt || null,
          decisionSubmittedAt: record?.decisionSubmittedAt || null,
          responseTimeMs: record?.responseTimeMs ?? null,
          responseTimeSeconds: record?.timeSpentSeconds ?? (record?.responseTimeMs ? Math.round(record.responseTimeMs / 1000) : null),
          roundDurationSeconds: record?.roundDurationSeconds || configuredDuration,
          timedOut: Boolean(record?.timedOut),
          timeRemainingSeconds: record?.roundDurationSeconds && record?.timeSpentSeconds 
            ? Math.max(0, record.roundDurationSeconds - record.timeSpentSeconds)
            : null,
          overtimeSeconds: record?.timedOut && record?.timeSpentSeconds && record?.roundDurationSeconds
            ? Math.max(0, record.timeSpentSeconds - record.roundDurationSeconds)
            : 0,
        },
        intervention: {
          fallbackApplied: Boolean(record?.fallbackApplied),
          fallbackPolicyDetails: record?.fallbackPolicyDetails || null,
        },
        attribution: {
          userId: record?.userId || null,
          userName: record?.userName || (record?.fallbackApplied ? 'Automated Contingency Fallback' : 'Authenticated Competitor'),
          isHumanSubmitted: !record?.fallbackApplied,
        },
        stateSnapshot: record?.stateSnapshot || null,
      });
    }

    // 6. Score Calculation Breakdown & Reconciliation
    const calculatedOutcome = calculateFinalOutcome(state as any);
    const finalResult = gameSession.finalResult || (gameSession.status === 'COMPLETED' ? calculatedOutcome : null);
    const tpiData = finalResult?.tpiDetails || calculatedOutcome.tpiDetails || { averageDecisionTimeSeconds: 0 };
    const calculationDetails = finalResult?.calculationDetails || calculatedOutcome.calculationDetails || null;

    const humanDecisionsCount = decisionHistory.filter((d: any) => !d.fallbackApplied).length;
    const timeoutsCount = decisionHistory.filter((d: any) => d.timedOut || d.fallbackApplied).length;
    const totalCampaignSeconds = decisionHistory.reduce((acc: number, d: any) => acc + (d.timeSpentSeconds || 0), 0);

    // 7. Integrity Audit Summary & Grouping
    const integritySummary = {
      totalEvents: integrityLogs.length,
      highPriorityCount: integrityLogs.filter((l: any) => l.severity === 'high_priority').length,
      reviewSignalCount: integrityLogs.filter((l: any) => l.severity === 'review_signal').length,
      infoCount: integrityLogs.filter((l: any) => l.severity === 'info' || !l.severity).length,
      visibilityChangesCount: integrityLogs.filter((l: any) => l.actionType === 'VISIBILITY_CHANGE').length,
      windowBlurCount: integrityLogs.filter((l: any) => l.actionType === 'WINDOW_BLUR').length,
      rightClickCount: integrityLogs.filter((l: any) => l.actionType === 'RIGHT_CLICK_ATTEMPT').length,
      copyPasteCount: integrityLogs.filter((l: any) => l.actionType === 'COPY_PASTE_ATTEMPT').length,
      reconnectCount: integrityLogs.filter((l: any) => l.actionType === 'RECONNECT').length,
      repeatedRequestsCount: integrityLogs.filter((l: any) => l.actionType === 'REPEATED_REQUEST').length,
      deadlineManipulationCount: integrityLogs.filter((l: any) => l.actionType === 'DEADLINE_MANIPULATION_ATTEMPT').length,
      unusualPatternCount: integrityLogs.filter((l: any) => l.actionType === 'UNUSUAL_SUBMISSION_PATTERN').length,
      invalidSubmissionsCount: integrityLogs.filter((l: any) => l.actionType === 'INVALID_SUBMISSION_ATTEMPT').length,
    };

    return NextResponse.json({
      success: true,
      investigation: {
        sessionIdentity: {
          sessionId: gameSession._id,
          teamId,
          teamName: team?.name || 'Unassigned Team',
          currentCommander: gameSession.currentUserId || null,
          status: gameSession.status,
          simulationMode: state.simulationMode || 'tournament',
          sessionSeed: seed,
          createdAt: gameSession.createdAt,
          updatedAt: gameSession.updatedAt,
          startTime: decisionHistory[0]?.roundStartedAt || gameSession.createdAt,
          endTime: decisionHistory[decisionHistory.length - 1]?.decisionSubmittedAt || gameSession.updatedAt,
          assignedCompetitors: teamMembers.map((m: any) => ({
            id: m._id,
            name: m.name,
            email: m.email,
            role: m.role,
          })),
        },
        tournamentScore: {
          cps: finalResult?.cps ?? null,
          tpi: finalResult?.tpi ?? null,
          endingTier: finalResult?.endingTier || finalResult?.rating || 'In Progress',
          tournamentRank,
          totalCompletedTeams: completedSessions.length,
          failureStates: finalResult?.failureStates || {},
          breachedFailuresCount: Object.values(finalResult?.failureStates || {}).filter(Boolean).length,
          humanDecisionsCount,
          timeoutsCount,
          participationMultiplier: Number((humanDecisionsCount / 6).toFixed(3)),
          averageResponseSpeedSeconds: tpiData.averageDecisionTimeSeconds,
          totalCampaignSeconds,
          plannedAllowanceSeconds: 1200, // 20:00 tournament cap
          scoreBreakdown: finalResult?.scoreBreakdown || null,
          calculationDetails,
          tpiDetails: tpiData,
        },
        roundsAudit,
        financialLedger,
        integritySummary,
        integrityLogs,
        rawState: {
          resources: state.resources,
          scores: state.scores,
          operations: state.operations,
          information: state.information,
          community: state.community,
          shuffledCardOrders: state.shuffledCardOrders,
        }
      }
    });
  } catch (error: any) {
    console.error('Admin Session Investigation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
