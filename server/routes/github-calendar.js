import { Router } from 'express';

const router = Router();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, timestamp: 0 };

router.get('/', async (req, res) => {
  if (cache.data && (Date.now() - cache.timestamp < CACHE_TTL)) {
    return res.json(cache.data);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN is missing in environment' });
  }

  const query = `
    query {
      user(login: "Garnavya") {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) throw new Error(`GraphQL Error: ${response.status}`);
    
    const json = await response.json();
    if (json.errors) throw new Error(json.errors[0].message);

    const calendar = json.data.user.contributionsCollection.contributionCalendar;
    
    // Map GitHub's string enum to 0-4 intensity integers
    const levelMap = {
      'NONE': 0,
      'FIRST_QUARTILE': 1,
      'SECOND_QUARTILE': 2,
      'THIRD_QUARTILE': 3,
      'FOURTH_QUARTILE': 4
    };

    const formattedData = {
      total: calendar.totalContributions,
      weeks: calendar.weeks.map(week => 
        week.contributionDays.map(day => ({
          date: day.date,
          count: day.contributionCount,
          level: levelMap[day.contributionLevel] || 0
        }))
      )
    };

    cache = { data: formattedData, timestamp: Date.now() };
    res.json(formattedData);
  } catch (error) {
    console.error('Calendar Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch contribution calendar' });
  }
});

export default router;