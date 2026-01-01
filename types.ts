
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string;
  default_branch: string;
  updated_at: string;
}

export interface RepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export interface AppState {
  config: RepoConfig | null;
  selectedFile: GitHubFile | null;
  fileContent: string;
  isSidebarOpen: boolean;
  isAISidebarOpen: boolean;
  viewMode: 'read' | 'edit' | 'split';
  isSaving: boolean;
}

export interface AIChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSuggestion?: boolean;
}
