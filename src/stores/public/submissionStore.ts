import { defineStore } from 'pinia'
import { unsecuredClient, publicApiRoot } from '../../api/apiClient'
import { SubmissionPayload } from '../../types/kneoBroadcasterTypes'
import { SSEProgress } from '../../utils/fileUpload'
import type { ProgressState } from '../../utils/fileUpload'

export const useSubmissionStore = defineStore( 'submissionStore', () => {
  type Station = {
    name: string
    slugName: string
    managedBy?: string
    djName?: string
    djPreferredLang?: string
    djStatus?: string
    currentStatus?: string
    countryCode?: string
    color?: string
    description?: string
    availableSongs?: number
    submissionPolicy?: string
    animation?: {
      enabled: boolean
      type: string
      speed: number
    }
  }

  async function sendCode( email: string ): Promise<void> {
    const url = `/messaging/send-code/${encodeURIComponent( email )}`
    console.debug( '[submissionStore.sendCode] POST', url )
    try {
      const res = await unsecuredClient.post( url )
      console.debug( '[submissionStore.sendCode] OK', res.status )
    } catch ( err: any ) {
      console.error( '[submissionStore.sendCode] FAIL', url, err?.response?.status, err?.response?.data || err?.message )
      throw err
    }
  }

  async function getStation( brand: string ): Promise<Station> {
    const url = `${publicApiRoot}/radio/all-stations/${encodeURIComponent(brand)}`
    console.debug( '[submissionStore.getStation] GET', url )
    try {
      const res = await unsecuredClient.get( url )
      console.debug( '[submissionStore.getStation] OK', res.status )
      return res.data as Station
    } catch ( err: any ) {
      console.error( '[submissionStore.getStation] FAIL', url, err?.response?.status, err?.response?.data || err?.message )
      throw err
    }
  }

  function connectPublicSSE(
    state: ProgressState,
    brand: string,
    uploadId: string,
    originalFileName: string,
    callbacks: {
      onDisplayProgress: ( progress: number ) => void,
      onFinished: ( final: { fileName?: string; fileId?: string; metadata?: any } ) => void,
      onError?: ( error?: any ) => void,
      onRawData?: ( data: any ) => void,
    }
  ): EventSource {
    const url = `${publicApiRoot}/radio/${encodeURIComponent( brand )}/submissions/files/${uploadId}/stream`
    console.debug( '[submissionStore.connectPublicSSE]', { url, brand, uploadId, originalFileName } )
    const es = SSEProgress( state, url, callbacks )
    return es
  }

  async function submit( data: SubmissionPayload ): Promise<void> {
    const url = `${publicApiRoot}/radio/${encodeURIComponent( data.brand )}/submissions`
    console.debug( '[submissionStore.submit] POST', url, {
      brand: data.brand,
      artist: data.artist,
      title: data.title,
      email: data.email,
      genresCount: Array.isArray( data.genres ) ? data.genres.length : 0,
      agreementVersion: ( data as any ).agreementVersion,
      isShareable: ( data as any ).isShareable,
      shareable: ( data as any ).shareable,
      hasAttachedMessage: !!( data as any ).attachedMessage,
      newlyUploadedCount: Array.isArray( ( data as any ).newlyUploaded ) ? ( data as any ).newlyUploaded.length : 0
    } )
    try {
      const res = await unsecuredClient.post( url, data )
      console.debug( '[submissionStore.submit] OK', res.status )
    } catch ( err: any ) {
      console.error( '[submissionStore.submit] FAIL', url, err?.response?.status, err?.response?.data || err?.message )
      throw err
    }
  }

  async function startUploadSession( brand: string, uploadId: string, startTime: number ): Promise<{ estimatedDurationSeconds: number }> {
    const url = `${publicApiRoot}/radio/${encodeURIComponent( brand )}/submissions/files/start?uploadId=${uploadId}&startTime=${startTime}`
    console.debug( '[submissionStore.startUploadSession] GET', url )
    try {
      const res = await unsecuredClient.get( url, {
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      } )
      console.debug( '[submissionStore.startUploadSession] OK', res.status, res.data )
      return res.data
    } catch ( err: any ) {
      console.error( '[submissionStore.startUploadSession] FAIL', url, err?.response?.status, err?.response?.data || err?.message )
      throw err
    }
  }

  async function uploadFile( file: File, brand: string, entityId: string, uploadId: string, onUploadProgress?: (pct: number, loaded: number, total?: number) => void ): Promise<any> {
    const formData = new FormData()
    formData.append( 'file', file )
    const url = `${publicApiRoot}/radio/${encodeURIComponent( brand )}/submissions/files/${encodeURIComponent( entityId )}?uploadId=${uploadId}`
    console.debug( '[submissionStore.uploadFile] POST', url, {
      name: file?.name,
      size: file?.size,
      type: file?.type
    } )
    try {
      const res = await unsecuredClient.post( url, formData, {
        timeout: 600000,
        maxContentLength: 200 * 1024 * 1024,
        maxBodyLength: 200 * 1024 * 1024,
        onUploadProgress: (evt: ProgressEvent) => {
          try {
            const total = evt.total ?? file.size ?? 0
            const loaded = evt.loaded ?? 0
            const pct = total > 0 ? Math.min(99, Math.round((loaded / total) * 100)) : 0
            if (onUploadProgress) onUploadProgress(pct, loaded, total)
          } catch (_) { /* noop */ }
        }
      } )
      console.debug( '[submissionStore.uploadFile] OK', res.status )
      return res.data
    } catch ( err: any ) {
      console.error( '[submissionStore.uploadFile] FAIL', url, err?.response?.status, err?.response?.data || err?.message )
      throw err
    }
  }

  return {
    sendCode,
    submit,
    startUploadSession,
    uploadFile,
    connectPublicSSE,
    getStation,
  }
} );
