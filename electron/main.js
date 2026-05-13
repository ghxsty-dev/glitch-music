import { app, BrowserWindow, Menu, Tray, dialog, globalShortcut, ipcMain, nativeImage, shell, clipboard } from 'electron'
import RPC from 'discord-rpc'
import updaterPkg from 'electron-updater'
import { powerSaveBlocker } from 'electron'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { autoUpdater } = updaterPkg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const parseDotEnvContent = (content = '') => {
  const result = {}
  for (const rawLine of String(content).split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex <= 0) continue
    const key = line.slice(0, eqIndex).trim()
    if (!key) continue
    let value = line.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

const loadEnvFileIntoProcess = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return
    const parsed = parseDotEnvContent(fs.readFileSync(filePath, 'utf8'))
    for (const [key, value] of Object.entries(parsed)) {
      if (!String(value ?? '').trim()) continue
      const current = String(process.env[key] ?? '').trim()
      if (!current) {
        process.env[key] = value
      }
    }
  } catch {
    // env parse errors should never block app startup
  }
}

// Electron main process .env yükleme (npm start / packaged davranışı için).
loadEnvFileIntoProcess(path.join(projectRoot, '.env'))
loadEnvFileIntoProcess(path.join(projectRoot, '.env.local'))

const discordClientId = process.env.DISCORD_CLIENT_ID || '1493213707864510464'
const discordLargeImageKey = process.env.DISCORD_LARGE_IMAGE_KEY || 'glitch_music_logo'
const discordSmallImageKey = process.env.DISCORD_SMALL_IMAGE_KEY || 'glitch_music_note'
// Sunucusuz (webhook-only) kullanım için buraya webhook URL gömülebilir.
// Güvenlik notu: istemciye gömülen webhook herkes tarafından görülebilir.
const BUILTIN_DISCORD_ERROR_WEBHOOK_URL = 'https://discord.com/api/webhooks/1497923192415584459/HGlmjOn2xHXiqeSwnGTXw5iVJf6ctQI-hw9A4SF9AK37HTIwg4a5J0BHYam1-1iJ3EgU'
const discordErrorWebhookUrl = String(
  process.env.DISCORD_ERROR_WEBHOOK_URL || BUILTIN_DISCORD_ERROR_WEBHOOK_URL || '',
).trim()
const RUNTIME_AUTO_INSTALL_ENABLED = false
const APP_PROTOCOL = 'glitchmusic'
const CPU_CORE_COUNT = Number(process.env.NUMBER_OF_PROCESSORS || 0) || os.cpus().length || 4
const YOUTUBE_AUTH_FILE = 'youtube-google-auth.json'
const SPOTIFY_AUTH_FILE = 'spotify-auth.json'
const GOOGLE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly'
const GOOGLE_OAUTH_REDIRECT_PORT = 53682
const GOOGLE_OAUTH_REDIRECT_PATH = '/oauth2callback'
const SPOTIFY_OAUTH_SCOPE = 'playlist-read-private playlist-read-collaborative user-read-private'
const SPOTIFY_REQUIRED_SCOPES = ['playlist-read-private', 'playlist-read-collaborative']
const SPOTIFY_OAUTH_REDIRECT_PORT = 53683
const SPOTIFY_OAUTH_REDIRECT_PATH = '/spotify-callback'

const getLegacyUserDataCandidates = (appDataDir, currentUserData) => {
  const candidates = new Set()
  const pushCandidate = (value) => {
    const normalized = path.resolve(String(value || ''))
    if (!normalized) return
    if (normalized === path.resolve(currentUserData)) return
    candidates.add(normalized)
  }

  // Bilinen eski klasör adları
  ;[
    'Ghxsty Music',
    'ghxsty music',
    'GLITCH Music',
    'glitch music',
    'Electron',
    'electron',
    'music',
    'm-zik',
    'müzik',
  ].forEach((name) => pushCandidate(path.join(appDataDir, name)))

  // Roaming altında otomatik tarama:
  // music, m-zik, music-backup_*, music_backup_* gibi varyasyonları yakala
  try {
    const entries = fs.readdirSync(appDataDir, { withFileTypes: true })
    const dynamicPattern = /^(music([_-].+)?)$|^(m[-_]?zik([_-].+)?)$|^(ghxsty music([_-].+)?)$|^(glitch music([_-].+)?)$/i
    for (const entry of entries) {
      if (!entry?.isDirectory?.()) continue
      const entryName = String(entry.name || '').trim()
      if (!entryName) continue
      if (!dynamicPattern.test(entryName)) continue
      pushCandidate(path.join(appDataDir, entryName))
    }
  } catch {
    // tarama hataları geri yüklemeyi tamamen engellemesin
  }

  return Array.from(candidates)
}

const migrateLegacyUserDataIfNeeded = (options = {}) => {
  const force = Boolean(options?.force)
  try {
    const appDataDir = app.getPath('appData')
    const currentUserData = app.getPath('userData')
    const currentLibraryDir = path.join(currentUserData, 'library-audio')
    const currentTracksFile = path.join(currentUserData, 'tracks.json')

    const currentHasData =
      (fs.existsSync(currentLibraryDir) && (fs.readdirSync(currentLibraryDir).length > 0)) ||
      fs.existsSync(currentTracksFile)
    if (currentHasData && !force) {
      return { ok: true, migrated: false, reason: 'current-has-data' }
    }

    const legacyCandidates = getLegacyUserDataCandidates(appDataDir, currentUserData)

    const errors = []
    for (const legacyDir of legacyCandidates) {
      if (!fs.existsSync(legacyDir) || legacyDir === currentUserData) continue
      const legacyLibraryDir = path.join(legacyDir, 'library-audio')
      const legacyTracksFile = path.join(legacyDir, 'tracks.json')
      const legacyHasData =
        (fs.existsSync(legacyLibraryDir) && (fs.readdirSync(legacyLibraryDir).length > 0)) ||
        fs.existsSync(legacyTracksFile)
      if (!legacyHasData) continue

      try {
        fs.mkdirSync(currentUserData, { recursive: true })

        const importantEntries = [
          'library-audio',
          'tracks.json',
          'Local Storage',
          'IndexedDB',
          'Session Storage',
          'Partitions',
          'Preferences',
        ]

        for (const entry of importantEntries) {
          const fromPath = path.join(legacyDir, entry)
          if (!fs.existsSync(fromPath)) continue
          const toPath = path.join(currentUserData, entry)
          fs.cpSync(fromPath, toPath, {
            recursive: true,
            force: force,
            errorOnExist: false,
          })
        }
        return { ok: true, migrated: true, from: legacyDir, to: currentUserData }
      } catch (copyError) {
        errors.push({
          from: legacyDir,
          reason: String(copyError?.message || copyError || 'copy-failed'),
        })
      }
    }
    if (errors.length) {
      const first = errors[0]
      return {
        ok: false,
        migrated: false,
        reason: `migration-failed:${first.from}:${first.reason}`,
        errors,
      }
    }
    return { ok: true, migrated: false, reason: 'no-legacy-data' }
  } catch (error) {
    // migration hataları açılışı bloklamasın
    return { ok: false, migrated: false, reason: `migration-failed:${String(error?.message || error || 'unknown')}` }
  }
}

// Bazı sistemlerde (özellikle OneDrive/izin kısıtı olan profillerde) Chromium cache yazımı
// ERR_FAILED ile pencerenin siyah açılmasına neden olabiliyor. Cache'i güvenli local temp'e sabitle.
try {
  const safeSessionDir = path.join(os.tmpdir(), 'glitch-music-session')
  fs.mkdirSync(safeSessionDir, { recursive: true })
  app.setPath('sessionData', safeSessionDir)
  const safeCacheDir = path.join(os.tmpdir(), 'glitch-music-cache')
  fs.mkdirSync(safeCacheDir, { recursive: true })
  app.commandLine.appendSwitch('disk-cache-dir', safeCacheDir)
  app.commandLine.appendSwitch('media-cache-dir', safeCacheDir)
  app.commandLine.appendSwitch('disk-cache-size', String(128 * 1024 * 1024))
  app.commandLine.appendSwitch('disable-quic')
  // GPU'yu kapatmak yerine sadece disk tarafını güvenli tutuyoruz.
  // Böylece özellikle tam ekran/animasyon akışında performans korunur.
} catch {
  // ignore cache path setup failures
}

// Renderer bellek kullanımını kontrol altında tutmak için V8 heap üst sınırı.
// Hard cap değildir ancak ani şişmelerin büyük bölümünü engeller.
if (!process.env.GLITCH_DISABLE_MEMORY_GUARD) {
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512')
}

let rpcClient = null
let mainWindow = null
let tray = null
let isQuitting = false
let closeBehavior = 'tray'
const runtimePrefsFile = path.join(app.getPath('userData'), 'runtime-prefs.json')
let resetShortcutEnabled = true
let resetShortcut = 'Ctrl+Shift+R'
let mediaToggleShortcut = ''
let registeredCustomMediaShortcut = ''
let preventSleepWhilePlayingEnabled = true
let playbackActiveForPowerSave = false
let powerSaveBlockerId = null
const libraryDownloadControls = new Map()
const updaterState = {
  checking: false,
  updateAvailable: false,
  downloading: false,
  downloaded: false,
  progressPercent: 0,
  latestVersion: '',
  error: '',
}
let updateCheckTimer = null
let pendingDeepLinkPayload = null

const base64Url = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

const readYoutubeAuthState = () => {
  try {
    const filePath = path.join(app.getPath('userData'), YOUTUBE_AUTH_FILE)
    if (!fs.existsSync(filePath)) return null
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const writeYoutubeAuthState = (state) => {
  try {
    const filePath = path.join(app.getPath('userData'), YOUTUBE_AUTH_FILE)
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

const clearYoutubeAuthState = () => {
  try {
    const filePath = path.join(app.getPath('userData'), YOUTUBE_AUTH_FILE)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    // ignore cleanup errors
  }
}

const readSpotifyAuthState = () => {
  try {
    const filePath = path.join(app.getPath('userData'), SPOTIFY_AUTH_FILE)
    if (!fs.existsSync(filePath)) return null
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const writeSpotifyAuthState = (state) => {
  try {
    const filePath = path.join(app.getPath('userData'), SPOTIFY_AUTH_FILE)
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8')
    return true
  } catch {
    return false
  }
}

const clearSpotifyAuthState = () => {
  try {
    const filePath = path.join(app.getPath('userData'), SPOTIFY_AUTH_FILE)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore
  }
}

const getSpotifyClientConfig = (override = {}) => {
  const normalize = (value) =>
    String(value || '')
      .replace(/\r?\n/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const overrideClientId = normalize(override?.clientId)
  const overrideClientSecret = normalize(override?.clientSecret)
  const clientId = overrideClientId || normalize(process.env.SPOTIFY_CLIENT_ID || process.env.VITE_SPOTIFY_CLIENT_ID)
  const clientSecret =
    overrideClientSecret || normalize(process.env.SPOTIFY_CLIENT_SECRET || process.env.VITE_SPOTIFY_CLIENT_SECRET)
  if (!clientId || !clientSecret) {
    const missing = []
    if (!clientId) missing.push('clientId')
    if (!clientSecret) missing.push('clientSecret')
    return { ok: false, error: `spotify-client-missing:${missing.join(',')}` }
  }
  return { ok: true, clientId, clientSecret }
}

const getOAuthClientConfig = (override = null) => {
  const normalize = (value) =>
    String(value || '')
      .replace(/\r?\n/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const saved = readYoutubeAuthState() || {}
  const overrideClientId = normalize(override?.clientId)
  const overrideClientSecret = normalize(override?.clientSecret)
  const savedClientId = normalize(saved?.clientId)
  const savedClientSecret = normalize(saved?.clientSecret)
  const envClientId = normalize(process.env.GOOGLE_CLIENT_ID)
  const envClientSecret = normalize(process.env.GOOGLE_CLIENT_SECRET)
  const viteEnvClientId = normalize(process.env.VITE_GOOGLE_CLIENT_ID)
  const viteEnvClientSecret = normalize(process.env.VITE_GOOGLE_CLIENT_SECRET)

  const clientId = overrideClientId || savedClientId || envClientId || viteEnvClientId
  const clientSecret = overrideClientSecret || savedClientSecret || envClientSecret || viteEnvClientSecret

  if (!clientId || !clientSecret) {
    const missing = []
    if (!clientId) missing.push('clientId')
    if (!clientSecret) missing.push('clientSecret')
    return { ok: false, error: `google-client-missing:${missing.join(',')}` }
  }

  return { ok: true, clientId, clientSecret }
}

const postForm = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = String(data?.error_description || data?.error || response.statusText || 'oauth-error')
    throw new Error(details)
  }
  return data
}

const fetchYoutubeChannelProfile = async (accessToken) => {
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { ok: false, error: String(data?.error?.message || response.statusText || 'youtube-profile-failed') }
  }
  const first = Array.isArray(data?.items) ? data.items[0] : null
  return {
    ok: true,
    channelTitle: String(first?.snippet?.title || '').trim(),
    channelId: String(first?.id || '').trim(),
  }
}

const ensureYoutubeAccessToken = async () => {
  const saved = readYoutubeAuthState()
  if (!saved?.tokens?.access_token) {
    return { ok: false, error: 'not-connected' }
  }
  const configResult = getOAuthClientConfig()
  if (!configResult?.ok) {
    return { ok: false, error: configResult?.error || 'oauth-client-missing' }
  }
  const config = { clientId: configResult.clientId, clientSecret: configResult.clientSecret }

  const expiresAt = Number(saved?.tokens?.expiry_date || 0)
  const now = Date.now()
  const hasTime = Number.isFinite(expiresAt) && expiresAt > 0
  const isExpired = hasTime ? expiresAt - now < 60_000 : false

  if (!isExpired) {
    return { ok: true, accessToken: String(saved.tokens.access_token), state: saved }
  }

  const refreshToken = String(saved?.tokens?.refresh_token || '').trim()
  if (!refreshToken) {
    return { ok: false, error: 'refresh-token-missing' }
  }

  try {
    const refreshed = await postForm('https://oauth2.googleapis.com/token', {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    })
    const nextState = {
      ...saved,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tokens: {
        ...saved.tokens,
        access_token: String(refreshed.access_token || ''),
        expiry_date: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
      },
    }
    writeYoutubeAuthState(nextState)
    return { ok: true, accessToken: String(nextState.tokens.access_token), state: nextState }
  } catch (error) {
    return { ok: false, error: String(error?.message || error || 'refresh-failed') }
  }
}

const getYoutubeAuthStatus = async () => {
  const saved = readYoutubeAuthState()
  if (!saved?.tokens?.access_token) {
    return { ok: true, connected: false }
  }
  const tokenResult = await ensureYoutubeAccessToken()
  if (!tokenResult?.ok) {
    return { ok: true, connected: false, error: tokenResult?.error || 'token-invalid' }
  }
  const profile = await fetchYoutubeChannelProfile(tokenResult.accessToken)
  return {
    ok: true,
    connected: true,
    channelTitle: String(profile?.channelTitle || '').trim(),
    channelId: String(profile?.channelId || '').trim(),
  }
}

const connectYoutubeAccount = async ({ clientId = '', clientSecret = '' } = {}) => {
  const configResult = getOAuthClientConfig({ clientId, clientSecret })
  if (!configResult?.ok) {
    return { ok: false, error: configResult?.error || 'google-client-missing' }
  }
  const config = { clientId: configResult.clientId, clientSecret: configResult.clientSecret }
  console.log('[YouTube OAuth] connect requested')

  const codeVerifier = base64Url(randomBytes(48))
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest())

  const server = createServer()
  const authCodePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('oauth-timeout'))
    }, 120000)

    server.on('request', (req, res) => {
      try {
        const target = new URL(req.url || '/', 'http://127.0.0.1')
        if (target.pathname !== GOOGLE_OAUTH_REDIRECT_PATH) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>You can close this tab.</h3>')
          return
        }
        const code = String(target.searchParams.get('code') || '').trim()
        const error = String(target.searchParams.get('error') || '').trim()
        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>Sign-in was cancelled. You can close this tab.</h3>')
          clearTimeout(timeout)
          resolve({ ok: false, error })
          return
        }
        if (!code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>Code was not received. You can try again.</h3>')
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<h3>Sign-in successful. You can return to the app.</h3>')
        clearTimeout(timeout)
        resolve({ ok: true, code })
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Auth callback error')
      }
    })
  })

  await new Promise((resolve, reject) => {
    server.listen(GOOGLE_OAUTH_REDIRECT_PORT, '127.0.0.1', (error) => {
      if (error) reject(error)
      else resolve()
    })
  })

  const redirectUri = `http://127.0.0.1:${GOOGLE_OAUTH_REDIRECT_PORT}${GOOGLE_OAUTH_REDIRECT_PATH}`
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', GOOGLE_OAUTH_SCOPE)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('code_challenge', codeChallenge)
  authUrl.searchParams.set('code_challenge_method', 'S256')

  try {
    await shell.openExternal(authUrl.toString())
    console.log('[YouTube OAuth] browser opened')
  } catch (error) {
    return { ok: false, error: `open-external-failed: ${String(error?.message || error || 'unknown')}` }
  }

  try {
    const codeResult = await authCodePromise
    server.close()
    if (!codeResult?.ok) {
      return { ok: false, error: codeResult?.error || 'oauth-cancelled' }
    }

    const token = await postForm('https://oauth2.googleapis.com/token', {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: codeResult.code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    })

    const state = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      tokens: {
        access_token: String(token.access_token || ''),
        refresh_token: String(token.refresh_token || ''),
        expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000,
      },
    }
    writeYoutubeAuthState(state)
    console.log('[YouTube OAuth] token stored')
    return getYoutubeAuthStatus()
  } catch (error) {
    try {
      server.close()
    } catch {
      // ignore
    }
    const raw = String(error?.message || error || 'oauth-failed')
    console.error('[YouTube OAuth] failed:', raw)
    const normalized = raw.toLowerCase()
    if (normalized.includes('redirect_uri_mismatch')) {
      return {
        ok: false,
        error:
          'redirect-uri-mismatch: This URI must be allowed in your Google Cloud OAuth client: http://127.0.0.1:53682/oauth2callback',
      }
    }
    if (normalized.includes('invalid_client')) {
      return { ok: false, error: 'invalid-client: Client ID / Secret is wrong or the OAuth client type is invalid.' }
    }
    if (normalized.includes('oauth-timeout')) {
      return { ok: false, error: 'oauth-timeout: Google sign-in was not completed in the browser, or the callback could not return to the app.' }
    }
    return { ok: false, error: raw }
  }
}

const listYoutubePlaylists = async () => {
  const tokenResult = await ensureYoutubeAccessToken()
  if (!tokenResult?.ok) {
    return { ok: false, error: tokenResult?.error || 'not-connected' }
  }

  const playlists = []
  let pageToken = ''
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlists')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('mine', 'true')
    url.searchParams.set('maxResults', '50')
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: String(data?.error?.message || response.statusText || 'youtube-playlists-failed') }
    }
    for (const row of Array.isArray(data?.items) ? data.items : []) {
      const thumbs = row?.snippet?.thumbnails || {}
      const coverUrl =
        String(thumbs?.medium?.url || thumbs?.high?.url || thumbs?.default?.url || '').trim()
      playlists.push({
        playlistId: String(row?.id || '').trim(),
        title: String(row?.snippet?.title || '').trim(),
        description: String(row?.snippet?.description || '').trim(),
        trackCount: Number(row?.contentDetails?.itemCount || 0),
        coverUrl,
      })
    }
    pageToken = String(data?.nextPageToken || '').trim()
  } while (pageToken)

  return { ok: true, playlists }
}

const listYoutubePlaylistTracks = async (playlistId) => {
  const pid = String(playlistId || '').trim()
  if (!pid) return { ok: false, error: 'playlist-id-missing' }

  const tokenResult = await ensureYoutubeAccessToken()
  if (!tokenResult?.ok) {
    return { ok: false, error: tokenResult?.error || 'not-connected' }
  }

  const tracks = []
  let pageToken = ''
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('maxResults', '50')
    url.searchParams.set('playlistId', pid)
    if (pageToken) {
      url.searchParams.set('pageToken', pageToken)
    }
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: String(data?.error?.message || response.statusText || 'youtube-playlist-items-failed') }
    }
    for (const row of Array.isArray(data?.items) ? data.items : []) {
      const snippet = row?.snippet || {}
      const videoId = String(row?.contentDetails?.videoId || '').trim()
      const thumbs = snippet?.thumbnails || {}
      tracks.push({
        id: String(row?.id || videoId || '').trim(),
        title: String(snippet?.title || '').trim(),
        artist: String(snippet?.videoOwnerChannelTitle || snippet?.channelTitle || '').trim(),
        videoId,
        url: videoId ? `https://music.youtube.com/watch?v=${videoId}` : '',
        coverUrl: String(thumbs?.medium?.url || thumbs?.high?.url || thumbs?.default?.url || '').trim(),
      })
    }
    pageToken = String(data?.nextPageToken || '').trim()
  } while (pageToken)

  return { ok: true, tracks }
}

const spotifyApiFetch = async (accessToken, endpoint) => {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      ok: false,
      status: Number(response.status || 0) || 0,
      error: String(data?.error?.message || response.statusText || 'spotify-api-failed'),
    }
  }
  return { ok: true, data }
}

const hasSpotifyRequiredScopes = (scopeValue = '') => {
  const granted = new Set(
    String(scopeValue || '')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean),
  )
  return SPOTIFY_REQUIRED_SCOPES.every((scope) => granted.has(scope))
}

const ensureSpotifyAccessToken = async () => {
  const saved = readSpotifyAuthState()
  if (!saved?.tokens?.access_token) return { ok: false, error: 'not-connected' }
  if (!hasSpotifyRequiredScopes(saved?.scope)) {
    return { ok: false, error: 'spotify-scope-missing:reconnect-required' }
  }
  const configResult = getSpotifyClientConfig()
  if (!configResult?.ok) return { ok: false, error: configResult?.error || 'spotify-client-missing' }
  const config = { clientId: configResult.clientId, clientSecret: configResult.clientSecret }

  const expiresAt = Number(saved?.tokens?.expiry_date || 0)
  const now = Date.now()
  const hasTime = Number.isFinite(expiresAt) && expiresAt > 0
  const isExpired = hasTime ? expiresAt - now < 60_000 : false
  if (!isExpired) return { ok: true, accessToken: String(saved.tokens.access_token || ''), state: saved }

  const refreshToken = String(saved?.tokens?.refresh_token || '').trim()
  if (!refreshToken) return { ok: false, error: 'refresh-token-missing' }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: String(data?.error_description || data?.error || response.statusText || 'spotify-refresh-failed') }
    }
    const nextState = {
      ...saved,
      scope: String(saved?.scope || SPOTIFY_OAUTH_SCOPE),
      tokens: {
        ...saved.tokens,
        access_token: String(data?.access_token || ''),
        expiry_date: Date.now() + Number(data?.expires_in || 3600) * 1000,
      },
    }
    writeSpotifyAuthState(nextState)
    return { ok: true, accessToken: String(nextState.tokens.access_token || ''), state: nextState }
  } catch (error) {
    return { ok: false, error: String(error?.message || error || 'spotify-refresh-failed') }
  }
}

const getSpotifyAuthStatus = async () => {
  const saved = readSpotifyAuthState()
  if (!saved?.tokens?.access_token) return { ok: true, connected: false }
  if (!hasSpotifyRequiredScopes(saved?.scope)) {
    return { ok: true, connected: false, error: 'spotify-scope-missing:reconnect-required' }
  }
  const tokenResult = await ensureSpotifyAccessToken()
  if (!tokenResult?.ok) return { ok: true, connected: false, error: tokenResult?.error || 'token-invalid' }
  const me = await spotifyApiFetch(tokenResult.accessToken, '/me')
  const accountLabel = String(me?.data?.display_name || me?.data?.id || '').trim()
  return { ok: true, connected: true, accountLabel }
}

const connectSpotifyAccount = async (override = {}) => {
  const configResult = getSpotifyClientConfig(override)
  if (!configResult?.ok) return { ok: false, error: configResult?.error || 'spotify-client-missing' }
  const config = { clientId: configResult.clientId, clientSecret: configResult.clientSecret }
  const redirectUri = `http://127.0.0.1:${SPOTIFY_OAUTH_REDIRECT_PORT}${SPOTIFY_OAUTH_REDIRECT_PATH}`
  const state = base64Url(randomBytes(24))

  const server = createServer()
  const authCodePromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('oauth-timeout')), 120000)
    server.on('request', (req, res) => {
      try {
        const target = new URL(req.url || '/', 'http://127.0.0.1')
        if (target.pathname !== SPOTIFY_OAUTH_REDIRECT_PATH) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>You can close this tab.</h3>')
          return
        }
        const returnedState = String(target.searchParams.get('state') || '').trim()
        const code = String(target.searchParams.get('code') || '').trim()
        const error = String(target.searchParams.get('error') || '').trim()
        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>Spotify sign-in was cancelled. You can close this tab.</h3>')
          clearTimeout(timeout)
          resolve({ ok: false, error })
          return
        }
        if (!code || returnedState !== state) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<h3>Authorization could not be verified. You can try again.</h3>')
          clearTimeout(timeout)
          resolve({ ok: false, error: 'state-mismatch-or-code-missing' })
          return
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end('<h3>Spotify connected successfully. You can return to the app.</h3>')
        clearTimeout(timeout)
        resolve({ ok: true, code })
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('Auth callback error')
      }
    })
  })

  await new Promise((resolve, reject) => {
    server.listen(SPOTIFY_OAUTH_REDIRECT_PORT, '127.0.0.1', (error) => (error ? reject(error) : resolve()))
  })

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.set('client_id', config.clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('scope', SPOTIFY_OAUTH_SCOPE)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('show_dialog', 'true')

  try {
    await shell.openExternal(authUrl.toString())
  } catch (error) {
    return { ok: false, error: `open-external-failed:${String(error?.message || error || 'unknown')}` }
  }

  try {
    const codeResult = await authCodePromise
    server.close()
    if (!codeResult?.ok) return { ok: false, error: codeResult?.error || 'oauth-cancelled' }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: codeResult.code,
        redirect_uri: redirectUri,
      }).toString(),
    })
    const token = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: String(token?.error_description || token?.error || response.statusText || 'spotify-token-failed') }
    }

    const nextState = {
      scope: String(token?.scope || SPOTIFY_OAUTH_SCOPE),
      tokens: {
        access_token: String(token?.access_token || ''),
        refresh_token: String(token?.refresh_token || ''),
        expiry_date: Date.now() + Number(token?.expires_in || 3600) * 1000,
      },
    }
    writeSpotifyAuthState(nextState)
    return getSpotifyAuthStatus()
  } catch (error) {
    try { server.close() } catch {}
    return { ok: false, error: String(error?.message || error || 'spotify-oauth-failed') }
  }
}

const listSpotifyPlaylists = async () => {
  const tokenResult = await ensureSpotifyAccessToken()
  if (!tokenResult?.ok) return { ok: false, error: tokenResult?.error || 'not-connected' }
  const playlists = []
  let nextUrl = '/me/playlists?limit=50'

  const resolveSpotifyPlaylistTrackCount = async (playlistId, initialCount) => {
    const parsedInitial = Number(initialCount)
    if (Number.isFinite(parsedInitial) && parsedInitial > 0) return parsedInitial
    const pid = String(playlistId || '').trim()
    if (!pid) return 0
    try {
      const detail = await spotifyApiFetch(
        tokenResult.accessToken,
        `/playlists/${encodeURIComponent(pid)}?fields=tracks(total)`,
      )
      if (!detail?.ok) {
        // Bazı playlistlerde Spotify detay endpoint'i 403 döndürebiliyor.
        // Bu durumda tüm akışı kırmak yerine mevcut sayıyla devam et.
        return Number.isFinite(parsedInitial) ? Math.max(0, parsedInitial) : 0
      }
      const total = Number(detail?.data?.tracks?.total)
      return Number.isFinite(total) ? Math.max(0, total) : (Number.isFinite(parsedInitial) ? Math.max(0, parsedInitial) : 0)
    } catch (error) {
      return Number.isFinite(parsedInitial) ? Math.max(0, parsedInitial) : 0
    }
  }

  while (nextUrl) {
    const endpoint = nextUrl.startsWith('http')
      ? nextUrl.replace('https://api.spotify.com/v1', '')
      : nextUrl
    const result = await spotifyApiFetch(tokenResult.accessToken, endpoint)
    if (!result?.ok) {
      if (Number(result?.status || 0) === 403) {
        return { ok: false, error: 'spotify-scope-missing:reconnect-required' }
      }
      return { ok: false, error: result?.error || 'spotify-playlists-failed' }
    }
    const data = result.data || {}
    for (const row of Array.isArray(data?.items) ? data.items : []) {
      const image = Array.isArray(row?.images) ? row.images[0] : null
      const rawTrackTotal =
        row?.tracks?.total ??
        row?.trackCount ??
        row?.totalTracks ??
        row?.itemsCount
      const playlistId = String(row?.id || '').trim()
      let trackCount = Number.isFinite(Number(rawTrackTotal)) ? Math.max(0, Number(rawTrackTotal)) : 0
      try {
        trackCount = await resolveSpotifyPlaylistTrackCount(playlistId, rawTrackTotal)
      } catch {}
      playlists.push({
        playlistId,
        title: String(row?.name || '').trim(),
        description: String(row?.description || '').trim(),
        trackCount,
        coverUrl: String(image?.url || '').trim(),
      })
    }
    nextUrl = String(data?.next || '').trim()
  }
  return { ok: true, playlists }
}

const listSpotifyPlaylistTracks = async (playlistId) => {
  const pid = String(playlistId || '').trim()
  if (!pid) return { ok: false, error: 'playlist-id-missing' }
  const tokenResult = await ensureSpotifyAccessToken()
  if (!tokenResult?.ok) return { ok: false, error: tokenResult?.error || 'not-connected' }
  const collectFromEndpoint = async (initialUrl) => {
    const collected = []
    let nextUrl = initialUrl
    while (nextUrl) {
      const endpoint = nextUrl.startsWith('http')
        ? nextUrl.replace('https://api.spotify.com/v1', '')
        : nextUrl
      const result = await spotifyApiFetch(tokenResult.accessToken, endpoint)
      if (!result?.ok) {
        return { ok: false, status: Number(result?.status || 0) || 0, error: result?.error || 'spotify-playlist-tracks-failed' }
      }
      const data = result.data || {}
      for (const row of Array.isArray(data?.items) ? data.items : []) {
        const entry = row?.track || row?.item || row || {}
        if (!entry || typeof entry !== 'object') continue
        const entryType = String(entry?.type || '').toLowerCase()
        if (entryType && entryType !== 'track') continue
        const title = String(entry?.name || '').trim()
        if (!title) continue
        const artists = Array.isArray(entry?.artists) ? entry.artists.map((a) => String(a?.name || '').trim()).filter(Boolean) : []
        const image = Array.isArray(entry?.album?.images) ? entry.album.images[0] : null
        collected.push({
          id: String(entry?.id || row?.added_at || `${title}-${artists.join(',')}`).trim(),
          title,
          artist: artists.join(', '),
          album: String(entry?.album?.name || '').trim(),
          url: String(entry?.external_urls?.spotify || '').trim(),
          coverUrl: String(image?.url || '').trim(),
        })
      }
      nextUrl = String(data?.next || '').trim()
    }
    return { ok: true, tracks: collected }
  }

  // Spotify tarafında bazı hesaplarda /tracks yerine /items daha stabil.
  const primary = await collectFromEndpoint(
    `/playlists/${encodeURIComponent(pid)}/items?limit=100&market=from_token&additional_types=track`,
  )
  if (primary?.ok) {
    return { ok: true, tracks: primary.tracks }
  }
  if (Number(primary?.status || 0) === 403) {
    return { ok: false, error: 'spotify-scope-missing:reconnect-required' }
  }

  // Geriye dönük uyumluluk fallback'i
  const fallback = await collectFromEndpoint(
    `/playlists/${encodeURIComponent(pid)}/tracks?limit=100&market=from_token`,
  )
  if (fallback?.ok) {
    return { ok: true, tracks: fallback.tracks }
  }
  if (Number(fallback?.status || 0) === 403) {
    return { ok: false, error: 'spotify-scope-missing:reconnect-required' }
  }

  return { ok: false, error: fallback?.error || primary?.error || 'spotify-playlist-tracks-failed' }
}

let rendererServer = null
let rendererServerPort = 0
const RENDERER_HOST = '127.0.0.1'
const RENDERER_FIXED_PORT = 31733

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const isLikelyImageContentTypeHeader = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) return false
  return (
    normalized.includes('image/') ||
    normalized.includes('jpeg') ||
    normalized.includes('jpg') ||
    normalized.includes('png') ||
    normalized.includes('webp') ||
    normalized.includes('gif') ||
    normalized.includes('bmp') ||
    normalized.includes('avif')
  )
}

const ensureRendererServer = async () => {
  if (rendererServer && rendererServerPort) {
    return rendererServerPort
  }
  const buildDir = path.join(__dirname, '..', 'build')
  rendererServer = createServer((req, res) => {
    try {
      const rawUrl = String(req.url || '/')
      const parsedUrl = new URL(rawUrl, 'http://127.0.0.1')
      const requestedPath = decodeURIComponent(parsedUrl.pathname || '/')
      if (requestedPath.startsWith('/local-media/')) {
        const token = requestedPath.slice('/local-media/'.length)
        const absolutePath = Buffer.from(token, 'base64url').toString('utf8')
        if (!absolutePath || !fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('Not found')
          return
        }
        const ext = path.extname(absolutePath).toLowerCase()
        const contentType = MIME_TYPES[ext] || 'application/octet-stream'
        const stat = fs.statSync(absolutePath)
        const totalSize = Number(stat.size || 0)
        const rangeHeader = String(req.headers.range || '').trim()
        res.setHeader('Accept-Ranges', 'bytes')

        if (rangeHeader && /^bytes=/.test(rangeHeader) && totalSize > 0) {
          const match = rangeHeader.match(/bytes=(\d*)-(\d*)/i)
          let start = match?.[1] ? Number(match[1]) : 0
          let end = match?.[2] ? Number(match[2]) : totalSize - 1

          if (!Number.isFinite(start) || start < 0) start = 0
          if (!Number.isFinite(end) || end < 0) end = totalSize - 1
          if (start > end || start >= totalSize) {
            res.writeHead(416, {
              'Content-Range': `bytes */${totalSize}`,
              'Content-Type': 'text/plain; charset=utf-8',
            })
            res.end('Requested Range Not Satisfiable')
            return
          }
          end = Math.min(end, totalSize - 1)
          const chunkSize = end - start + 1
          res.writeHead(206, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': chunkSize,
          })
          fs.createReadStream(absolutePath, { start, end }).pipe(res)
          return
        }

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': totalSize,
        })
        fs.createReadStream(absolutePath).pipe(res)
        return
      }
      if (requestedPath.startsWith('/remote-media/')) {
        const token = requestedPath.slice('/remote-media/'.length)
        let remoteUrl = ''
        try {
          remoteUrl = Buffer.from(token, 'base64url').toString('utf8')
        } catch {
          remoteUrl = ''
        }
        if (!remoteUrl || !/^https?:\/\//i.test(remoteUrl)) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end('Bad remote url')
          return
        }

        void (async () => {
          const buildCoverCandidates = (inputUrl) => {
            const candidates = [inputUrl]
            const value = String(inputUrl || '')
            if (/ytimg\.com/i.test(value)) {
              candidates.push(
                value.replace('/mqdefault.jpg', '/hqdefault.jpg').replace('/default.jpg', '/hqdefault.jpg'),
              )
              candidates.push(
                value.replace('/mqdefault.jpg', '/maxresdefault.jpg').replace('/default.jpg', '/maxresdefault.jpg'),
              )
            }
            if (/googleusercontent\.com|ggpht\.com/i.test(value)) {
              candidates.push(value.replace(/=w\d+-h\d+[^&]*/i, '=w1200-h1200'))
              candidates.push(value.replace(/=s\d+[^&]*/i, '=s1200'))
              candidates.push(value.replace(/=w\d+-h\d+[^&]*/i, '=w600-h600'))
            }
            return [...new Set(candidates.filter(Boolean))]
          }

          let lastError = null
          const urlCandidates = buildCoverCandidates(remoteUrl)
          for (const candidateUrl of urlCandidates) {
            for (let attempt = 0; attempt < 3; attempt += 1) {
              try {
                const upstream = await fetch(candidateUrl, {
                  cache: 'no-store',
                  headers: {
                    'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
                  accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                  referer: 'https://music.youtube.com/',
                },
              })
                if (!upstream.ok) {
                  lastError = new Error(`upstream-${upstream.status}`)
                  continue
                }
                const contentType = String(upstream.headers.get('content-type') || '').trim()
                if (!isLikelyImageContentTypeHeader(contentType)) {
                  lastError = new Error('invalid-content-type')
                  continue
                }
                const body = Buffer.from(await upstream.arrayBuffer())
                res.writeHead(200, {
                  'Content-Type': contentType || 'image/jpeg',
                  'Cache-Control': 'public, max-age=86400',
                  'Content-Length': body.length,
                })
                res.end(body)
                return
              } catch (error) {
                lastError = error
              }
            }
          }
          res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' })
          res.end(`Remote fetch failed: ${String(lastError?.message || 'unknown')}`)
        })()
        return
      }
      const safePath = requestedPath === '/' ? '/index.html' : requestedPath
      const normalized = path.normalize(safePath).replace(/^(\.\.[/\\])+/, '')
      let filePath = path.join(buildDir, normalized)
      if (!filePath.startsWith(buildDir)) {
        res.writeHead(403)
        res.end('Forbidden')
        return
      }
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(buildDir, 'index.html')
      }
      const ext = path.extname(filePath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'
      const content = fs.readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' })
      res.end(content)
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Internal server error')
    }
  })
  await new Promise((resolve, reject) => {
    rendererServer.listen(RENDERER_FIXED_PORT, RENDERER_HOST, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
  const address = rendererServer.address()
  rendererServerPort = typeof address === 'object' && address ? Number(address.port || 0) : 0
  return rendererServerPort
}

const toLocalMediaUrl = async (absolutePath) => {
  const safePath = String(absolutePath || '').trim()
  if (!safePath || !fs.existsSync(safePath)) {
    return ''
  }
  const port = await ensureRendererServer()
  const token = Buffer.from(safePath, 'utf8').toString('base64url')
  return `http://${RENDERER_HOST}:${port}/local-media/${token}`
}

const loadRendererFromBuild = async (win, htmlName = 'index.html') => {
  const port = await ensureRendererServer()
  const sourceUrl = `http://${RENDERER_HOST}:${port}/`
  try {
    await win.loadURL(sourceUrl)
    return { ok: true, from: 'http-server' }
  } catch (firstError) {
    const mirrorRoot = path.join(app.getPath('temp'), 'glitch-music-build-mirror')
    const mirrorDir = path.join(mirrorRoot, 'build')
    const mirrorHtml = path.join(mirrorDir, htmlName)
    try {
      fs.mkdirSync(mirrorRoot, { recursive: true })
      fs.cpSync(path.join(__dirname, '..', 'build'), mirrorDir, { recursive: true, force: true })
      await win.loadURL(pathToFileURL(mirrorHtml).href)
      return { ok: true, from: 'mirror-file' }
    } catch (mirrorError) {
      throw new Error(
        `build-load-failed | first=${String(firstError?.message || firstError)} | mirror=${String(
          mirrorError?.message || mirrorError,
        )}`,
      )
    }
  }
}

const extractDeepLinkFromArgv = (argv = []) => {
  const items = Array.isArray(argv) ? argv : []
  for (const value of items) {
    const text = String(value || '').trim()
    if (!text) continue
    if (text.toLowerCase().startsWith(`${APP_PROTOCOL}://`)) {
      return text
    }
  }
  return ''
}

const parseDeepLinkPayload = (link) => {
  try {
    const raw = String(link || '').trim()
    if (!raw.toLowerCase().startsWith(`${APP_PROTOCOL}://`)) {
      return null
    }
    const parsed = new URL(raw)
    const action = String(parsed.hostname || '').toLowerCase()
    if (action !== 'play') {
      return null
    }
    const id = String(parsed.searchParams.get('id') || '').trim()
    const title = String(parsed.searchParams.get('title') || '').trim()
    const artist = String(parsed.searchParams.get('artist') || '').trim()
    const audioUrl = String(parsed.searchParams.get('url') || '').trim()
    if (!id && !audioUrl && !title) {
      return null
    }
    return {
      action: 'play',
      id,
      title,
      artist,
      audioUrl,
      raw,
    }
  } catch {
    return null
  }
}

const dispatchDeepLinkPayload = (payload) => {
  if (!payload) return
  pendingDeepLinkPayload = payload
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('app:deep-link', payload)
}

const formatUpdaterError = (error) => {
  const raw = String(error?.message || error || 'updater-error')
    .replace(/\s+/g, ' ')
    .trim()

  const normalized = raw.toLowerCase()
  if (normalized.includes('releases.atom') && normalized.includes('502')) {
    return 'GitHub gÃ¼ncelleme sunucusu geÃ§ici olarak yanÄ±t vermedi (502). LÃ¼tfen birkaÃ§ dakika sonra tekrar dene.'
  }
  if (normalized.includes('releases.atom') && normalized.includes('404')) {
    return 'GÃ¼ncelleme kaynaÄŸÄ± bulunamadÄ± (404). Repo, release veya update ayarlarÄ±nÄ± kontrol et.'
  }
  if (normalized.includes('rate limit') || normalized.includes('api rate limit')) {
    return 'GitHub rate limit sÄ±nÄ±rÄ±na ulaÅŸÄ±ldÄ±. Bir sÃ¼re sonra tekrar dene.'
  }
  if (normalized.includes('enetunreach') || normalized.includes('econnreset') || normalized.includes('etimedout')) {
    return 'AÄŸ baÄŸlantÄ±sÄ± hatasÄ± nedeniyle gÃ¼ncelleme kontrolÃ¼ yapÄ±lamadÄ±.'
  }

  // Ham HTML / header dÃ¶kÃ¼mÃ¼nÃ¼ kullanÄ±cÄ±ya gÃ¶stermeyelim.
  const compact = raw
    .replace(/data:\s*<!doctype html>.*$/i, '')
    .replace(/headers:\s*\{.*$/i, '')
    .trim()

  if (!compact) {
    return 'GÃ¼ncelleme kontrolÃ¼nde beklenmeyen bir hata oluÅŸtu.'
  }

  return compact.slice(0, 220)
}

const emitMediaControlCommand = (command) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('media-control', command)
}

const syncPlaybackPowerSaveBlocker = () => {
  const shouldBlock = Boolean(preventSleepWhilePlayingEnabled && playbackActiveForPowerSave)

  if (shouldBlock) {
    if (powerSaveBlockerId === null || !powerSaveBlocker.isStarted(powerSaveBlockerId)) {
      powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')
    }
    return
  }

  if (powerSaveBlockerId !== null && powerSaveBlocker.isStarted(powerSaveBlockerId)) {
    powerSaveBlocker.stop(powerSaveBlockerId)
  }
  powerSaveBlockerId = null
}

const emitLibraryDownloadProgress = (payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('library:download-progress', payload)
}

const emitUpdaterState = (event = 'state') => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('updater:event', {
    event,
    ...updaterState,
  })
}

const syncUpdaterState = (patch = {}, event = 'state') => {
  Object.assign(updaterState, patch)
  emitUpdaterState(event)
}

const resetUpdaterState = () => {
  syncUpdaterState({
    checking: false,
    updateAvailable: false,
    downloading: false,
    downloaded: false,
    progressPercent: 0,
    latestVersion: '',
    error: '',
  }, 'reset')
}

const isUpdaterSupported = () => app.isPackaged
const isLatestYmlMissingError = (errorLike) => {
  const message = String(errorLike?.message || errorLike || '').toLowerCase()
  return message.includes('latest.yml') && message.includes('404')
}

const setupAutoUpdater = () => {
  if (!isUpdaterSupported()) {
    return
  }

  try {
    const genericFeedUrl = String(process.env.UPDATER_FEED_URL || '').trim()
    if (genericFeedUrl) {
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: genericFeedUrl.endsWith('/') ? genericFeedUrl : `${genericFeedUrl}/`,
      })
    }
  } catch (error) {
    console.warn('Updater feed setup failed:', error?.message || error)
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false

  autoUpdater.on('checking-for-update', () => {
    syncUpdaterState({
      checking: true,
      error: '',
    }, 'checking')
  })

  autoUpdater.on('update-available', async (info) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: false,
      downloaded: false,
      progressPercent: 0,
      latestVersion: String(info?.version || ''),
      error: '',
    }, 'available')
  })

  autoUpdater.on('update-not-available', () => {
    syncUpdaterState({
      checking: false,
      updateAvailable: false,
      downloading: false,
      downloaded: false,
      progressPercent: 0,
      error: '',
    }, 'not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: true,
      downloaded: false,
      progressPercent: Number(progress?.percent || 0),
      error: '',
    }, 'progress')
  })

  autoUpdater.on('update-downloaded', (info) => {
    syncUpdaterState({
      checking: false,
      updateAvailable: true,
      downloading: false,
      downloaded: true,
      progressPercent: 100,
      latestVersion: String(info?.version || updaterState.latestVersion || ''),
      error: '',
    }, 'downloaded')

    // Popup aÃ§ma: bilgiyi uygulama iÃ§indeki bildirim menÃ¼sÃ¼nden gÃ¶steriyoruz.
  })

  autoUpdater.on('error', (error) => {
    if (isLatestYmlMissingError(error)) {
      // latest.yml eksikse updater'ı hata moduna sokma; sessizce "güncelleme yok" durumuna dön.
      syncUpdaterState({
        checking: false,
        updateAvailable: false,
        downloading: false,
        downloaded: false,
        progressPercent: 0,
        error: '',
      }, 'not-available')
      return
    }
    syncUpdaterState({
      checking: false,
      downloading: false,
      error: formatUpdaterError(error),
    }, 'error')
  })
}

const triggerUpdateCheck = async () => {
  if (!isUpdaterSupported()) {
    return { ok: false, reason: 'unsupported' }
  }
  try {
    syncUpdaterState({ checking: true, error: '' }, 'manual-check')
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch (error) {
    if (isLatestYmlMissingError(error)) {
      syncUpdaterState({
        checking: false,
        updateAvailable: false,
        downloading: false,
        downloaded: false,
        progressPercent: 0,
        error: '',
      }, 'not-available')
      return { ok: false, reason: 'latest-yml-missing' }
    }
    const message = formatUpdaterError(error)
    syncUpdaterState({ checking: false, error: message }, 'error')
    return { ok: false, reason: message }
  }
}

const scheduleUpdateChecks = () => {
  if (!isUpdaterSupported()) {
    return
  }
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
  }
  // Açılışta anında kontrol et.
  triggerUpdateCheck().catch(() => {})
  updateCheckTimer = setInterval(() => {
    triggerUpdateCheck().catch(() => {})
  }, 1000 * 60 * 60 * 6)
}

const sendDiscordErrorReport = async ({
  title = '',
  subject = '',
  description = '',
  message = '',
  context = {},
} = {}) => {
  if (!discordErrorWebhookUrl) {
    return { ok: false, reason: 'webhook-missing' }
  }

  const normalizedTitle = String(title || '').trim().slice(0, 220)
  const normalizedSubject = String(subject || '').trim().slice(0, 420)
  const normalizedDescription = String(description || message || '').trim().slice(0, 1600)
  if (!normalizedDescription) {
    return { ok: false, reason: 'empty-message' }
  }

  const safeContext = context && typeof context === 'object' ? context : {}
  const contextJson = JSON.stringify(safeContext, null, 2)
  const contextPreview = contextJson.length > 1700
    ? `${contextJson.slice(0, 1700)}…`
    : contextJson

  const payload = {
    username: 'GLITCH Music Hata Botu',
    embeds: [
      {
        title: normalizedTitle || 'Yeni Hata Bildirimi',
        color: 0xef4444,
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: 'Konu',
            value: normalizedSubject || 'Belirtilmedi',
          },
          {
            name: 'Açıklama',
            value: normalizedDescription,
          },
          {
            name: 'Uygulama',
            value: `GLITCH Music v${app.getVersion()} (${process.platform})`,
            inline: true,
          },
          {
            name: 'Kaynak',
            value: 'main',
            inline: true,
          },
          {
            name: 'Bağlam',
            value: `\`\`\`json\n${contextPreview || '{}'}\n\`\`\``,
          },
        ],
      },
    ],
  }

  try {
    const response = await fetch(discordErrorWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return { ok: false, reason: `webhook-http-${response.status}` }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, reason: `webhook-network-${String(error?.message || 'failed')}` }
  }
}

const registerMediaShortcuts = () => {
  const shortcutMap = new Map([
    ['MediaPlayPause', 'play-pause'],
    ['MediaNextTrack', 'next-track'],
    ['MediaPreviousTrack', 'previous-track'],
    ['MediaStop', 'stop'],
  ])

  for (const [accelerator, command] of shortcutMap.entries()) {
    try {
      globalShortcut.register(accelerator, () => {
        emitMediaControlCommand(command)
      })
    } catch (error) {
      console.warn(`Global shortcut register failed (${accelerator}):`, error?.message || error)
    }
  }
  syncCustomMediaShortcut()
}

const syncCustomMediaShortcut = () => {
  const accelerator = String(mediaToggleShortcut || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/control/gi, 'Ctrl')
    .replace(/commandorcontrol/gi, 'CommandOrControl')
    .replace(/command/gi, 'Command')
    .replace(/option/gi, 'Alt')

  if (accelerator && registeredCustomMediaShortcut === accelerator) {
    return
  }

  if (!accelerator) {
    if (registeredCustomMediaShortcut) {
      try {
        globalShortcut.unregister(registeredCustomMediaShortcut)
      } catch {
        // ignore unregister failures
      }
      registeredCustomMediaShortcut = ''
    }
    return
  }

  try {
    const ok = globalShortcut.register(accelerator, () => {
      emitMediaControlCommand('play-pause')
    })
    if (ok) {
      if (registeredCustomMediaShortcut && registeredCustomMediaShortcut !== accelerator) {
        try {
          globalShortcut.unregister(registeredCustomMediaShortcut)
        } catch {
          // ignore unregister failures
        }
      }
      registeredCustomMediaShortcut = accelerator
    } else {
      console.warn(`Global shortcut register rejected (${accelerator})`)
    }
  } catch (error) {
    console.warn(`Custom media shortcut register failed (${accelerator}):`, error?.message || error)
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
  app.exit(0)
}

app.on('second-instance', (_, commandLine = []) => {
  const deepLink = extractDeepLinkFromArgv(commandLine)
  if (deepLink) {
    dispatchDeepLinkPayload(parseDeepLinkPayload(deepLink))
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore()
  }

  mainWindow.show()
  mainWindow.focus()
})

app.on('open-url', (event, url) => {
  event.preventDefault()
  dispatchDeepLinkPayload(parseDeepLinkPayload(url))
})

const performAppReset = () => {
  try {
    isQuitting = true
    app.relaunch()
    app.exit(0)
  } catch (error) {
    console.error('App reset failed:', error)
  }
}

const readRuntimePrefs = () => {
  try {
    const raw = fs.readFileSync(runtimePrefsFile, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writeRuntimePrefs = (prefs = {}) => {
  try {
    fs.mkdirSync(path.dirname(runtimePrefsFile), { recursive: true })
    fs.writeFileSync(runtimePrefsFile, JSON.stringify(prefs, null, 2), 'utf8')
  } catch {
    // ignore write failures
  }
}

const runtimePrefs = readRuntimePrefs()
let hardwareAccelerationEnabled = runtimePrefs.hardwareAccelerationEnabled !== false
resetShortcutEnabled = runtimePrefs.resetShortcutEnabled !== false
resetShortcut = String(runtimePrefs.resetShortcut || 'Ctrl+Shift+R').trim()
mediaToggleShortcut = String(runtimePrefs.mediaToggleShortcut || '').trim()
preventSleepWhilePlayingEnabled = runtimePrefs.preventSleepWhilePlayingEnabled !== false
let launchOnStartupEnabled = runtimePrefs.launchOnStartupEnabled === true
if (!hardwareAccelerationEnabled) {
  app.disableHardwareAcceleration()
}

const syncLaunchOnStartupSetting = () => {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(launchOnStartupEnabled),
      openAsHidden: true,
    })
  } catch {
    // ignore startup registration issues
  }
}

const getLogoPath = () => {
  const buildIcon = path.join(__dirname, '..', 'build', 'logo.ico')
  const publicIcon = path.join(__dirname, '..', 'public', 'logo.ico')
  const buildLogo = path.join(__dirname, '..', 'build', 'logo.png')
  const publicLogo = path.join(__dirname, '..', 'public', 'logo.png')

  if (fs.existsSync(buildIcon)) return buildIcon
  if (fs.existsSync(publicIcon)) return publicIcon
  if (fs.existsSync(buildLogo)) return buildLogo
  return publicLogo
}

const createTrayIcon = () => {
  const logoPath = getLogoPath()
  if (fs.existsSync(logoPath)) {
    return nativeImage.createFromPath(logoPath)
  }

  return nativeImage.createFromDataURL(`data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="16" fill="#000"/>
      <circle cx="32" cy="32" r="18" fill="#fff"/>
      <path d="M28 22v20a6 6 0 1 0 4 5.6V29l12-2v-5l-16 4z" fill="#000"/>
    </svg>
  `)}`)
}

const setupDiscordRichPresence = async () => {
  if (!discordClientId) {
    return
  }

  rpcClient = new RPC.Client({ transport: 'ipc' })

  rpcClient.on('ready', () => {
    console.log('Discord Rich Presence connected')
  })

  try {
    await rpcClient.login({ clientId: discordClientId })
  } catch (error) {
    console.warn('Discord Rich Presence unavailable:', error?.message || error)
    rpcClient = null
  }
}

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url)
})

ipcMain.handle('window:set-fullscreen', async (_, nextState) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }

  const enabled = Boolean(nextState)
  mainWindow.setBackgroundColor(enabled ? '#000000' : '#0a1119')
  mainWindow.setFullScreen(enabled)
  return mainWindow.isFullScreen()
})

const getWindowLayoutState = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return {
      isFullScreen: false,
      isMaximized: false,
    }
  }

  return {
    isFullScreen: mainWindow.isFullScreen(),
    isMaximized: mainWindow.isMaximized(),
  }
}

const emitWindowLayoutState = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  mainWindow.webContents.send('window:layout-state', getWindowLayoutState())
}

ipcMain.handle('window:get-layout-state', async () => getWindowLayoutState())

ipcMain.handle('window:minimize', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }
  mainWindow.minimize()
  return true
})

ipcMain.handle('window:toggle-maximize', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, isMaximized: false }
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }

  return { ok: true, isMaximized: mainWindow.isMaximized() }
})

ipcMain.handle('window:close', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return false
  }
  mainWindow.close()
  return true
})

ipcMain.handle('updater:get-state', async () => ({
  ...updaterState,
  supported: isUpdaterSupported(),
}))

ipcMain.handle('updater:check', async () => triggerUpdateCheck())

ipcMain.handle('updater:download', async () => {
  if (!isUpdaterSupported() || !updaterState.updateAvailable || updaterState.downloaded) {
    return { ok: false, reason: 'not-ready' }
  }
  try {
    syncUpdaterState({ downloading: true, error: '' }, 'download-started')
    await autoUpdater.downloadUpdate()
    return { ok: true }
  } catch (error) {
    const message = formatUpdaterError(error)
    syncUpdaterState({ downloading: false, error: message }, 'error')
    return { ok: false, reason: message }
  }
})

ipcMain.handle('updater:install', async () => {
  if (!isUpdaterSupported() || !updaterState.downloaded) {
    return { ok: false, reason: 'not-ready' }
  }
  isQuitting = true
  autoUpdater.quitAndInstall()
  return { ok: true }
})

ipcMain.handle('report:issue', async (_, payload) => {
  const result = await sendDiscordErrorReport({
    title: payload?.title,
    subject: payload?.subject,
    description: payload?.description,
    message: payload?.message,
    context: payload?.context,
  })
  return result
})

ipcMain.handle('app:reset', async () => {
  performAppReset()
  return { ok: true }
})

ipcMain.handle('app:get-pending-deep-link', async () => {
  const payload = pendingDeepLinkPayload
  pendingDeepLinkPayload = null
  return payload || null
})

ipcMain.handle('app:copy-text', async (_, payload) => {
  const text = String(payload?.text || '').trim()
  if (!text) {
    return { ok: false, reason: 'empty-text' }
  }
  try {
    clipboard.writeText(text)
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error || 'copy-failed') }
  }
})

ipcMain.handle('data:restore-legacy', async () => {
  try {
    const result = migrateLegacyUserDataIfNeeded({ force: true })
    return result || { ok: true, migrated: false, reason: 'no-result' }
  } catch (error) {
    return { ok: false, migrated: false, reason: String(error?.message || error || 'restore-failed') }
  }
})

ipcMain.handle('data:factory-reset', async () => {
  try {
    const appDataDir = app.getPath('appData')
    const userDataDir = app.getPath('userData')
    const currentName = path.basename(String(userDataDir || ''))
    const wipeTargets = new Set([
      userDataDir,
      path.join(appDataDir, 'Electron'),
      path.join(appDataDir, 'electron'),
      path.join(appDataDir, 'music'),
      path.join(appDataDir, 'm-zik'),
      path.join(appDataDir, 'müzik'),
      path.join(appDataDir, 'Ghxsty Music'),
      path.join(appDataDir, 'ghxsty music'),
      path.join(appDataDir, 'GLITCH Music'),
      path.join(appDataDir, 'glitch music'),
    ])

    try {
      const entries = fs.readdirSync(appDataDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry?.isDirectory?.()) continue
        const name = String(entry.name || '').trim()
        if (!name) continue
        if (/^(music([_-].+)?)$|^(m[-_]?zik([_-].+)?)$|^(ghxsty music([_-].+)?)$|^(glitch music([_-].+)?)$/i.test(name)) {
          wipeTargets.add(path.join(appDataDir, name))
        }
      }
    } catch {
      // best effort
    }

    const targets = Array.from(wipeTargets).map((value) => path.resolve(String(value || ''))).filter(Boolean)
    const removed = []
    const failed = []

    const wipeDirContents = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name)
        try {
          fs.rmSync(entryPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 80 })
          removed.push(entryPath)
        } catch (error) {
          failed.push({ target: entryPath, reason: String(error?.message || error || 'remove-failed') })
        }
      }
    }

    for (const target of targets) {
      try {
        if (!fs.existsSync(target)) continue
        const sameAsCurrent = path.resolve(target) === path.resolve(userDataDir)
        if (sameAsCurrent) {
          // Çalışan profil klasörünü komple kaldırmak yerine içeriğini temizle.
          wipeDirContents(target)
          continue
        }
        fs.rmSync(target, { recursive: true, force: true, maxRetries: 2, retryDelay: 80 })
        removed.push(target)
      } catch (error) {
        failed.push({ target, reason: String(error?.message || error || 'remove-failed') })
      }
    }

    if (removed.length > 0) {
      setTimeout(() => {
        try {
          app.relaunch()
        } catch {
          // ignore relaunch failures
        }
        try {
          app.exit(0)
        } catch {
          // ignore exit failures
        }
      }, 120)
    }

    return {
      ok: removed.length > 0 && failed.length === 0,
      currentProfile: currentName,
      removedCount: removed.length,
      failedCount: failed.length,
      removed,
      failed,
    }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error || 'factory-reset-failed') }
  }
})

ipcMain.handle('data:list-local-library-files', async () => {
  try {
    const libraryDir = path.join(app.getPath('userData'), 'library-audio')
    if (!fs.existsSync(libraryDir)) {
      return { ok: true, files: [] }
    }
    const entries = fs.readdirSync(libraryDir, { withFileTypes: true })
    const audioPattern = /\.(mp3|wav|flac|m4a|aac|ogg|opus|webm|weba|mp4|mkv|m4b)$/i
    const files = []
    for (const entry of entries) {
      if (!entry?.isFile?.()) continue
      const fileName = String(entry.name || '').trim()
      if (!fileName || !audioPattern.test(fileName)) continue
      const absolutePath = path.join(libraryDir, fileName)
      let stat = null
      try {
        stat = fs.statSync(absolutePath)
      } catch {
        stat = null
      }
      const audioUrl = await toLocalMediaUrl(absolutePath)
      files.push({
        fileName,
        audioUrl,
        sizeBytes: Number(stat?.size || 0),
        mtimeMs: Number(stat?.mtimeMs || Date.now()),
      })
    }
    return { ok: true, files }
  } catch (error) {
    return { ok: false, error: String(error?.message || error || 'list-local-library-failed') }
  }
})

ipcMain.handle('check:dependencies', async () => {
  const commandExists = (cmd) => {
    try {
      const probe = process.platform === 'win32' ? 'where' : 'which'
      const result = spawnSync(probe, [cmd], { stdio: 'ignore', timeout: 3000 })
      return result.status === 0
    } catch {
      return false
    }
  }
  const canRunCommand = (cmd, args = ['--version']) => {
    if (!commandExists(cmd)) {
      return false
    }
    try {
      const result = spawnSync(cmd, args, { stdio: 'ignore', timeout: 5000 })
      return result.status === 0
    } catch {
      return false
    }
  }
  const canRunPython = () => canRunCommand('python', ['-V']) || canRunCommand('py', ['-V']) || canRunCommand('python3', ['-V'])

  const checkPythonPackage = async (packageName) => {
    const pythonCandidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python']
    for (const command of pythonCandidates) {
      try {
        const result = spawnSync(command, ['-m', 'pip', 'show', packageName], {
          stdio: 'ignore',
          timeout: 5000,
        })
        if (result.status === 0) {
          return true
        }
      } catch {
        // try next python executable
      }
    }
    return false
  }

  const dependencies = {
    'yt-dlp': canRunCommand('yt-dlp', ['--version']),
    'ffmpeg': canRunCommand('ffmpeg', ['-version']),
    python: canRunPython(),
  }

  let ytmusicapi = false
  if (dependencies.python) {
    ytmusicapi = await checkPythonPackage('ytmusicapi')
  }

  return {
    available: dependencies,
    ytmusicapi,
    missing: Object.entries(dependencies)
      .filter(([, available]) => !available)
      .map(([name]) => name),
    missingPython: dependencies.python ? (!ytmusicapi ? ['ytmusicapi'] : []) : [],
  }
})

ipcMain.handle('dependencies:auto-install', async () => {
  if (!RUNTIME_AUTO_INSTALL_ENABLED) {
    return {
      ok: false,
      reason: 'runtime-auto-install-disabled',
      logs: [
        'Runtime otomatik kurulum devre dışı.',
        'Uygulama çalışırken winget/exe indirme ve kurma akışları kapatıldı.',
      ],
    }
  }
  const installLogs = []
  const log = (message = '') => {
    installLogs.push(String(message || '').trim())
  }

  const commandExists = (cmd) => {
    try {
      const result = spawnSync('where', [cmd], { stdio: 'ignore', timeout: 3000 })
      return result.status === 0
    } catch {
      return false
    }
  }
  const canRunCommand = (cmd, args = ['--version']) => {
    if (!commandExists(cmd)) {
      return false
    }
    try {
      const result = spawnSync(cmd, args, { stdio: 'ignore', timeout: 5000 })
      return result.status === 0
    } catch {
      return false
    }
  }
  const canRunPython = () => canRunCommand('python', ['-V']) || canRunCommand('py', ['-V']) || canRunCommand('python3', ['-V'])

  const runWingetInstall = async (packageId) => {
    const result = await runPythonCommand('winget', [
      'install',
      '--id',
      packageId,
      '-e',
      '--silent',
      '--accept-package-agreements',
      '--accept-source-agreements',
    ])
    return result.ok
  }
  const checkPythonPackage = async (packageName) => {
    const pythonCandidates = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python']
    for (const command of pythonCandidates) {
      try {
        const result = spawnSync(command, ['-m', 'pip', 'show', packageName], {
          stdio: 'ignore',
          timeout: 5000,
        })
        if (result.status === 0) {
          return true
        }
      } catch {
        // try next python executable
      }
    }
    return false
  }

  try {
    if (process.platform !== 'win32') {
      return { ok: false, reason: 'unsupported-platform', logs: ['Otomatik kurulum şu an sadece Windows için mevcut.'] }
    }
    if (!commandExists('winget')) {
      return { ok: false, reason: 'winget-missing', logs: ['winget bulunamadı.'] }
    }

    const status = {
      python: canRunPython(),
      ytdlp: canRunCommand('yt-dlp', ['--version']),
      ffmpeg: canRunCommand('ffmpeg', ['-version']),
    }

    if (!status.python) {
      log('Python kuruluyor...')
      const ok = await runWingetInstall('Python.Python.3.12')
      log(ok ? 'Python kuruldu.' : 'Python kurulamadı.')
    }
    if (!status.ytdlp) {
      log('yt-dlp kuruluyor...')
      const ok = await runWingetInstall('yt-dlp')
      log(ok ? 'yt-dlp kuruldu.' : 'yt-dlp kurulamadı.')
    }
    if (!status.ffmpeg) {
      log('ffmpeg kuruluyor...')
      const ok = await runWingetInstall('Gyan.FFmpeg')
      log(ok ? 'ffmpeg kuruldu.' : 'ffmpeg kurulamadı.')
    }

    log('ytmusicapi kontrol ediliyor...')
    const ytmOk = await ensureYtMusicApiInstalled()
    log(ytmOk ? 'ytmusicapi hazır.' : 'ytmusicapi kurulamadı.')

    const afterCheck = await (async () => {
      const deps = {
        'yt-dlp': canRunCommand('yt-dlp', ['--version']),
        'ffmpeg': canRunCommand('ffmpeg', ['-version']),
        python: canRunPython(),
      }
      let ytmusicapi = false
      if (deps.python) {
        ytmusicapi = await checkPythonPackage('ytmusicapi')
      }
      return {
        available: deps,
        ytmusicapi,
        missing: Object.entries(deps)
          .filter(([, available]) => !available)
          .map(([name]) => name),
        missingPython: deps.python ? (!ytmusicapi ? ['ytmusicapi'] : []) : [],
      }
    })()

    return { ok: true, logs: installLogs, status: afterCheck }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error || 'auto-install-failed'), logs: installLogs }
  }
})

const sanitizeFileName = (value = '', fallback = 'track') => {
  const cleaned = String(value)
    .normalize('NFKD')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  return cleaned || fallback
}

const formatPresenceTime = (value) => {
  const total = Math.max(0, Math.floor(Number(value) || 0))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const getExtensionFromName = (name = '', fallback = '.mp3') => {
  const ext = path.extname(String(name || '')).toLowerCase()
  if (ext && ext.length <= 8) {
    return ext
  }
  return fallback
}

const getExtensionFromUrl = (value = '', fallback = '.mp3') => {
  try {
    const parsed = new URL(value)
    const last = parsed.pathname.split('/').pop() || ''
    return getExtensionFromName(last, fallback)
  } catch {
    return fallback
  }
}

const getExtensionFromContentType = (contentType = '', fallback = '.mp3') => {
  const normalized = String(contentType || '').toLowerCase()
  if (normalized.includes('audio/mpeg')) return '.mp3'
  if (normalized.includes('audio/wav') || normalized.includes('audio/x-wav')) return '.wav'
  if (normalized.includes('audio/flac')) return '.flac'
  if (normalized.includes('audio/mp4') || normalized.includes('audio/m4a')) return '.m4a'
  if (normalized.includes('audio/aac')) return '.aac'
  if (normalized.includes('audio/ogg')) return '.ogg'
  return fallback
}

const isGoogleDriveUrl = (value = '') => {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host.includes('drive.google.com') || host.includes('drive.usercontent.google.com')
  } catch {
    return /drive\.google\.com|drive\.usercontent\.google\.com/i.test(String(value || ''))
  }
}

const isHtmlLikeContentType = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  return normalized.includes('text/html')
}

const isLikelyAudioContentType = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) return true
  if (normalized.includes('audio/')) return true
  if (normalized.includes('application/octet-stream')) return true
  if (normalized.includes('binary/octet-stream')) return true
  return false
}

const isLikelyImageContentType = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) return false
  if (normalized.includes('image/')) return true
  if (normalized.includes('jpeg')) return true
  if (normalized.includes('jpg')) return true
  if (normalized.includes('png')) return true
  if (normalized.includes('webp')) return true
  if (normalized.includes('gif')) return true
  if (normalized.includes('bmp')) return true
  if (normalized.includes('avif')) return true
  return false
}

const isLikelyDirectAudioUrl = (value = '') => {
  const normalized = String(value || '').toLowerCase()
  if (!normalized) {
    return false
  }
  return (
    normalized.includes('export=download') ||
    /\.(mp3|wav|flac|m4a|aac|ogg)(\?|$)/i.test(normalized)
  )
}

const isYouTubeUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim())
    const host = parsed.hostname.toLowerCase()
    return host.includes('youtube.com') || host.includes('youtu.be')
  } catch {
    return /youtube\.com|youtu\.be/i.test(String(value || ''))
  }
}

const extractYouTubePlaylistUrl = (value = '') => {
  try {
    const parsed = new URL(String(value || '').trim())
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
      return ''
    }
    const listId = parsed.searchParams.get('list')
    if (!listId) {
      return ''
    }
    return `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}`
  } catch {
    return ''
  }
}

const normalizeYouTubeUrl = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }
  try {
    const parsed = new URL(raw)
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('youtube.com') && !host.includes('youtu.be')) {
      return raw
    }

    if (host.includes('youtu.be')) {
      const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0]
      if (videoId) {
        return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      }
      return raw
    }

    const videoId =
      parsed.searchParams.get('v') ||
      (parsed.pathname.includes('/watch') ? '' : parsed.pathname.split('/').filter(Boolean).pop())
    const listId = parsed.searchParams.get('list')

    if (videoId && listId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&list=${encodeURIComponent(listId)}`
    }
    if (videoId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
    }
    if (listId) {
      return `https://www.youtube.com/playlist?list=${encodeURIComponent(listId)}`
    }
    return raw
  } catch {
    return raw
  }
}

const getAvailableCookieBrowsers = () => {
  const localAppData = String(process.env.LOCALAPPDATA || '').trim()
  const appData = String(process.env.APPDATA || '').trim()
  const candidates = [
    {
      key: 'chrome',
      paths: [path.join(localAppData, 'Google', 'Chrome', 'User Data')],
    },
    {
      key: 'edge',
      paths: [path.join(localAppData, 'Microsoft', 'Edge', 'User Data')],
    },
    {
      key: 'firefox',
      paths: [path.join(appData, 'Mozilla', 'Firefox')],
    },
    {
      key: 'brave',
      paths: [path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data')],
    },
  ]

  return candidates
    .filter((item) => item.paths.some((target) => target && fs.existsSync(target)))
    .map((item) => item.key)
}

const isMissingCookiesDbError = (message = '') =>
  /could not find .*cookies database|could not copy .*cookies database/i.test(String(message || ''))

const isDpapiCookieError = (message = '') =>
  /failed to decrypt with dpapi/i.test(String(message || ''))

const decodeHtmlEntities = (value = '') =>
  String(value || '')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')

const extractDriveConfirmUrl = (html = '') => {
  const source = String(html || '')
  const hrefMatch =
    source.match(/href="(\/uc\?export=download[^"]*confirm=[^"]*)"/i) ||
    source.match(/href="(https:\/\/drive\.google\.com\/uc\?export=download[^"]*confirm=[^"]*)"/i)
  if (hrefMatch?.[1]) {
    const decoded = decodeHtmlEntities(hrefMatch[1].trim())
    if (/^https?:\/\//i.test(decoded)) {
      return decoded
    }
    return `https://drive.google.com${decoded.startsWith('/') ? '' : '/'}${decoded}`
  }

  const formMatch =
    source.match(/<form[^>]+id="download-form"[^>]+action="([^"]+)"/i) ||
    source.match(/<form[^>]+action="(https:\/\/drive\.google\.com\/uc\?export=download[^"]+)"/i)
  if (formMatch?.[1]) {
    return decodeHtmlEntities(formMatch[1].trim())
  }

  return ''
}

const fetchWithGoogleDriveFallback = async (targetUrl, options = {}) => {
  let response = await fetch(targetUrl, options)
  if (!response.ok || !isGoogleDriveUrl(targetUrl)) {
    return response
  }

  const initialType = String(response.headers.get('content-type') || '')
  if (!isHtmlLikeContentType(initialType)) {
    return response
  }

  const html = await response.text()
  const confirmUrl = extractDriveConfirmUrl(html)
  if (!confirmUrl) {
    const fallbackIdMatch =
      String(targetUrl).match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      String(targetUrl).match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fallbackIdMatch?.[1]) {
      const directUrl = `https://drive.usercontent.google.com/download?id=${fallbackIdMatch[1]}&export=download&confirm=t`
      response = await fetch(directUrl, options)
      return response
    }
    const error = new Error('drive-confirm-required')
    error.code = 'drive-confirm-required'
    throw error
  }

  return fetch(confirmUrl, options)
}

const ensureDirectory = async (target) => {
  await fs.promises.mkdir(target, { recursive: true })
}

const ensureUniqueFilePath = async (filePath) => {
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)
  let attempt = 0
  let candidate = filePath
  while (attempt < 300) {
    try {
      await fs.promises.access(candidate, fs.constants.F_OK)
      attempt += 1
      candidate = path.join(dir, `${base} (${attempt})${ext}`)
    } catch {
      return candidate
    }
  }
  return path.join(dir, `${base}-${Date.now()}${ext}`)
}

const commandExists = (command = '') => {
  const name = String(command || '').trim()
  if (!name) {
    return false
  }
  try {
    const probe = process.platform === 'win32' ? 'where' : 'which'
    const result = spawnSync(probe, [name], { stdio: 'ignore' })
    return result.status === 0
  } catch {
    return false
  }
}

const getYtDlpCandidates = () => {
  const candidates = []
  if (process.platform === 'win32') {
    if (commandExists('yt-dlp')) {
      candidates.push({ command: 'yt-dlp', args: [], mode: 'binary' })
    }
    if (commandExists('py')) {
      candidates.push({ command: 'py', args: [], mode: 'python' })
    }
    if (commandExists('python')) {
      candidates.push({ command: 'python', args: [], mode: 'python' })
    }
    if (commandExists('python3')) {
      candidates.push({ command: 'python3', args: [], mode: 'python' })
    }
  } else {
    if (commandExists('yt-dlp')) {
      candidates.push({ command: 'yt-dlp', args: [], mode: 'binary' })
    }
    if (commandExists('python3')) {
      candidates.push({ command: 'python3', args: [], mode: 'python' })
    }
    if (commandExists('python')) {
      candidates.push({ command: 'python', args: [], mode: 'python' })
    }
  }
  return candidates
}

const getPythonCandidates = () => {
  if (process.platform === 'win32') {
    return ['py', 'python', 'python3']
  }
  return ['python3', 'python']
}

const runPythonCommand = async (command, args = [], options = {}) =>
  new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    })
    child.on('error', (error) => {
      if (settled) return
      settled = true
      resolve({ ok: false, code: -1, stdout, stderr: String(error?.message || error || 'spawn-error') })
    })
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      resolve({ ok: code === 0, code: Number(code || 0), stdout, stderr })
    })
  })

let ytmusicApiInstallAttempted = false
let pythonRuntimeInstallAttempted = false

const ensurePythonRuntimeInstalled = async () => {
  if (pythonRuntimeInstallAttempted || process.platform !== 'win32') {
    return false
  }
  pythonRuntimeInstallAttempted = true
  if (!commandExists('winget')) {
    return false
  }
  const install = await runPythonCommand('winget', [
    'install',
    '--id',
    'Python.Python.3.12',
    '-e',
    '--silent',
    '--accept-package-agreements',
    '--accept-source-agreements',
  ])
  if (!install.ok) {
    return false
  }
  // winget may require a fresh shell, but often python becomes available immediately.
  return commandExists('py') || commandExists('python') || commandExists('python3')
}

const ensureYtMusicApiInstalled = async () => {
  if (ytmusicApiInstallAttempted) {
    return false
  }
  ytmusicApiInstallAttempted = true
  for (const command of getPythonCandidates()) {
    if (!commandExists(command)) continue
    const probe = await runPythonCommand(command, ['-c', 'import ytmusicapi; print("ok")'])
    if (probe.ok && String(probe.stdout || '').toLowerCase().includes('ok')) {
      return true
    }
    await runPythonCommand(command, ['-m', 'pip', 'install', '--user', 'ytmusicapi'])
    const recheck = await runPythonCommand(command, ['-c', 'import ytmusicapi; print("ok")'])
    if (recheck.ok && String(recheck.stdout || '').toLowerCase().includes('ok')) {
      return true
    }
  }
  return false
}

const runYtMusicApi = async (payload = {}) => {
  // In production, the script is in resources/bin extracted from extraResources
  // process.resourcesPath points to the 'resources' folder next to app.asar
  let scriptPath = path.join(process.resourcesPath, 'bin', 'ytmusic_bridge.py')
  if (!fs.existsSync(scriptPath)) {
    // Fallback for development mode
    scriptPath = path.join(__dirname, 'ytmusic_bridge.py')
  }
  if (!fs.existsSync(scriptPath)) {
    return { ok: false, error: 'ytmusic-bridge-missing' }
  }

  let candidates = getPythonCandidates()
  let lastError = ''
  const hasAnyPython = candidates.some((command) => commandExists(command))
  if (!hasAnyPython) {
    return { ok: false, error: 'python-not-found' }
  }
  let retriedAfterInstall = false
  for (const command of candidates) {
    if (!commandExists(command)) {
      continue
    }
    try {
      const result = await new Promise((resolve) => {
        let stdout = ''
        let stderr = ''
        let settled = false
        const child = spawn(command, [scriptPath], {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONUTF8: '1',
            PYTHONIOENCODING: 'utf-8',
          },
        })
        child.on('error', (error) => {
          if (settled) return
          settled = true
          resolve({ ok: false, error: String(error?.message || error || 'spawn-error') })
        })
        child.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        child.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })
        child.on('close', (code) => {
          if (settled) return
          settled = true
          if (code !== 0) {
            resolve({ ok: false, error: String(stderr || stdout || `exit-${code}`) })
            return
          }
          resolve({ ok: true, stdout, stderr })
        })
        child.stdin?.write(JSON.stringify(payload || {}))
        child.stdin?.end()
      })
      if (!result.ok) {
        lastError = String(result.error || '')
        const lowerError = lastError.toLowerCase()
        const moduleMissing =
          lowerError.includes('no module named') && lowerError.includes('ytmusicapi')
        if (moduleMissing && !retriedAfterInstall) {
          retriedAfterInstall = true
          await runPythonCommand(command, ['-m', 'pip', 'install', '--user', 'ytmusicapi'])
          const verify = await runPythonCommand(command, ['-c', 'import ytmusicapi; print("ok")'])
          if (verify.ok && String(verify.stdout || '').toLowerCase().includes('ok')) {
            const retryResult = await new Promise((resolve) => {
              let stdout = ''
              let stderr = ''
              let settled = false
              const child = spawn(command, [scriptPath], {
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                  ...process.env,
                  PYTHONUTF8: '1',
                  PYTHONIOENCODING: 'utf-8',
                },
              })
              child.on('error', (error) => {
                if (settled) return
                settled = true
                resolve({ ok: false, error: String(error?.message || error || 'spawn-error') })
              })
              child.stdout?.on('data', (chunk) => {
                stdout += chunk.toString()
              })
              child.stderr?.on('data', (chunk) => {
                stderr += chunk.toString()
              })
              child.on('close', (code) => {
                if (settled) return
                settled = true
                if (code !== 0) {
                  resolve({ ok: false, error: String(stderr || stdout || `exit-${code}`) })
                  return
                }
                resolve({ ok: true, stdout, stderr })
              })
              child.stdin?.write(JSON.stringify(payload || {}))
              child.stdin?.end()
            })
            if (retryResult.ok) {
              const parsed = JSON.parse(String(retryResult.stdout || '{}'))
              return parsed
            }
            lastError = String(retryResult.error || lastError || '')
          }
        }
        continue
      }
      const parsed = JSON.parse(String(result.stdout || '{}'))
      const parsedError = String(parsed?.error || '').toLowerCase()
      const parsedModuleMissing =
        (parsed?.ok === false && parsedError.includes('ytmusicapi import failed')) ||
        (parsed?.ok === false && parsedError.includes('no module named') && parsedError.includes('ytmusicapi'))

      if (parsedModuleMissing && !retriedAfterInstall) {
        retriedAfterInstall = true
        await runPythonCommand(command, ['-m', 'pip', 'install', '--user', 'ytmusicapi'])
        const verify = await runPythonCommand(command, ['-c', 'import ytmusicapi; print("ok")'])
        if (verify.ok && String(verify.stdout || '').toLowerCase().includes('ok')) {
          const retryResult = await new Promise((resolve) => {
            let stdout = ''
            let stderr = ''
            let settled = false
            const child = spawn(command, [scriptPath], {
              windowsHide: true,
              stdio: ['pipe', 'pipe', 'pipe'],
              env: {
                ...process.env,
                PYTHONUTF8: '1',
                PYTHONIOENCODING: 'utf-8',
              },
            })
            child.on('error', (error) => {
              if (settled) return
              settled = true
              resolve({ ok: false, error: String(error?.message || error || 'spawn-error') })
            })
            child.stdout?.on('data', (chunk) => {
              stdout += chunk.toString()
            })
            child.stderr?.on('data', (chunk) => {
              stderr += chunk.toString()
            })
            child.on('close', (code) => {
              if (settled) return
              settled = true
              if (code !== 0) {
                resolve({ ok: false, error: String(stderr || stdout || `exit-${code}`) })
                return
              }
              resolve({ ok: true, stdout, stderr })
            })
            child.stdin?.write(JSON.stringify(payload || {}))
            child.stdin?.end()
          })

          if (retryResult.ok) {
            return JSON.parse(String(retryResult.stdout || '{}'))
          }
          lastError = String(retryResult.error || lastError || '')
          continue
        }
      }

      return parsed
    } catch (error) {
      lastError = String(error?.message || error || 'ytmusic-exec-error')
    }
  }
  return { ok: false, error: lastError || 'python-not-found' }
}

const downloadDirectUrlToLibrary = async ({ targetUrl, title = '', artist = '', fileName = '' }) => {
  const response = await fetchWithGoogleDriveFallback(targetUrl)
  if (!response.ok) {
    return { ok: false, reason: 'http-error', status: response.status }
  }
  const contentType = response.headers.get('content-type') || ''
  if (!isLikelyAudioContentType(contentType)) {
    return { ok: false, reason: 'invalid-content-type', contentType }
  }

  const data = Buffer.from(await response.arrayBuffer())
  const safeBase = sanitizeFileName(
    path.basename(String(fileName || '').trim(), path.extname(String(fileName || '').trim())) ||
      `${artist ? `${artist} - ` : ''}${title || 'track'}`,
    'track',
  )
  const extByName = fileName ? getExtensionFromName(fileName, '') : ''
  const extension =
    extByName || getExtensionFromUrl(targetUrl, '') || getExtensionFromContentType(contentType, '.mp3')

  const libraryDir = path.join(app.getPath('userData'), 'library-audio')
  await ensureDirectory(libraryDir)
  const initialPath = path.join(
    libraryDir,
    `${safeBase}${extension.startsWith('.') ? extension : `.${extension}`}`,
  )
  const filePath = await ensureUniqueFilePath(initialPath)
  await fs.promises.writeFile(filePath, data)

  return {
    ok: true,
    filePath,
    fileUrl: await toLocalMediaUrl(filePath),
    fileName: path.basename(filePath),
    contentType,
    extension,
    size: data.length || 0,
  }
}

const runYtDlpDownload = async ({ targetUrl, title = '', artist = '', allowPlaylist = true, signal = null }) => {
  const rawTitle = String(title || '').trim()
  const rawArtist = String(artist || '').trim()
  const safeBase = sanitizeFileName(
    `${rawArtist ? `${rawArtist} - ` : ''}${rawTitle || 'track'}`,
    'track',
  )
  const libraryDir = path.join(app.getPath('userData'), 'library-audio')
  await ensureDirectory(libraryDir)
  const hasCustomBase = Boolean(rawTitle || rawArtist)
  const dynamicSingleBase = hasCustomBase ? safeBase : '%(title)s [%(id)s]'
  const dynamicPlaylistBase = hasCustomBase
    ? `${safeBase} - %(playlist_index|NA)s - %(title)s`
    : '%(playlist_title|Playlist)s - %(playlist_index|NA)s - %(title)s [%(id)s]'

  const candidateCommands = getYtDlpCandidates()

  if (!candidateCommands.length) {
    return {
      ok: false,
      reason: 'yt-dlp-binary-missing',
      usedAnyBundledBinary: false,
      error: 'Bundled yt-dlp binary not found',
    }
  }

  const moveFileAcrossVolumes = async (sourcePath, destinationPath) => {
    try {
      await fs.promises.rename(sourcePath, destinationPath)
      return
    } catch (error) {
      if (String(error?.code || '') !== 'EXDEV') {
        throw error
      }
    }
    await fs.promises.copyFile(sourcePath, destinationPath)
    await fs.promises.unlink(sourcePath)
  }

  const collectAudioFiles = async (rootDir) => {
    const files = []
    const queue = [rootDir]
    while (queue.length) {
      const current = queue.shift()
      const entries = await fs.promises.readdir(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          queue.push(fullPath)
          continue
        }
        if (/\.(mp3|wav|flac|m4a|aac|ogg|webm|opus|mp4|mkv|m4b|weba)$/i.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }
    return files
  }

  const collectAnyDownloadedMedia = async (rootDir) => {
    const files = []
    const queue = [rootDir]
    while (queue.length) {
      const current = queue.shift()
      const entries = await fs.promises.readdir(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          queue.push(fullPath)
          continue
        }
        const lower = entry.name.toLowerCase()
        if (
          lower.endsWith('.info.json') ||
          lower.endsWith('.description') ||
          lower.endsWith('.part') ||
          lower.endsWith('.ytdl') ||
          lower.endsWith('.json')
        ) {
          continue
        }
        files.push(fullPath)
      }
    }
    return files
  }

  let lastError = ''
  let usedAnyBundledBinary = false
  let sawCookieAccessProblem = false
  const youtubeTarget = isYouTubeUrl(targetUrl)
  const getYouTubeThumbFromInfo = (info = {}) => {
    const webpageUrl = String(info?.webpage_url || info?.original_url || '').trim()
    const isMusicPage = /music\.youtube\.com/i.test(webpageUrl)
    if (!isMusicPage) {
      // Do not use regular YouTube video thumbnail as album cover.
      return ''
    }
    const direct = String(info?.thumbnail || '').trim()
    if (direct) return direct
    const id = String(info?.id || '').trim()
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    const match = webpageUrl.match(/[?&]v=([^&]+)/i) || webpageUrl.match(/youtu\.be\/([^?&/]+)/i)
    if (match?.[1]) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`
    return ''
  }
  for (const candidate of candidateCommands) {
    if (candidate.mode === 'binary') {
      usedAnyBundledBinary = true
    }

    const jobDir = path.join(
      libraryDir,
      `.yt-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    )
    await ensureDirectory(jobDir)
    const outputTemplate = path.join(
      jobDir,
      allowPlaylist
        ? `${dynamicPlaylistBase}.%(ext)s`
        : `${dynamicSingleBase}.%(ext)s`,
    )

    const commonArgs = [
      '--windows-filenames',
      '--ignore-errors',
      '--write-info-json',
      '--format',
      'bestaudio/best',
      '--no-warnings',
      '--output',
      outputTemplate,
      targetUrl,
    ]
    if (!allowPlaylist) {
      commonArgs.unshift('--no-playlist')
    } else {
      commonArgs.unshift('--yes-playlist')
    }
    // User-managed dependency model:
    // ffmpeg path is not bundled/injected at runtime.
    // Avoid ffmpeg transcoding for lower disk usage during download.
    // We keep the original audio stream format (m4a/webm/other bestaudio).

    const useBrowserCookies =
      String(process.env.ENABLE_BROWSER_COOKIES || '').trim() === '1'
    const availableCookieBrowsers =
      youtubeTarget && useBrowserCookies ? getAvailableCookieBrowsers() : []
    const attemptVariants = youtubeTarget
      ? [
          { kind: 'no-cookie-default', args: [] },
          { kind: 'no-cookie-android', args: ['--extractor-args', 'youtube:player_client=android'] },
          { kind: 'no-cookie-tv', args: ['--extractor-args', 'youtube:player_client=tv_embedded'] },
          ...availableCookieBrowsers.map((browser) => ({
            kind: 'browser-cookies',
            args: ['--cookies-from-browser', browser],
          })),
        ]
      : [{ kind: 'default', args: [] }]

    let downloadedWithThisCandidate = false
    for (const attempt of attemptVariants) {
      const fullArgs =
        candidate.mode === 'python'
          ? [...candidate.args, '-m', 'yt_dlp', ...attempt.args, ...commonArgs]
          : [...candidate.args, ...attempt.args, ...commonArgs]

      try {
        const result = await new Promise((resolve) => {
        let stdout = ''
        let stderr = ''
        let spawnFailed = false
        let aborted = false
        const child = spawn(candidate.command, fullArgs, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        const abortHandler = () => {
          aborted = true
          try {
            child.kill('SIGTERM')
          } catch {
            // ignore kill errors
          }
        }
        if (signal) {
          if (signal.aborted) {
            abortHandler()
          } else {
            signal.addEventListener('abort', abortHandler, { once: true })
          }
        }

        child.on('error', (error) => {
          spawnFailed = true
          lastError = String(error?.message || error || 'spawn-error')
        })
        child.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        child.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })
        child.on('close', (code) => {
          if (signal) {
            signal.removeEventListener('abort', abortHandler)
          }
          resolve({
            ok: !spawnFailed && !aborted && code === 0,
            aborted,
            code,
            stdout,
            stderr,
          })
        })
        })

        if (result.aborted) {
          await fs.promises.rm(jobDir, { recursive: true, force: true })
          return {
            ok: false,
            reason: 'aborted',
          }
        }

        const downloadedPaths = await collectAudioFiles(jobDir)
        if (!downloadedPaths.length && !result.ok) {
          const stderrText = String(result.stderr || '').trim()
          const stdoutText = String(result.stdout || '').trim()
          const candidateError = stderrText || stdoutText || ''
          const isCookieProblem =
            isMissingCookiesDbError(candidateError) || isDpapiCookieError(candidateError)
          if (isCookieProblem) {
            sawCookieAccessProblem = true
          } else if (candidateError) {
            lastError = candidateError
          } else if (!lastError) {
            lastError = 'yt-dlp-failed'
          }
          await fs.promises.rm(jobDir, { recursive: true, force: true })
          await ensureDirectory(jobDir)
          continue
        }

        if (!downloadedPaths.length) {
          // Fallback 1: if any non-meta media exists, still accept it.
          const anyMedia = await collectAnyDownloadedMedia(jobDir)
          if (anyMedia.length) {
            downloadedPaths.push(...anyMedia)
          } else {
            // Fallback 2: force audio extraction to mp3 for hard cases.
            const fallbackArgs =
              candidate.mode === 'python'
                ? [...candidate.args, '-m', 'yt_dlp', ...attempt.args, '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', ...commonArgs]
                : [...candidate.args, ...attempt.args, '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', ...commonArgs]

            const fallbackResult = await new Promise((resolve) => {
              let stdout = ''
              let stderr = ''
              let spawnFailed = false
              const child = spawn(candidate.command, fallbackArgs, {
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe'],
              })
              child.on('error', (error) => {
                spawnFailed = true
                stderr = String(error?.message || error || 'spawn-error')
              })
              child.stdout?.on('data', (chunk) => {
                stdout += chunk.toString()
              })
              child.stderr?.on('data', (chunk) => {
                stderr += chunk.toString()
              })
              child.on('close', (code) => {
                resolve({
                  ok: !spawnFailed && code === 0,
                  stdout,
                  stderr,
                })
              })
            })

            const fallbackDownloaded = await collectAudioFiles(jobDir)
            if (!fallbackDownloaded.length && !fallbackResult.ok) {
              lastError = String(fallbackResult.stderr || fallbackResult.stdout || 'yt-dlp-path-missing')
              await fs.promises.rm(jobDir, { recursive: true, force: true })
              await ensureDirectory(jobDir)
              continue
            }
            if (!fallbackDownloaded.length) {
              lastError = 'yt-dlp-path-missing'
              await fs.promises.rm(jobDir, { recursive: true, force: true })
              await ensureDirectory(jobDir)
              continue
            }
            downloadedPaths.push(...fallbackDownloaded)
          }
        }

        const tracks = []
        for (const sourcePath of downloadedPaths) {
          const desiredPath = path.join(libraryDir, path.basename(sourcePath))
          const finalPath = await ensureUniqueFilePath(desiredPath)
          const sourceInfoPath = sourcePath.replace(/\.[^/.]+$/, '.info.json')
          const finalInfoPath = finalPath.replace(/\.[^/.]+$/, '.info.json')
          let info = null

          try {
            const rawInfo = await fs.promises.readFile(sourceInfoPath, 'utf8')
            info = JSON.parse(rawInfo)
          } catch {
            info = null
          }

          await moveFileAcrossVolumes(sourcePath, finalPath)
          try {
            await moveFileAcrossVolumes(sourceInfoPath, finalInfoPath)
          } catch {
            // ignore missing info file
          }
          const stats = await fs.promises.stat(finalPath)

          const normalizedTitle = String(
            info?.track ||
            info?.title ||
            '',
          ).trim()
          const normalizedArtist = String(
            info?.artist ||
            info?.uploader ||
            info?.channel ||
            '',
          ).trim()
          const normalizedAlbum = String(
            info?.album ||
            info?.playlist_title ||
            '',
          ).trim()
          const normalizedCoverUrl = getYouTubeThumbFromInfo(info)
          tracks.push({
            filePath: finalPath,
            fileUrl: await toLocalMediaUrl(finalPath),
            fileName: path.basename(finalPath),
            size: Number(stats.size || 0),
            title: normalizedTitle,
            artist: normalizedArtist,
            album: normalizedAlbum,
            coverUrl: normalizedCoverUrl,
          })
        }

        await fs.promises.rm(jobDir, { recursive: true, force: true })
        downloadedWithThisCandidate = true
        return {
          ok: true,
          isPlaylist: tracks.length > 1,
          tracks,
          totalSize: tracks.reduce((sum, item) => sum + Number(item.size || 0), 0),
        }
      } catch (error) {
        lastError = String(error?.message || error || 'file-stat-error')
        await fs.promises.rm(jobDir, { recursive: true, force: true })
        await ensureDirectory(jobDir)
      }
    }

    if (!downloadedWithThisCandidate) {
      await fs.promises.rm(jobDir, { recursive: true, force: true })
    }
  }

  return {
    ok: false,
    reason: 'yt-dlp-unavailable-or-failed',
    usedAnyBundledBinary,
    error:
      lastError ||
      (sawCookieAccessProblem
        ? 'Tarayıcı çerezlerine erişilemedi (DPAPI). Çerezsiz denemeler de başarısız oldu.'
        : ''),
  }
}

const runYtDlpSearch = async ({ query = '', limit = 10, source = 'ytmusic' }) => {
  const searchQuery = String(query || '').trim()
  if (!searchQuery) {
    return { ok: false, reason: 'empty-query', items: [] }
  }

  const safeLimit = Math.max(1, Math.min(25, Number(limit || 10)))
  const candidateCommands = getYtDlpCandidates()
  if (!candidateCommands.length) {
    return { ok: false, reason: 'yt-dlp-binary-missing', items: [] }
  }

  const effectiveSource = String(source || 'ytmusic').toLowerCase() === 'youtube' ? 'youtube' : 'ytmusic'
  // Keep yt-dlp compatible search prefix; YT Music behavior is controlled via extractor args.
  const searchPrefix = 'ytsearch'
  const args = [
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    '--extractor-args',
    effectiveSource === 'ytmusic'
      ? 'youtube:player_client=web_music'
      : 'youtube:player_client=web',
    '--playlist-end',
    String(safeLimit),
    `${searchPrefix}${safeLimit}:${searchQuery}`,
  ]

  try {
    let parsed = null
    let lastSearchError = ''
    for (const candidate of candidateCommands) {
      const fullArgs =
        candidate.mode === 'python'
          ? [...candidate.args, '-m', 'yt_dlp', ...args]
          : [...candidate.args, ...args]

      const result = await new Promise((resolve) => {
        let stdout = ''
        let stderr = ''
        let spawnFailed = false
        const child = spawn(candidate.command, fullArgs, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
        })
        child.on('error', (error) => {
          spawnFailed = true
          stderr = String(error?.message || error || 'spawn-error')
        })
        child.stdout?.on('data', (chunk) => {
          stdout += chunk.toString()
        })
        child.stderr?.on('data', (chunk) => {
          stderr += chunk.toString()
        })
        child.on('close', (code) => {
          resolve({
            ok: !spawnFailed && code === 0,
            stdout,
            stderr,
          })
        })
      })

      if (!result.ok) {
        lastSearchError = String(result.stderr || result.stdout || '').trim()
        continue
      }

      parsed = JSON.parse(String(result.stdout || '{}'))
      break
    }

    if (!parsed) {
      return {
        ok: false,
        reason: 'yt-dlp-search-failed',
        error: lastSearchError || 'yt-dlp search failed',
        items: [],
      }
    }

    const entries = Array.isArray(parsed?.entries) ? parsed.entries : []
    const buildYoutubeThumb = (id = '', preferred = 'hqdefault') => {
      const cleanId = String(id || '').trim()
      if (!cleanId) {
        return ''
      }
      return `https://i.ytimg.com/vi/${cleanId}/${preferred}.jpg`
    }
    const blockedTitle = /\b(slowed|sped\s*up|nightcore|karaoke|8d|bass\s*boosted|live|concert|reaction)\b/i
    const items = entries
      .map((entry) => {
        const id = String(entry?.id || '').trim()
        if (!id) {
          return null
        }
        const title = String(entry?.title || '').trim()
        if (!title || blockedTitle.test(title)) {
          return null
        }
        const duration = Number(entry?.duration || 0)
        return {
          id,
          title,
          artist: String(entry?.uploader || entry?.channel || '').trim(),
          duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
          url:
            effectiveSource === 'ytmusic'
              ? `https://music.youtube.com/watch?v=${id}`
              : `https://www.youtube.com/watch?v=${id}`,
          thumbnail:
            String(entry?.thumbnail || '').trim() ||
            buildYoutubeThumb(id, 'hqdefault') ||
            buildYoutubeThumb(id, 'mqdefault'),
          source: effectiveSource,
        }
      })
      .filter(Boolean)

    return { ok: true, items }
  } catch (error) {
    return {
      ok: false,
      reason: 'yt-dlp-search-error',
      error: String(error?.message || error || 'search-error'),
      items: [],
    }
  }
}

const fetchJsonSafe = async (url, fallback = null) => {
  try {
    const response = await fetch(url)
    if (!response.ok) return fallback
    return await response.json()
  } catch {
    return fallback
  }
}

const normalizeText = (value = '') =>
  String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const artistNameMatches = (left = '', right = '') => {
  const l = normalizeText(left)
  const r = normalizeText(right)
  if (!l || !r) return false
  return l === r || l.includes(r) || r.includes(l)
}

const classifyAlbumKind = (albumName = '', trackCount = 0) => {
  const normalized = normalizeText(albumName)
  if (/\b(single|ep)\b/.test(normalized)) return 'single'
  if (Number(trackCount || 0) > 0 && Number(trackCount || 0) <= 3) return 'single'
  return 'album'
}

const getArtistCatalogFromItunes = async (artistName = '') => {
  const query = String(artistName || '').trim()
  if (!query) return { ok: true, albums: [], singles: [], topSongs: [] }

  const artistSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=8`
  const artistSearchJson = await fetchJsonSafe(artistSearchUrl, { results: [] })
  const artistCandidates = Array.isArray(artistSearchJson?.results) ? artistSearchJson.results : []
  const selectedArtist =
    artistCandidates.find((item) => artistNameMatches(item?.artistName || '', query)) || artistCandidates[0] || null
  if (!selectedArtist?.artistId) {
    return { ok: true, albums: [], singles: [], topSongs: [] }
  }

  const artistId = Number(selectedArtist.artistId)
  const lookupUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=250`
  const lookupJson = await fetchJsonSafe(lookupUrl, { results: [] })
  const rows = Array.isArray(lookupJson?.results) ? lookupJson.results : []

  const albumMap = new Map()
  const topSongs = []

  for (const row of rows) {
    const wrapper = String(row?.wrapperType || '')
    if (wrapper === 'track' && String(row?.kind || '') === 'song') {
      const trackName = String(row?.trackName || '').trim()
      const trackArtist = String(row?.artistName || selectedArtist.artistName || query).trim()
      if (trackName && topSongs.length < 25) {
        topSongs.push({
          id: `it-track-${row?.trackId || `${trackArtist}-${trackName}`}`,
          title: trackName,
          artist: trackArtist,
          duration: Math.round(Number(row?.trackTimeMillis || 0) / 1000) || 0,
          url: '',
          thumbnail: String(row?.artworkUrl100 || '').replace('100x100bb', '512x512bb'),
          album: String(row?.collectionName || '').trim(),
        })
      }
      continue
    }

    if (wrapper !== 'collection' || String(row?.collectionType || '') !== 'Album') continue
    const rowArtist = String(row?.artistName || '').trim()
    if (!artistNameMatches(rowArtist, query)) continue

    const collectionId = Number(row?.collectionId || 0)
    const title = String(row?.collectionName || '').trim()
    if (!collectionId || !title) continue

    const key = String(collectionId)
    if (albumMap.has(key)) continue

    albumMap.set(key, {
      id: `it:${collectionId}`,
      title,
      coverUrl: String(row?.artworkUrl100 || '').replace('100x100bb', '512x512bb'),
      artist: rowArtist || query,
      trackCount: Number(row?.trackCount || 0) || 0,
      releaseDate: String(row?.releaseDate || '').trim(),
      kind: classifyAlbumKind(title, Number(row?.trackCount || 0)),
    })
  }

  const releases = Array.from(albumMap.values()).sort((a, b) => {
    const da = Date.parse(a.releaseDate || '') || 0
    const db = Date.parse(b.releaseDate || '') || 0
    return db - da
  })

  const albums = releases.filter((item) => item.kind === 'album')
  const singles = releases.filter((item) => item.kind === 'single')

  return { ok: true, albums, singles, topSongs }
}

const getAlbumTracksFromItunes = async (albumId = '', fallbackArtist = '') => {
  const normalized = String(albumId || '').trim()
  const match = normalized.match(/^it:(\d+)$/)
  if (!match) return { ok: false, tracks: [] }

  const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(match[1])}&entity=song`
  const lookupJson = await fetchJsonSafe(lookupUrl, { results: [] })
  const rows = Array.isArray(lookupJson?.results) ? lookupJson.results : []
  const tracks = []
  for (const row of rows) {
    if (String(row?.wrapperType || '') !== 'track' || String(row?.kind || '') !== 'song') continue
    const title = String(row?.trackName || '').trim()
    const artist = String(row?.artistName || fallbackArtist || '').trim()
    if (!title) continue
    tracks.push({
      id: `it-song-${row?.trackId || `${artist}-${title}`}`,
      title,
      artist,
      duration: Math.round(Number(row?.trackTimeMillis || 0) / 1000) || 0,
      url: '',
      thumbnail: String(row?.artworkUrl100 || '').replace('100x100bb', '512x512bb'),
      album: String(row?.collectionName || '').trim(),
    })
  }

  // Fill playable links from YT Music search (limited parallelism for speed and stability).
  const concurrency = 4
  for (let i = 0; i < tracks.length; i += concurrency) {
    const chunk = tracks.slice(i, i + concurrency)
    await Promise.all(
      chunk.map(async (track) => {
        const result = await runYtDlpSearch({
          query: `${track.artist} ${track.title}`.trim(),
          limit: 1,
          source: 'ytmusic',
        })
        const first = Array.isArray(result?.items) ? result.items[0] : null
        if (first?.url) {
          track.url = String(first.url)
          if (!track.thumbnail && first.thumbnail) {
            track.thumbnail = String(first.thumbnail)
          }
        }
      }),
    )
  }

  return { ok: true, tracks }
}


ipcMain.handle('library:export', async (_, payload) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, reason: 'window-missing' }
  }

  const tracks = Array.isArray(payload?.tracks) ? payload.tracks : []
  if (!tracks.length) {
    return { ok: false, reason: 'empty' }
  }

  const confirm = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Cancel', 'Continue'],
    defaultId: 1,
    cancelId: 0,
    title: 'Export',
    message: 'Export music and covers?',
    detail: `${tracks.length} tracks selected. Files will be saved after you choose a folder.`,
    noLink: true,
  })

  if (confirm.response !== 1) {
    return { ok: false, reason: 'cancelled' }
  }

  const pick = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose save folder',
    properties: ['openDirectory', 'createDirectory'],
  })

  if (pick.canceled || !pick.filePaths?.[0]) {
    return { ok: false, reason: 'cancelled' }
  }

  const baseDir = pick.filePaths[0]
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const exportRoot = path.join(baseDir, `GLITCH-Music-Export-${stamp}`)
  const audioDir = path.join(exportRoot, 'audio')
  const coverDir = path.join(exportRoot, 'covers')
  await ensureDirectory(audioDir)
  await ensureDirectory(coverDir)

  const manifest = {
    exportedAt: new Date().toISOString(),
    app: 'GLITCH Music',
    tracks: [],
  }

  let successCount = 0
  let coverCount = 0

  for (const [index, track] of tracks.entries()) {
    const title = track?.title || `ParÃ§a ${index + 1}`
    const artist = track?.artist || 'Bilinmeyen SanatÃ§Ä±'
    const baseName = sanitizeFileName(`${artist} - ${title}`, `track-${index + 1}`)
    const entry = {
      id: track?.id || `track-${index + 1}`,
      title,
      artist,
      duration: Number(track?.duration || 0),
      source: track?.source || 'local',
      audioFile: '',
      coverFile: '',
      audioUrl: track?.audio?.kind === 'url' ? track.audio.url : '',
      coverUrl: track?.cover?.kind === 'url' ? track.cover.url : '',
    }

    try {
      let audioBuffer = null
      let audioExt = '.mp3'

      if (track?.audio?.kind === 'buffer' && track.audio.bytes) {
        audioBuffer = Buffer.from(track.audio.bytes)
        audioExt = getExtensionFromName(track.audio.name || '', '.mp3')
      } else if (track?.audio?.kind === 'url' && track.audio.url) {
        const response = await fetch(track.audio.url)
        if (!response.ok) {
          throw new Error('audio-download-failed')
        }
        const data = await response.arrayBuffer()
        audioBuffer = Buffer.from(data)
        audioExt = getExtensionFromUrl(track.audio.url, '.mp3')
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('audio-empty')
      }

      const audioFile = `${baseName}${audioExt}`
      await fs.promises.writeFile(path.join(audioDir, audioFile), audioBuffer)
      entry.audioFile = `audio/${audioFile}`
      successCount += 1
    } catch {
      entry.audioFile = ''
    }

    try {
      let coverBuffer = null
      let coverExt = '.jpg'

      if (track?.cover?.kind === 'buffer' && track.cover.bytes) {
        coverBuffer = Buffer.from(track.cover.bytes)
        coverExt = getExtensionFromName(track.cover.name || '', '.jpg')
      } else if (track?.cover?.kind === 'url' && track.cover.url) {
        const response = await fetch(track.cover.url)
        if (response.ok) {
          const data = await response.arrayBuffer()
          coverBuffer = Buffer.from(data)
          coverExt = getExtensionFromUrl(track.cover.url, '.jpg')
        }
      }

      if (coverBuffer && coverBuffer.length) {
        const coverFile = `${baseName}${coverExt}`
        await fs.promises.writeFile(path.join(coverDir, coverFile), coverBuffer)
        entry.coverFile = `covers/${coverFile}`
        coverCount += 1
      }
    } catch {
      entry.coverFile = ''
    }

    manifest.tracks.push(entry)
  }

  await fs.promises.writeFile(
    path.join(exportRoot, 'tracks-export.json'),
    JSON.stringify(manifest, null, 2),
    'utf8',
  )

  return {
    ok: true,
    exportRoot,
    successCount,
    coverCount,
    total: tracks.length,
  }
})

ipcMain.removeAllListeners('presence:update')
ipcMain.on('presence:update', (_, presence) => {
  playbackActiveForPowerSave = Boolean(presence?.track && presence?.isPlaying)
  syncPlaybackPowerSaveBlocker()

  if (!rpcClient) {
    return
  }

  if (!presence?.track) {
    rpcClient.clearActivity().catch(() => {})
    return
  }

  const title = String(presence.track.title || '').trim() || 'Bilinmeyen Sarki'
  const artist = String(presence.track.artist || '').trim() || 'GLITCH Music'
  const collection = String(presence.track.collection || '').trim() || 'Muzik'
  const album = String(presence.track.album || '').trim()
  const coverUrl = String(presence.track.coverUrl || '').trim()
  const duration = Number(presence.track.duration || 0) || 0
  const currentProgress = Math.max(0, Number(presence.progress || 0) || 0)
  const clampedProgress = duration > 0 ? Math.min(currentProgress, duration) : currentProgress

  const progressLabel = duration > 0
    ? `${formatPresenceTime(clampedProgress)} / ${formatPresenceTime(duration)}`
    : 'Canli'
  const sourceLabel = album || collection
  const stateText = `by ${artist}`
  const now = Date.now()
  const safeDuration = Math.max(0, Number(duration || 0) || 0)
  const safeProgress = Math.max(0, Math.min(Number(clampedProgress || 0) || 0, safeDuration || Number(clampedProgress || 0) || 0))
  const startMs = now - Math.floor(safeProgress * 1000)
  const endMs = safeDuration > 0 ? startMs + Math.floor(safeDuration * 1000) : 0
  
  // Discord RPC accepts public HTTPS artwork URLs. Local file/127.0.0.1 covers
  // cannot be resolved by Discord, so the renderer sends the original remote URL.
  const normalizedCoverUrl = (() => {
    if (!/^https:\/\//i.test(coverUrl)) return ''
    try {
      return new URL(coverUrl).href
    } catch {
      return ''
    }
  })()

  const getDiscordMediaKey = (url) => {
    if (!url) return ''
    return /^https:\/\//i.test(url) ? url : ''
  }
  
  const mediaKey = normalizedCoverUrl ? getDiscordMediaKey(normalizedCoverUrl) : ''
  
  const baseActivity = {
    name: 'GLITCH Music',
    type: 2, // LISTENING
    details: title,
    state: stateText,
    ...(presence.isPlaying && safeDuration > 0 ? { startTimestamp: new Date(startMs), endTimestamp: new Date(endMs) } : {}),
    largeImageText: `${artist} • ${sourceLabel}`,
    smallImageKey: discordSmallImageKey,
    smallImageText: presence.isPlaying ? `Caliyor • ${progressLabel}` : `Duraklatildi • ${progressLabel}`,
    buttons: [{ label: 'GLITCH Music', url: 'https://github.com/ghxsty-dev/glitch-music' }],
    instance: false,
  }

  const coverActivityCandidates = [
    mediaKey ? { ...baseActivity, largeImageKey: mediaKey } : null,
    { ...baseActivity, largeImageKey: discordLargeImageKey },
    baseActivity,
  ].filter(Boolean)

  const setRpcActivityRaw = async (activity) => {
    if (!rpcClient) {
      throw new Error('rpc-client-missing')
    }
    const rawActivity = {
      name: String(activity?.name || 'GLITCH Music'),
      type: Number(activity?.type || 2),
      details: activity?.details,
      state: activity?.state,
      instance: Boolean(activity?.instance),
      buttons: Array.isArray(activity?.buttons) ? activity.buttons : undefined,
      assets: {
        large_image: activity?.largeImageKey,
        large_text: activity?.largeImageText,
        small_image: activity?.smallImageKey,
        small_text: activity?.smallImageText,
      },
      timestamps:
        activity?.startTimestamp || activity?.endTimestamp
          ? {
              start: activity?.startTimestamp
                ? Math.floor(new Date(activity.startTimestamp).getTime() / 1000)
                : undefined,
              end: activity?.endTimestamp
                ? Math.floor(new Date(activity.endTimestamp).getTime() / 1000)
                : undefined,
            }
          : undefined,
    }
    
    if (typeof rpcClient.request === 'function') {
      await rpcClient.request('SET_ACTIVITY', {
        pid: process.pid,
        activity: rawActivity,
      })
      return
    }
    await rpcClient.setActivity(activity)
  }

  const [firstCandidate, ...fallbackCandidates] = coverActivityCandidates
  let chain = setRpcActivityRaw(firstCandidate)
  for (const activity of fallbackCandidates) {
    chain = chain.catch(() => setRpcActivityRaw(activity))
  }
  chain.catch(() => {})
})

ipcMain.on('settings:update', async (_, settings) => {
  if (settings?.closeBehavior === 'quit' || settings?.closeBehavior === 'tray') {
    closeBehavior = settings.closeBehavior
  }

  if (typeof settings?.resetShortcutEnabled === 'boolean') {
    resetShortcutEnabled = settings.resetShortcutEnabled
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      resetShortcutEnabled,
    })
  }

  if (Object.prototype.hasOwnProperty.call(settings || {}, 'resetShortcut')) {
    const nextResetShortcut = String(settings?.resetShortcut || 'Ctrl+Shift+R').trim()
    if (nextResetShortcut !== resetShortcut) {
      resetShortcut = nextResetShortcut
      writeRuntimePrefs({
        ...readRuntimePrefs(),
        resetShortcut,
      })
      
      try {
        globalShortcut.unregisterAll()
      } catch {
        // ignore
      }
      registerMediaShortcuts()
    }
  }

  if (Object.prototype.hasOwnProperty.call(settings || {}, 'mediaToggleShortcut')) {
    mediaToggleShortcut = String(settings?.mediaToggleShortcut || '').trim()
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      mediaToggleShortcut,
    })
    syncCustomMediaShortcut()
  }

  if (typeof settings?.preventSleepWhilePlayingEnabled === 'boolean') {
    preventSleepWhilePlayingEnabled = settings.preventSleepWhilePlayingEnabled
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      preventSleepWhilePlayingEnabled,
    })
    syncPlaybackPowerSaveBlocker()
  }

  if (typeof settings?.launchOnStartupEnabled === 'boolean') {
    launchOnStartupEnabled = settings.launchOnStartupEnabled
    writeRuntimePrefs({
      ...readRuntimePrefs(),
      launchOnStartupEnabled,
    })
    syncLaunchOnStartupSetting()
  }

  if (typeof settings?.hardwareAccelerationEnabled === 'boolean') {
    const nextValue = settings.hardwareAccelerationEnabled
    if (nextValue !== hardwareAccelerationEnabled) {
      hardwareAccelerationEnabled = nextValue
      writeRuntimePrefs({
        ...readRuntimePrefs(),
        hardwareAccelerationEnabled: nextValue,
      })

      if (mainWindow && !mainWindow.isDestroyed()) {
        const result = await dialog.showMessageBox(mainWindow, {
          type: 'question',
          buttons: ['Later', 'Restart now'],
          defaultId: 1,
          cancelId: 0,
          title: 'Restart required',
          message: 'Hardware acceleration setting will apply after restart.',
          detail: 'Do you want to restart the app now?',
          noLink: true,
        })

        if (result.response === 1) {
          isQuitting = true
          app.relaunch()
          app.exit(0)
        }
      }
    }
  }
})

ipcMain.handle('library:download-remote', async (_, payload) => {
  const targetUrl = String(payload?.url || '').trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  try {
    const response = await fetchWithGoogleDriveFallback(targetUrl)
    if (!response.ok) {
      return { ok: false, reason: 'http-error', status: response.status }
    }
    const contentType = response.headers.get('content-type') || ''
    if (!isLikelyAudioContentType(contentType)) {
      return { ok: false, reason: 'invalid-content-type', contentType }
    }

    const data = await response.arrayBuffer()
    const bytes = Array.from(new Uint8Array(data))
    const fileName = String(payload?.fileName || '').trim()
    const extByName = fileName ? getExtensionFromName(fileName, '') : ''
    const extension =
      extByName ||
      getExtensionFromUrl(targetUrl, '') ||
      getExtensionFromContentType(contentType, '.mp3')

    return {
      ok: true,
      bytes,
      contentType,
      extension,
    }
  } catch (error) {
    if (error?.code === 'drive-confirm-required') {
      return { ok: false, reason: 'drive-confirm-required' }
    }
    return { ok: false, reason: 'network-error' }
  }
})

ipcMain.handle('library:download-cover-to-library', async (_, payload) => {
  const targetUrl = String(payload?.url || '').trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  try {
    const response = await fetchWithGoogleDriveFallback(targetUrl)
    if (!response.ok) {
      return { ok: false, reason: 'http-error', status: response.status }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!isLikelyImageContentType(contentType)) {
      return { ok: false, reason: 'invalid-content-type', contentType }
    }

    const data = Buffer.from(await response.arrayBuffer())
    if (!data.length) {
      return { ok: false, reason: 'empty-data' }
    }

    const inputName = String(payload?.fileName || '').trim()
    const safeBase = sanitizeFileName(path.basename(inputName, path.extname(inputName)) || 'cover')
    const extByName = inputName ? getExtensionFromName(inputName, '') : ''
    const extension =
      extByName ||
      getExtensionFromUrl(targetUrl, '') ||
      getExtensionFromContentType(contentType, '.jpg')

    const coverDir = path.join(app.getPath('userData'), 'library-covers')
    await ensureDirectory(coverDir)
    const initialPath = path.join(
      coverDir,
      `${safeBase}${extension.startsWith('.') ? extension : `.${extension}`}`,
    )
    const filePath = await ensureUniqueFilePath(initialPath)
    await fs.promises.writeFile(filePath, data)

    return {
      ok: true,
      filePath,
      fileUrl: await toLocalMediaUrl(filePath),
      contentType,
      extension,
      size: data.length || 0,
    }
  } catch (error) {
    if (error?.code === 'drive-confirm-required') {
      return { ok: false, reason: 'drive-confirm-required' }
    }
    return { ok: false, reason: String(error?.message || error || 'download-cover-failed') }
  }
})

ipcMain.handle('library:download-remote-to-library', async (_, payload) => {
  const targetUrl = String(payload?.url || '').trim()
  const requestId = String(payload?.requestId || '').trim()
  const title = String(payload?.title || '').trim()
  const artist = String(payload?.artist || '').trim()
  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  try {
    if (requestId) {
      const controller = new AbortController()
      libraryDownloadControls.set(requestId, {
        controller,
        status: 'downloading',
        title,
        artist,
      })
    }

    emitLibraryDownloadProgress({
      requestId,
      status: 'starting',
      receivedBytes: 0,
      totalBytes: 0,
      title,
      artist,
    })

    const response = await fetchWithGoogleDriveFallback(targetUrl, {
      signal: requestId ? libraryDownloadControls.get(requestId)?.controller?.signal : undefined,
    })
    if (!response.ok) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'http-error', status: response.status }
    }

    const contentType = response.headers.get('content-type') || ''
    if (!isLikelyAudioContentType(contentType)) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'invalid-content-type', contentType }
    }

    const totalBytes = Number(response.headers.get('content-length') || 0) || 0
    let data = Buffer.alloc(0)
    let receivedBytes = 0

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader()
      const chunks = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        if (value) {
          const chunk = Buffer.from(value)
          chunks.push(chunk)
          receivedBytes += chunk.length
          emitLibraryDownloadProgress({
            requestId,
            status: 'downloading',
            receivedBytes,
            totalBytes,
            title,
            artist,
          })
        }
      }
      data = Buffer.concat(chunks)
    } else {
      data = Buffer.from(await response.arrayBuffer())
      receivedBytes = data.length
      emitLibraryDownloadProgress({
        requestId,
        status: 'downloading',
        receivedBytes,
        totalBytes: totalBytes || receivedBytes,
        title,
        artist,
      })
    }

    const inputName = String(payload?.fileName || '').trim()
    const safeBase = sanitizeFileName(path.basename(inputName, path.extname(inputName)) || 'track')
    const extByName = inputName ? getExtensionFromName(inputName, '') : ''
    const extension =
      extByName ||
      getExtensionFromUrl(targetUrl, '') ||
      getExtensionFromContentType(contentType, '.mp3')

    const libraryDir = path.join(app.getPath('userData'), 'library-audio')
    await ensureDirectory(libraryDir)
    const initialPath = path.join(libraryDir, `${safeBase}${extension.startsWith('.') ? extension : `.${extension}`}`)
    const filePath = await ensureUniqueFilePath(initialPath)
    await fs.promises.writeFile(filePath, data)

    emitLibraryDownloadProgress({
      requestId,
      status: 'completed',
      receivedBytes: data.length || receivedBytes,
      totalBytes: totalBytes || data.length || receivedBytes,
      title,
      artist,
      filePath,
    })

    return {
      ok: true,
      filePath,
      fileUrl: await toLocalMediaUrl(filePath),
      contentType,
      extension,
      size: data.length || 0,
    }
  } catch (error) {
    const isAbort = error?.name === 'AbortError'
    if (isAbort && requestId) {
      const control = libraryDownloadControls.get(requestId)
      const abortedStatus = control?.status === 'paused' ? 'paused' : 'cancelled'
      emitLibraryDownloadProgress({
        requestId,
        status: abortedStatus,
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return {
        ok: false,
        reason: 'aborted',
        status: abortedStatus,
      }
    }
    if (error?.code === 'drive-confirm-required') {
      emitLibraryDownloadProgress({
        requestId,
        status: 'failed',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })
      return { ok: false, reason: 'drive-confirm-required' }
    }
    emitLibraryDownloadProgress({
      requestId,
      status: 'failed',
      receivedBytes: 0,
      totalBytes: 0,
      title,
      artist,
    })
    return { ok: false, reason: 'network-or-write-error' }
  } finally {
    if (requestId) {
      libraryDownloadControls.delete(requestId)
    }
  }
})

ipcMain.handle('library:download-link-to-library', async (_, payload) => {
  const inputUrl = String(payload?.url || '').trim()
  const normalizedInputUrl = normalizeYouTubeUrl(inputUrl)
  const forcedPlaylistUrl = extractYouTubePlaylistUrl(normalizedInputUrl)
  const targetUrl = forcedPlaylistUrl || normalizedInputUrl || inputUrl
  const title = String(payload?.title || '').trim()
  const artist = String(payload?.artist || '').trim()
  const requestId = String(payload?.requestId || '').trim()

  if (!targetUrl) {
    return { ok: false, reason: 'missing-url' }
  }

  if (requestId) {
    const controller = new AbortController()
    libraryDownloadControls.set(requestId, {
      controller,
      status: 'downloading',
      title,
      artist,
    })
    emitLibraryDownloadProgress({
      requestId,
      status: 'starting',
      receivedBytes: 0,
      totalBytes: 0,
      title: title || 'Bağlantı',
      artist: artist || 'İndiriliyor',
    })
    emitLibraryDownloadProgress({
      requestId,
      status: 'downloading',
      receivedBytes: 0,
      totalBytes: 0,
      title: title || 'Bağlantı',
      artist: artist || 'İndiriliyor',
    })
  }

  try {
    if (isGoogleDriveUrl(targetUrl) || isLikelyDirectAudioUrl(targetUrl)) {
      const directResult = await downloadDirectUrlToLibrary({
        targetUrl,
        title,
        artist,
        fileName: String(payload?.fileName || '').trim(),
      })
      if (requestId) {
        emitLibraryDownloadProgress({
          requestId,
          status: directResult.ok ? 'completed' : 'failed',
          receivedBytes: Number(directResult.size || 0),
          totalBytes: Number(directResult.size || 0),
          title: title || 'Bağlantı',
          artist: artist || 'İndiriliyor',
          filePath: String(directResult.filePath || ''),
        })
      }
      return directResult
    }

    const control = requestId ? libraryDownloadControls.get(requestId) : null
    const downloadResult = await runYtDlpDownload({
      targetUrl,
      title,
      artist,
      allowPlaylist: true,
      signal: control?.controller?.signal || null,
    })

    if (!downloadResult.ok) {
      if (requestId) {
        emitLibraryDownloadProgress({
          requestId,
          status: downloadResult.reason === 'aborted' ? 'cancelled' : 'failed',
          receivedBytes: 0,
          totalBytes: 0,
          title: title || 'Bağlantı',
          artist: artist || 'İndiriliyor',
        })
      }
      return downloadResult
    }

    const downloadedTracks = Array.isArray(downloadResult.tracks) ? downloadResult.tracks : []
    const firstTrack = downloadedTracks[0] || null
    if (requestId) {
      emitLibraryDownloadProgress({
        requestId,
        status: 'completed',
        receivedBytes: Number(downloadResult.totalSize || 0),
        totalBytes: Number(downloadResult.totalSize || 0),
        title:
          title ||
          (downloadResult.isPlaylist ? `Playlist (${downloadedTracks.length} şarkı)` : firstTrack?.fileName || 'Bağlantı'),
        artist: artist || (downloadResult.isPlaylist ? 'Playlist indirildi' : 'İndirildi'),
        filePath: String(firstTrack?.filePath || ''),
      })
    }

      return {
        ok: true,
      isPlaylist: Boolean(downloadResult.isPlaylist),
      tracks: downloadedTracks.map((track) => ({
        filePath: String(track.filePath || ''),
        fileUrl: String(track.fileUrl || ''),
        fileName: String(track.fileName || ''),
        extension: getExtensionFromName(track.fileName || '', '.mp3'),
        size: Number(track.size || 0),
        title: String(track.title || ''),
        artist: String(track.artist || ''),
        album: String(track.album || ''),
        coverUrl: String(track.coverUrl || ''),
      })),
      filePath: String(firstTrack?.filePath || ''),
      fileUrl: String(firstTrack?.fileUrl || ''),
      fileName: String(firstTrack?.fileName || ''),
      extension: getExtensionFromName(firstTrack?.fileName || '', '.mp3'),
      size: Number(firstTrack?.size || 0),
      totalSize: Number(downloadResult.totalSize || 0),
      sourceUrl: targetUrl,
    }
  } finally {
    if (requestId) {
      libraryDownloadControls.delete(requestId)
    }
  }
})

ipcMain.handle('library:search-youtube', async (_, payload) => {
  const query = String(payload?.query || '').trim()
  const limit = Number(payload?.limit || 10)
  return runYtDlpSearch({ query, limit, source: 'ytmusic' })
})

ipcMain.handle('library:search-ytmusic', async (_, payload) => {
  const query = String(payload?.query || '').trim()
  const limit = Number(payload?.limit || 12)
  const filter = String(payload?.filter || 'all').trim().toLowerCase()
  return runYtMusicApi({ action: 'search', query, limit, filter })
})

ipcMain.handle('library:artist-ytmusic-albums', async (_, payload) => {
  const artistName = String(payload?.artistName || '').trim()
  const ytmResult = await runYtMusicApi({ action: 'artist_albums', artistName })
  const hasYtmData =
    Boolean(Array.isArray(ytmResult?.albums) && ytmResult.albums.length) ||
    Boolean(Array.isArray(ytmResult?.singles) && ytmResult.singles.length) ||
    Boolean(Array.isArray(ytmResult?.topSongs) && ytmResult.topSongs.length)

  if (ytmResult?.ok && hasYtmData) {
    return ytmResult
  }

  const fallback = await getArtistCatalogFromItunes(artistName)
  if (!fallback?.ok) {
    return ytmResult
  }

  const mapRelease = (rows = []) =>
    (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: String(row?.id || '').trim(),
        title: String(row?.title || '').trim(),
        coverUrl: String(row?.coverUrl || '').trim(),
        artist: String(row?.artist || artistName || '').trim(),
        trackCount: Number(row?.trackCount || 0) || 0,
      }))
      .filter((row) => row.id && row.title)

  const mapTopSong = (rows = []) =>
    (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: String(row?.id || '').trim(),
        title: String(row?.title || '').trim(),
        artist: String(row?.artist || artistName || '').trim(),
        duration: Number(row?.duration || 0) || 0,
        url: String(row?.url || '').trim(),
        thumbnail: String(row?.thumbnail || '').trim(),
        album: String(row?.album || '').trim(),
      }))
      .filter((row) => row.id && row.title)

  return {
    ok: true,
    albums: mapRelease(fallback.albums),
    singles: mapRelease(fallback.singles),
    topSongs: mapTopSong(fallback.topSongs),
    source: 'itunes-fallback',
  }
})

ipcMain.handle('library:ytmusic-album-tracks', async (_, payload) => {
  const albumId = String(payload?.albumId || '').trim()
  return runYtMusicApi({ action: 'album_tracks', albumId })
})

ipcMain.handle('library:ytmusic-mood-playlists', async () => {
  return runYtMusicApi({ action: 'mood_playlists' })
})

ipcMain.handle('library:ytmusic-similar-playlists', async (_, payload) => {
  const artists = Array.isArray(payload?.artists) ? payload.artists.map((item) => String(item || '').trim()).filter(Boolean) : []
  return runYtMusicApi({ action: 'similar_playlists', artists })
})

ipcMain.handle('library:ytmusic-latest-release', async (_, payload) => {
  const artists = Array.isArray(payload?.artists) ? payload.artists.map((item) => String(item || '').trim()).filter(Boolean) : []
  return runYtMusicApi({ action: 'latest_release_for_artists', artists })
})

ipcMain.handle('library:ytmusic-random-missing-song', async (_, payload) => {
  const artists = Array.isArray(payload?.artists) ? payload.artists.map((item) => String(item || '').trim()).filter(Boolean) : []
  const ownedSignatures = Array.isArray(payload?.ownedSignatures)
    ? payload.ownedSignatures.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  const seed = String(payload?.seed || '').trim()
  return runYtMusicApi({ action: 'random_missing_song_for_artists', artists, ownedSignatures, seed })
})

ipcMain.handle('library:ytmusic-playlist-tracks', async (_, payload) => {
  const playlistId = String(payload?.playlistId || '').trim()
  return runYtMusicApi({ action: 'playlist_tracks', playlistId })
})

ipcMain.handle('library:fetch-remote-json', async (_, payload) => {
  const rawUrl = String(payload?.url || '').trim()
  if (!rawUrl) {
    return { ok: false, reason: 'missing-url' }
  }
  try {
    const response = await fetch(normalizeDriveUrl(rawUrl), { cache: 'no-store' })
    if (!response.ok) {
      return { ok: false, reason: `http_${response.status}` }
    }
    const json = await response.json()
    return { ok: true, json }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error || 'fetch-failed') }
  }
})

ipcMain.handle('youtube:auth-status', async () => {
  return getYoutubeAuthStatus()
})

ipcMain.handle('youtube:connect', async (_, payload) => {
  try {
    const cid = String(payload?.clientId || '')
    const csec = String(payload?.clientSecret || '')
    console.log('[YouTube OAuth] ipc payload lengths:', {
      hasPayload: Boolean(payload),
      clientIdLength: cid.length,
      clientSecretLength: csec.length,
      clientIdPreview: cid ? `${cid.slice(0, 8)}...` : '',
    })
  } catch {
    // ignore payload logging issues
  }
  return connectYoutubeAccount(payload || {})
})

ipcMain.handle('youtube:disconnect', async () => {
  clearYoutubeAuthState()
  return { ok: true, connected: false }
})

ipcMain.handle('youtube:list-playlists', async () => {
  return listYoutubePlaylists()
})

ipcMain.handle('youtube:list-playlist-tracks', async (_, payload) => {
  return listYoutubePlaylistTracks(payload?.playlistId)
})

ipcMain.handle('spotify:auth-status', async () => {
  return getSpotifyAuthStatus()
})

ipcMain.handle('spotify:connect', async (_, payload) => {
  return connectSpotifyAccount(payload || {})
})

ipcMain.handle('spotify:disconnect', async () => {
  clearSpotifyAuthState()
  return { ok: true }
})

ipcMain.handle('spotify:list-playlists', async () => {
  return listSpotifyPlaylists()
})

ipcMain.handle('spotify:list-playlist-tracks', async (_, payload) => {
  return listSpotifyPlaylistTracks(payload?.playlistId)
})

ipcMain.handle('lyrics:fetch-lrclib', async (_, payload) => {
  const artist = String(payload?.artist || '').trim()
  const title = String(payload?.title || '').trim()
  if (!artist || !title) {
    return { ok: false, lyrics: '', reason: 'missing-artist-or-title' }
  }

  const extractLyrics = (item) => {
    if (!item || typeof item !== 'object') return ''
    const synced = String(item.syncedLyrics || '').trim()
    if (synced) return synced
    return String(item.plainLyrics || '').trim()
  }

  const fetchLrcLibJson = async (url, timeoutMs = 9000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'GLITCH Music lyrics client',
        },
        cache: 'no-store',
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  try {
    const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const getRes = await fetchLrcLibJson(getUrl)
    if (getRes.ok) {
      const json = await getRes.json()
      const lyrics = extractLyrics(json)
      if (lyrics) return { ok: true, lyrics, source: 'get' }
    }
  } catch {
    // fallback below
  }

  try {
    const searchUrl = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`
    const searchRes = await fetchLrcLibJson(searchUrl)
    if (searchRes.ok) {
      const json = await searchRes.json()
      if (Array.isArray(json)) {
        for (const item of json) {
          const lyrics = extractLyrics(item)
          if (lyrics) return { ok: true, lyrics, source: 'search' }
        }
      }
    }
  } catch {
    // no-op
  }

  return { ok: false, lyrics: '', reason: 'not-found' }
})

ipcMain.handle('lyrics:fetch-aggregate', async (_, payload) => {
  const artist = String(payload?.artist || '').trim()
  const title = String(payload?.title || '').trim()
  if (!artist || !title) {
    return { ok: false, lyrics: '', reason: 'missing-artist-or-title' }
  }

  const fetchWithTimeout = async (url, timeoutMs = 2000, options = {}) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
          accept: 'application/json,text/plain,*/*',
          ...(options.headers || {}),
        },
        cache: 'no-store',
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`http_${res.status}`)
      return res
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Parallel fetch with Promise.race to guarantee timeout
  const fetchAny = async (promises) => {
    return Promise.race([
      Promise.any(promises),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('all-sources-timeout')), 9000)
      ),
    ])
  }

  // Lyrics.ovh
  const ovhPromise = (async () => {
    try {
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      const res = await fetchWithTimeout(ovhUrl, 1800)
      const json = await res.json()
      const lyrics = String(json?.lyrics || '').trim()
      if (lyrics) return { ok: true, lyrics, source: 'ovh' }
    } catch {}
    return null
  })()

  // Make It Personal
  const mipPromise = (async () => {
    try {
      const mipUrl = `https://makeitpersonal.co/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`
      const res = await fetchWithTimeout(
        mipUrl,
        1800,
        { headers: { accept: 'text/plain,*/*' } }
      )
      const text = String(await res.text()).trim()
      if (text && !/sorry|not found|rate limit/i.test(text)) {
        return { ok: true, lyrics: text, source: 'makeitpersonal' }
      }
    } catch {}
    return null
  })()

  // Popcat
  const popcatPromise = (async () => {
    try {
      const query = `${artist} ${title}`.trim()
      const popUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(query)}`
      const res = await fetchWithTimeout(popUrl, 1800)
      const json = await res.json()
      const lyrics = String(json?.lyrics || '').trim()
      if (lyrics) return { ok: true, lyrics, source: 'popcat' }
    } catch {}
    return null
  })()

  try {
    const result = await Promise.race([
      (async () => {
        const r1 = await ovhPromise
        if (r1?.ok) return r1
        const r2 = await mipPromise
        if (r2?.ok) return r2
        const r3 = await popcatPromise
        if (r3?.ok) return r3
        return null
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('total-timeout')), 7000)
      ),
    ])
    if (result?.ok) return result
  } catch {}

  return { ok: false, lyrics: '', reason: 'not-found' }
})

ipcMain.handle('library:resolve-local-track-urls', async (_, payload) => {
  try {
    const items = Array.isArray(payload?.tracks) ? payload.tracks : []
    if (!items.length) {
      return { ok: true, resolved: {} }
    }

    const libraryDir = path.join(app.getPath('userData'), 'library-audio')
    const resolved = {}

    for (const item of items) {
      const id = String(item?.id || '').trim()
      if (!id) {
        continue
      }

      const existingAudioUrl = String(item?.audioUrl || '').trim()
      if (/^file:\/\//i.test(existingAudioUrl)) {
        try {
          const filePath = fileURLToPath(existingAudioUrl)
          if (fs.existsSync(filePath)) {
            const localMediaUrl = await toLocalMediaUrl(filePath)
            if (localMediaUrl) {
              resolved[id] = localMediaUrl
              continue
            }
          }
        } catch {
          // ignore invalid file URL
        }
      }

      const rawFileName = String(item?.fileName || '').trim()
      const fileName = path.basename(rawFileName)
      if (!fileName || fileName === '.' || fileName === '..') {
        continue
      }

      const localPath = path.join(libraryDir, fileName)
      const legacyPath = path.join(app.getPath('appData'), 'Electron', 'library-audio', fileName)
      const finalPath = fs.existsSync(localPath) ? localPath : fs.existsSync(legacyPath) ? legacyPath : ''
      if (finalPath) {
        const localMediaUrl = await toLocalMediaUrl(finalPath)
        if (localMediaUrl) {
          resolved[id] = localMediaUrl
        }
      }
    }

    return { ok: true, resolved }
  } catch (error) {
    return {
      ok: false,
      reason: String(error?.message || error || 'resolve-local-track-urls-failed'),
    }
  }
})

ipcMain.handle('library:delete-local-track-file', async (_, payload) => {
  try {
    const fileNameRaw = String(payload?.fileName || '').trim()
    const audioUrlRaw = String(payload?.audioUrl || '').trim()
    const safeFileName = path.basename(fileNameRaw)
    const candidates = []

    if (audioUrlRaw) {
      if (/^file:\/\//i.test(audioUrlRaw)) {
        try {
          candidates.push(fileURLToPath(audioUrlRaw))
        } catch {
          // ignore invalid file urls
        }
      } else {
        try {
          const parsed = new URL(audioUrlRaw)
          const localMediaPrefix = '/local-media/'
          if (parsed.pathname.startsWith(localMediaPrefix)) {
            const token = parsed.pathname.slice(localMediaPrefix.length)
            const decoded = Buffer.from(token, 'base64url').toString('utf8')
            if (decoded) candidates.push(decoded)
          }
        } catch {
          // ignore non-url values
        }
      }
    }

    if (safeFileName && safeFileName !== '.' && safeFileName !== '..') {
      candidates.push(path.join(app.getPath('userData'), 'library-audio', safeFileName))
      candidates.push(path.join(app.getPath('appData'), 'Electron', 'library-audio', safeFileName))
    }

    const tried = []
    let deleted = false
    for (const candidate of candidates) {
      const normalized = path.resolve(String(candidate || ''))
      if (!normalized || tried.includes(normalized)) continue
      tried.push(normalized)
      if (!fs.existsSync(normalized)) continue
      try {
        fs.unlinkSync(normalized)
        deleted = true
      } catch {
        // try next candidate
      }
    }

    return { ok: true, deleted, tried }
  } catch (error) {
    return { ok: false, reason: String(error?.message || error || 'delete-local-track-file-failed') }
  }
})

ipcMain.handle('library:control-download', async (_, payload) => {
  const requestId = String(payload?.requestId || '').trim()
  const action = String(payload?.action || '').trim().toLowerCase()
  if (!requestId || (action !== 'pause' && action !== 'cancel')) {
    return { ok: false, reason: 'invalid-params' }
  }

  const control = libraryDownloadControls.get(requestId)
  if (!control?.controller) {
    return { ok: false, reason: 'not-active' }
  }

  control.status = action === 'pause' ? 'paused' : 'cancelled'
  try {
    control.controller.abort()
  } catch {
    // ignore abort errors
  }

  emitLibraryDownloadProgress({
    requestId,
    status: control.status,
    receivedBytes: 0,
    totalBytes: 0,
    title: control.title || '',
    artist: control.artist || '',
  })

  return { ok: true, status: control.status }
})

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    show: false,
    center: true,
    backgroundColor: '#0a1119',
    title: 'GLITCH Music',
    icon: getLogoPath(),
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: 'persist:ghxsty-music',
      // Arka plandayken renderer döngülerini kısarak CPU/RAM kullanımını düşür.
      backgroundThrottling: true,
    },
  })

  // Remove native app menu so Alt key does not reveal "File" menu on Windows.
  Menu.setApplicationMenu(null)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.removeMenu()

  const syncWindowLayoutState = () => {
    emitWindowLayoutState()
  }

  mainWindow.on('maximize', syncWindowLayoutState)
  mainWindow.on('unmaximize', syncWindowLayoutState)
  mainWindow.on('enter-full-screen', syncWindowLayoutState)
  mainWindow.on('leave-full-screen', syncWindowLayoutState)
  mainWindow.on('resize', syncWindowLayoutState)

  const syncRuntimeFrameRate = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return
    }
    const isForeground = mainWindow.isVisible() && mainWindow.isFocused() && !mainWindow.isMinimized()
    const lowCoreDevice = CPU_CORE_COUNT <= 4
    try {
      // Düşük çekirdekli cihazlarda foreground FPS'i bir miktar kısıp
      // arka planda çok daha agresif düşürerek CPU kullanımını azalt.
      if (isForeground) {
        mainWindow.webContents.setFrameRate(lowCoreDevice ? 45 : 60)
      } else {
        mainWindow.webContents.setFrameRate(1)
      }
    } catch {
      // ignore unsupported platforms/builds
    }
  }
  mainWindow.on('show', syncRuntimeFrameRate)
  mainWindow.on('hide', syncRuntimeFrameRate)
  mainWindow.on('focus', syncRuntimeFrameRate)
  mainWindow.on('blur', syncRuntimeFrameRate)
  mainWindow.on('minimize', syncRuntimeFrameRate)
  mainWindow.on('restore', syncRuntimeFrameRate)
  syncRuntimeFrameRate()



  mainWindow.on('close', (event) => {
    if (isQuitting || closeBehavior === 'quit') {
      return
    }

    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Main window loaded')
    emitWindowLayoutState()
    if (pendingDeepLinkPayload) {
      mainWindow?.webContents.send('app:deep-link', pendingDeepLinkPayload)
    }
  })

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const label = level === 3 ? 'ERROR' : level === 2 ? 'WARN' : 'LOG'
    console.log(`[Renderer ${label}] ${sourceId || 'unknown'}:${line || 0} -> ${message}`)
  })

  mainWindow.webContents.on('did-fail-load', (_, code, description, validatedURL) => {
    console.error('Main window failed to load:', code, description, validatedURL)
  })

  mainWindow.webContents.on('render-process-gone', (_, details) => {
    console.error('Renderer process gone:', details)
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!resetShortcutEnabled) {
      return
    }

    const isResetShortcut =
      input?.type === 'keyDown' &&
      Boolean(input?.control) &&
      Boolean(input?.shift) &&
      String(input?.key || '').toLowerCase() === 'r'

    if (!isResetShortcut) {
      return
    }

    event.preventDefault()
    performAppReset()
  })

  try {
    if (process.env.VITE_DEV_SERVER_URL) {
      const targetUrl = new URL('/', process.env.VITE_DEV_SERVER_URL)
      await mainWindow.loadURL(targetUrl.href)
    } else {
      await loadRendererFromBuild(mainWindow, 'index.html')
    }
  } catch (error) {
    console.error('Window load failed:', error)
    const win = mainWindow
    if (win && !win.isDestroyed()) {
      try {
        await win.loadURL('data:text/html;charset=utf-8,<html><body style="background:#0a1119;color:white;font-family:sans-serif;padding:24px;">Uygulama yuklenemedi. Terminal ciktisini kontrol et.</body></html>')
      } catch (fallbackError) {
        console.error('Window fallback load failed:', fallbackError)
      }
    }
  }

  if (!mainWindow.isDestroyed()) {
    mainWindow.show()
    mainWindow.focus()
  }
}

const createAppTray = () => {
  tray = new Tray(createTrayIcon())
  tray.setToolTip('GLITCH Music')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show', click: () => mainWindow?.show() },
      { label: 'Hide', click: () => mainWindow?.hide() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

const ensureDependenciesInstalled = async () => {
  const checkCommand = (cmd) => {
    try {
      const probe = process.platform === 'win32' ? 'where' : 'which'
      const result = spawnSync(probe, [cmd], { stdio: 'ignore', timeout: 3000 })
      return result.status === 0
    } catch {
      return false
    }
  }

  const missingDeps = []
  if (!checkCommand('yt-dlp')) missingDeps.push('yt-dlp')
  if (!checkCommand('ffmpeg')) missingDeps.push('ffmpeg')

  if (!missingDeps.length) {
    return { ok: true, reason: 'all-installed' }
  }
  // UI uyarısı renderer tarafında modal olarak gösterilir.
  return { ok: false, reason: 'missing-deps', missing: missingDeps }
}

app.whenReady().then(async () => {
  migrateLegacyUserDataIfNeeded()

  try {
    // Dev modda (npm start/electron .) protocol kaydı bazen yanlış argv ile
    // System32 gibi hatalı path'lere yazılabiliyor. Sadece paketli uygulamada kaydet.
    if (app.isPackaged) {
      app.setAsDefaultProtocolClient(APP_PROTOCOL)
    }
  } catch {
    // ignore protocol registration failures
  }

  const startupDeepLink = extractDeepLinkFromArgv(process.argv)
  if (startupDeepLink) {
    dispatchDeepLinkPayload(parseDeepLinkPayload(startupDeepLink))
  }

  await createWindow()
  createAppTray()
  syncLaunchOnStartupSetting()
  registerMediaShortcuts()
  setupAutoUpdater()
  resetUpdaterState()
  scheduleUpdateChecks()

  // Açılışta UI bloklanmasın: ağır başlangıç işleri arka plana alınır.
  setTimeout(() => {
    ensureDependenciesInstalled().catch(() => {})
    setupDiscordRichPresence().catch(() => {})
  }, 60)

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}).catch((error) => {
  console.error('App startup failed:', error)
})

app.on('window-all-closed', () => {
  if (closeBehavior === 'quit') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
  playbackActiveForPowerSave = false
  syncPlaybackPowerSaveBlocker()
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
  }
  try {
    globalShortcut.unregisterAll()
  } catch {
    // ignore global shortcut cleanup issues
  }
  try {
    if (rendererServer) {
      rendererServer.close()
    }
  } catch {
    // ignore
  }
})
