import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMemberIds(members: unknown) {
  if (members === undefined) return [];
  if (!Array.isArray(members)) throw badRequest('Members must be an array of valid user IDs.');
  return members.map((member) => {
    const raw = String(member);
    if (!mongoose.isValidObjectId(raw)) throw badRequest('Members must contain valid user IDs.');
    return new mongoose.Types.ObjectId(raw);
  });
}

function toFocusFromGoal(goal: string | undefined) {
  if (!goal) return 'endurance';
  const normalized = goal.toLowerCase();
  if (normalized.includes('strength')) return 'strength';
  if (normalized.includes('mobility') || normalized.includes('flex')) return 'mobility';
  return 'endurance';
}

function toFocusFromActivityType(type: string | undefined) {
  const normalized = type?.toLowerCase() ?? '';
  if (normalized.includes('strength') || normalized.includes('lift') || normalized.includes('squat')) return 'strength';
  if (normalized.includes('walk') || normalized.includes('mobility') || normalized.includes('stretch') || normalized.includes('yoga')) return 'mobility';
  return 'endurance';
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity payload is required.');

  const payload = input as Record<string, unknown>;
  const userId = normalizeText(payload.userId);
  const teamId = normalizeText(payload.teamId);
  const type = normalizeText(payload.type);
  const minutesValue = Number(payload.minutes);

  if (!userId || !teamId || !type || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw badRequest('Activity requires a valid userId, teamId, type, and positive minutes.');
  }

  if (!mongoose.isValidObjectId(userId)) throw badRequest('userId must be a valid MongoDB identifier.');
  if (!mongoose.isValidObjectId(teamId)) throw badRequest('teamId must be a valid MongoDB identifier.');

  const userExists = await User.exists({ _id: userId });
  const teamExists = await Team.exists({ _id: teamId });

  if (!userExists) throw notFound('User not found.');
  if (!teamExists) throw notFound('Team not found.');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: minutesValue,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team payload is required.');

  const payload = input as Record<string, unknown>;
  const name = normalizeText(payload.name);
  const mascot = normalizeText(payload.mascot);
  const members = normalizeMemberIds(payload.members);

  if (!name) throw badRequest('Team name is required.');
  if (!mascot) throw badRequest('Team mascot is required.');

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.find().sort({ name: 1 }).lean();
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);

  const totalsByTeam = new Map<string, number>();
  for (const item of totals) {
    totalsByTeam.set(String(item._id), Number(item.totalPoints ?? 0));
  }

  const leaderboard = teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(String(team._id)) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = normalizeText(userEmail).toLowerCase();
  if (!normalizedEmail) throw badRequest('A user email is required.');

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw notFound('User not found.');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentType = recentActivities[0]?.type as string | undefined;
  const preferredFocus = toFocusFromGoal(user.fitnessGoal) ?? toFocusFromActivityType(recentType);
  const fallbackFocus = toFocusFromActivityType(recentType) || toFocusFromGoal(user.fitnessGoal);

  const workouts = await Workout.find({ focus: preferredFocus }).sort({ minutes: 1 }).lean();
  const fallbackWorkouts = workouts.length > 0 ? workouts : await Workout.find({ focus: fallbackFocus }).sort({ minutes: 1 }).lean();

  if (fallbackWorkouts.length === 0) {
    const genericWorkouts = await Workout.find().sort({ minutes: 1 }).lean();
    if (genericWorkouts.length === 0) return [];
    return genericWorkouts.map((workout) => ({
      ...workout,
      reason: `Based on your recent activity and goal, this ${workout.focus} workout is a strong match.`,
    }));
  }

  return fallbackWorkouts.map((workout) => ({
    ...workout,
    reason: `Based on your recent ${recentType ?? 'activity'} activity and ${user.fitnessGoal ?? 'goal'}, this ${workout.focus} workout is a strong match.`,
  }));
}

export { User };
