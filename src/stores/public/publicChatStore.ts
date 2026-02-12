import { defineStore } from 'pinia'
import { unsecuredClient } from '../../api/apiClient'

const AUTH_VERSION = '2.0'
const AUTH_VERSION_KEY = 'auth-version'

export const usePublicChatStore = defineStore('publicChatStore', () => {

  async function sendCode(email: string): Promise<void> {
    const url = `/chat/send-code/${encodeURIComponent(email)}`
    const res = await unsecuredClient.post(url)
    return res.data
  }

  async function verifyCode(email: string, code: string): Promise<{ success: boolean; sessionToken?: string; message: string }> {
    const url = `/chat/verify-code`
    const res = await unsecuredClient.post(url, { email, code })
    return res.data
  }

  async function registerListener(sessionToken: string, stationSlug: string, nickname?: string): Promise<{
    success: boolean
    listenerId: string
    userId: number
    userToken: string
    message: string
  }> {
    const url = `/chat/register-listener`
    const res = await unsecuredClient.post(url, { sessionToken, stationSlug, nickname })
    return res.data
  }

  async function refreshToken(userToken: string): Promise<{ success: boolean; userToken: string; message: string }> {
    const url = `/chat/refresh-token`
    try {
      const res = await unsecuredClient.post(url, { userToken })
      return res.data
    } catch (error: any) {
      console.warn('Token refresh failed:', error.response?.data?.error || 'Refresh failed')
      // Clear tokens on refresh failure and force re-authentication
      clearAuthTokens()
      throw error
    }
  }

  async function validateToken(token: string): Promise<{
    success: boolean
    valid: boolean
    registered: boolean
    userId?: number
    username?: string
  }> {
    const url = `/chat/validate-token`
    try {
      const res = await unsecuredClient.post(url, { token })
      return res.data
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.warn('Token validation failed:', error.response.data?.error || 'Invalid token')
        return { success: false, valid: false, registered: false }
      }
      throw error
    }
  }

  async function validateTokenWithAuth(token: string): Promise<{
    success: boolean
    valid: boolean
    registered: boolean
    userId?: number
    username?: string
  }> {
    const url = `/chat/validate-token`
    try {
      const res = await unsecuredClient.post(url, { token }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return res.data
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 401) {
        console.warn('Token validation with auth failed:', error.response.data?.error || 'Invalid token')
        return { success: false, valid: false, registered: false }
      }
      throw error
    }
  }

  function clearAuthTokens(): void {
    localStorage.removeItem('chatToken')
    localStorage.removeItem(AUTH_VERSION_KEY)
  }

  function checkAndClearOldTokens(): void {
    const currentVersion = localStorage.getItem(AUTH_VERSION_KEY)
    if (currentVersion !== AUTH_VERSION) {
      console.log('Auth version mismatch, clearing old tokens')
      clearAuthTokens()
      localStorage.setItem(AUTH_VERSION_KEY, AUTH_VERSION)
    }
  }

  return {
    sendCode,
    verifyCode,
    registerListener,
    refreshToken,
    validateToken,
    validateTokenWithAuth,
    clearAuthTokens,
    checkAndClearOldTokens
  }
})
