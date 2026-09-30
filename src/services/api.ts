import {
  UserProfile,
  Skill,
  Goal,
  PracticeSession,
  Post,
  Comment,
  DashboardAnalytics
} from '../types';

const TOKEN_KEY = 'cloud_hobby_auth_token';
const USER_KEY = 'cloud_hobby_auth_user';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredAuth = (token: string, user: UserProfile) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): UserProfile | null => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data && data.error ? data.error : `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(payload: { name: string; username: string; email: string; password: string }) {
      const res = await apiRequest<{ token: string; user: UserProfile; message: string }>('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setStoredAuth(res.token, res.user);
      return res;
    },

    async login(payload: { email: string; password: string }) {
      const res = await apiRequest<{ token: string; user: UserProfile; message: string }>('/api/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setStoredAuth(res.token, res.user);
      return res;
    },

    async logout() {
      try {
        await apiRequest('/api/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Logout API warning:', e);
      } finally {
        clearStoredAuth();
      }
    },

    async getProfile(): Promise<UserProfile> {
      return apiRequest<UserProfile>('/api/profile');
    },

    async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
      const updated = await apiRequest<UserProfile>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const token = getStoredToken();
      if (token) setStoredAuth(token, updated);
      return updated;
    },

    async getPublicProfile(uid: string): Promise<UserProfile> {
      return apiRequest<UserProfile>(`/api/users/${uid}`);
    }
  },

  skills: {
    async getAll(): Promise<Skill[]> {
      return apiRequest<Skill[]>('/api/skills');
    },

    async getById(id: string): Promise<Skill> {
      return apiRequest<Skill>(`/api/skills/${id}`);
    },

    async create(skill: Omit<Skill, 'skill_id' | 'user_id' | 'created_at'>): Promise<Skill> {
      return apiRequest<Skill>('/api/skills', {
        method: 'POST',
        body: JSON.stringify(skill)
      });
    },

    async update(id: string, updates: Partial<Skill>): Promise<Skill> {
      return apiRequest<Skill>(`/api/skills/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async delete(id: string): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/api/skills/${id}`, {
        method: 'DELETE'
      });
    }
  },

  practice: {
    async getAll(skillId?: string): Promise<PracticeSession[]> {
      const url = skillId ? `/api/skills/${skillId}/practice` : '/api/practice';
      return apiRequest<PracticeSession[]>(url);
    },

    async log(data: {
      skill_id: string;
      duration_minutes: number;
      activity: string;
      notes?: string;
      practiced_at?: string;
    }): Promise<{ session: PracticeSession; streak: number; milestonesAchieved: string[] }> {
      return apiRequest('/api/practice', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  goals: {
    async getAll(): Promise<Goal[]> {
      return apiRequest<Goal[]>('/api/goals');
    },

    async create(data: {
      skill_id: string;
      title: string;
      target_value: number;
      unit?: string;
      deadline?: string;
      initial_milestones?: number[];
    }): Promise<Goal> {
      return apiRequest<Goal>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async update(id: string, updates: Partial<Goal>): Promise<Goal> {
      return apiRequest<Goal>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async delete(id: string): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/api/goals/${id}`, {
        method: 'DELETE'
      });
    }
  },

  community: {
    async getFeed(params: {
      category?: string;
      search?: string;
      sort?: 'recent' | 'likes';
      limit?: number;
    } = {}): Promise<Post[]> {
      const query = new URLSearchParams();
      if (params.category) query.append('category', params.category);
      if (params.search) query.append('search', params.search);
      if (params.sort) query.append('sort', params.sort);
      if (params.limit) query.append('limit', params.limit.toString());

      const qs = query.toString();
      return apiRequest<Post[]>(`/api/feed${qs ? `?${qs}` : ''}`);
    },

    async createPost(data: {
      content: string;
      skill_id?: string;
      milestone?: string;
      media_url?: string;
    }): Promise<Post> {
      return apiRequest<Post>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async deletePost(id: string): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/api/posts/${id}`, {
        method: 'DELETE'
      });
    },

    async toggleLike(postId: string): Promise<{ liked: boolean; likesCount: number }> {
      return apiRequest<{ liked: boolean; likesCount: number }>(`/api/posts/${postId}/like`, {
        method: 'POST'
      });
    },

    async getComments(postId: string): Promise<Comment[]> {
      return apiRequest<Comment[]>(`/api/posts/${postId}/comments`);
    },

    async addComment(postId: string, text: string): Promise<Comment> {
      return apiRequest<Comment>(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
    },

    async deleteComment(postId: string, commentId: string): Promise<{ message: string }> {
      return apiRequest<{ message: string }>(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE'
      });
    }
  },

  files: {
    async uploadImage(file: File): Promise<{ url: string; size: number }> {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB.');
      }

      // Read file as base64 data URL
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      return apiRequest<{ url: string; size: number }>('/api/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          data: base64Data,
          filename: file.name,
          mimeType: file.type
        })
      });
    }
  },

  analytics: {
    async getDashboard(): Promise<DashboardAnalytics> {
      return apiRequest<DashboardAnalytics>('/api/analytics/dashboard');
    }
  },

  seed: {
    async resetSeed(): Promise<{ message: string }> {
      return apiRequest<{ message: string }>('/api/seed', { method: 'POST' });
    }
  }
};
