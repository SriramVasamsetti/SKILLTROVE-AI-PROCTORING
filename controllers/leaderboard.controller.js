const QuizAttempt = require('../models/quizAttempt.model');
const { asyncHandler } = require('../middleware/asyncHandler');

async function getLeaderboard(req, res) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rawAttempts = await QuizAttempt.aggregate([
    {
      $match: { completedAt: { $exists: true, $ne: null } }
    },
    {
      $group: {
        _id: '$userId',
        highestScore: { $max: '$totalScore' },
        fastestTime: { $min: { $subtract: ['$completedAt', '$createdAt'] } },
        totalSkillPoints: { $sum: '$totalScore' },
        totalScoreEarned: { $sum: '$totalScore' },
        totalMaxPossible: { $sum: '$maxScore' },
        attemptsList: { $push: '$completedAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $sort: { highestScore: -1, fastestTime: 1 }
    },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        profileImage: '$user.profileImage',
        highestScore: 1,
        totalSkillPoints: 1,
        fastestTime: 1,
        totalScoreEarned: 1,
        totalMaxPossible: 1,
        attemptsList: 1
      }
    }
  ]);

  const leaderboard = rawAttempts.map((u, i) => {
    const dates = u.attemptsList.map(d => new Date(d).toISOString().split('T')[0]).sort();
    const uniqueDates = [...new Set(dates)];
    
    // Streak
    let streak = 0;
    let curr = new Date();
    while (true) {
      const dStr = curr.toISOString().split('T')[0];
      if (uniqueDates.includes(dStr)) {
        streak++;
        curr.setDate(curr.getDate() - 1);
      } else {
        if (streak === 0) {
          curr.setDate(curr.getDate() - 1);
          const yStr = curr.toISOString().split('T')[0];
          if (uniqueDates.includes(yStr)) {
            streak++;
            curr.setDate(curr.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    // Accuracy
    const accuracy = u.totalMaxPossible > 0 ? Math.round((u.totalScoreEarned / u.totalMaxPossible) * 100) : 0;

    // Heatmap (last 30 days)
    const heatmap = [];
    curr = new Date(thirtyDaysAgo);
    const end = new Date();
    while (curr <= end) {
      const dStr = curr.toISOString().split('T')[0];
      heatmap.push({
        date: dStr,
        count: dates.filter(d => d === dStr).length
      });
      curr.setDate(curr.getDate() + 1);
    }

    return {
      userId: u.userId,
      name: u.name,
      profileImage: u.profileImage,
      highestScore: u.highestScore,
      totalSkillPoints: u.totalSkillPoints,
      fastestTime: u.fastestTime,
      rank: i + 1,
      streak,
      accuracy,
      heatmap
    };
  });

  res.json(leaderboard);
}

module.exports = {
  getLeaderboard: asyncHandler(getLeaderboard)
};
