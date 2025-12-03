import { defineStore } from 'pinia'
import { unsecuredClient } from '../../api/apiClient'

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
    const res = await unsecuredClient.post(url, { userToken })
    return res.data
  }

  return {
    sendCode,
    verifyCode,
    registerListener,
    refreshToken
  }
})
