import { Router } from 'express';
import config from '../config/env.js';

// Helper for relative time (e.g., "2h ago")
function getRelativeTime(dateString) {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours || 1}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// Simple color map for languages (matching your CSS vars)
const langColors = {
  JavaScript: '#e8c059',
  TypeScript: 'var(--violet)',
  Shell: 'var(--teal)',
  HTML: 'var(--rose)',
  CSS: 'var(--teal-dim)',
  Python: '#3572A5'
};

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

// --- GITHUB ACTIVITY ROUTE ---
router.get('/github/activity', async (req, res) => {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Twoface-Portfolio-App'
    };
    
    if (config.githubToken) {
      headers['Authorization'] = `token ${config.githubToken}`;
    }

    // 1. Fetch 6 most recently pushed repos
    const reposRes = await fetch(
      `https://api.github.com/users/${config.githubUsername}/repos?sort=pushed&per_page=6`,
      { headers }
    );
    
    if (!reposRes.ok) throw new Error(`GitHub API error: ${reposRes.statusText}`);
    const reposData = await reposRes.json();

    // 2. Format repos and fetch recent commits for each
    const formattedRepos = await Promise.all(reposData.map(async (repo) => {
      let commits = [];
      
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${config.githubUsername}/${repo.name}/commits?per_page=2`,
          { headers }
        );
        if (commitsRes.ok) {
          const commitsData = await commitsRes.json();
          commits = commitsData.map(c => ({
            hash: c.sha.substring(0, 7),
            msg: c.commit.message.split('\n')[0], // Get first line of commit message
            time: getRelativeTime(c.commit.author.date)
          }));
        }
      } catch (err) {
        console.error(`Failed to fetch commits for ${repo.name}`);
      }

      return {
        name: repo.name,
        lang: repo.language || 'Markdown',
        langColor: langColors[repo.language] || 'var(--text-dim)',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        lastPushed: getRelativeTime(repo.pushed_at),
        live: repo.has_pages, // Use GitHub Pages as a proxy for "live", or adjust logic
        commits: commits
      };
    }));

    res.json(formattedRepos);
  } catch (error) {
    console.error('GitHub Activity Error:', error);
    res.status(500).json({ error: 'Failed to fetch GitHub activity' });
  }
});

export default router;
