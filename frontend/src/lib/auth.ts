// 身份验证相关的API函数
import { API_BASE } from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: string
  email: string
  is_active: boolean
}

export const auth_api = {
  // 登录函数
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    // 注意：后端登录接口使用OAuth2PasswordRequestForm，需要传递字段username
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)

    const response = await fetch(`${API_BASE}/api/login/access-token`, {
      method: 'POST',
      body: formData,
    })
  
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '登录失败')
    }
  
    return response.json()
  },
  
  // 注册函数
  async register(data: RegisterData): Promise<UserProfile> {
    const response = await fetch(`${API_BASE}/api/users/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
  
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '注册失败')
    }
  
    return response.json()
  },
  
  // 获取当前用户信息
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = localStorage.getItem('token')
    if (!token) return null
  
    try {
      const response = await fetch(`${API_BASE}/api/login/test-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })
  
      if (!response.ok) {
        localStorage.removeItem('token')
        return null
      }
  
      return response.json()
    } catch (error) {
      localStorage.removeItem('token')
      return null
    }
  },
}