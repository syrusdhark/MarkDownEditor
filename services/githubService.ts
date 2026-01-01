
import { GitHubFile, GitHubRepo, RepoConfig } from '../types';

export const githubService = {
  async fetchUserRepos(token: string): Promise<GitHubRepo[]> {
    const response = await fetch(
      `https://api.github.com/user/repos?sort=updated&per_page=100`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch repositories. Check your token permissions.');
    return response.json();
  },

  async fetchFiles(config: RepoConfig, path: string = ''): Promise<GitHubFile[]> {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch files from GitHub');
    return response.json();
  },

  async fetchFileContent(config: RepoConfig, path: string): Promise<string> {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch file content');
    return response.text();
  },

  async commitChanges(
    config: RepoConfig,
    path: string,
    content: string,
    sha: string,
    message: string
  ): Promise<void> {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: btoa(unescape(encodeURIComponent(content))),
          sha,
          branch: config.branch,
        }),
      }
    );
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to commit changes');
    }
  },

  async fetchCommits(config: RepoConfig, path: string) {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/commits?path=${path}&sha=${config.branch}`,
      {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch commits');
    return response.json();
  }
};
