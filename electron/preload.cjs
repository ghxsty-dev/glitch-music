const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('novaPlayer', {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  setPresence: (presence) => ipcRenderer.send('presence:update', presence),
  updateAppSettings: (settings) => ipcRenderer.send('settings:update', settings),
  setWindowFullscreen: (nextState) => ipcRenderer.invoke('window:set-fullscreen', nextState),
  getWindowLayoutState: () => ipcRenderer.invoke('window:get-layout-state'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  toggleWindowMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onWindowLayoutState: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, state) => callback(state)
    ipcRenderer.on('window:layout-state', listener)
    return () => ipcRenderer.removeListener('window:layout-state', listener)
  },
  onMediaControl: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, command) => callback(command)
    ipcRenderer.on('media-control', listener)
    return () => ipcRenderer.removeListener('media-control', listener)
  },
  onLibraryDownloadProgress: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, payload) => callback(payload)
    ipcRenderer.on('library:download-progress', listener)
    return () => ipcRenderer.removeListener('library:download-progress', listener)
  },
  exportLibrary: (payload) => ipcRenderer.invoke('library:export', payload),
  downloadRemoteAsset: (payload) => ipcRenderer.invoke('library:download-remote', payload),
  downloadRemoteAssetToLibrary: (payload) => ipcRenderer.invoke('library:download-remote-to-library', payload),
  downloadRemoteCoverToLibrary: (payload) => ipcRenderer.invoke('library:download-cover-to-library', payload),
  downloadLinkToLibrary: (payload) => ipcRenderer.invoke('library:download-link-to-library', payload),
  searchYoutube: (payload) => ipcRenderer.invoke('library:search-youtube', payload),
  searchYtMusic: (payload) => ipcRenderer.invoke('library:search-ytmusic', payload),
  getYtMusicArtistAlbums: (payload) => ipcRenderer.invoke('library:artist-ytmusic-albums', payload),
  getYtMusicAlbumTracks: (payload) => ipcRenderer.invoke('library:ytmusic-album-tracks', payload),
  getYtMusicMoodPlaylists: () => ipcRenderer.invoke('library:ytmusic-mood-playlists'),
  getYtMusicSimilarPlaylists: (payload) => ipcRenderer.invoke('library:ytmusic-similar-playlists', payload),
  getYtMusicLatestRelease: (payload) => ipcRenderer.invoke('library:ytmusic-latest-release', payload),
  getYtMusicRandomMissingSong: (payload) => ipcRenderer.invoke('library:ytmusic-random-missing-song', payload),
  getYtMusicPlaylistTracks: (payload) => ipcRenderer.invoke('library:ytmusic-playlist-tracks', payload),
  fetchRemoteJson: (payload) => ipcRenderer.invoke('library:fetch-remote-json', payload),
  getYoutubeAuthStatus: () => ipcRenderer.invoke('youtube:auth-status'),
  connectYoutubeAccount: (payload) => ipcRenderer.invoke('youtube:connect', payload),
  disconnectYoutubeAccount: () => ipcRenderer.invoke('youtube:disconnect'),
  getYoutubePlaylists: () => ipcRenderer.invoke('youtube:list-playlists'),
  getYoutubePlaylistTracks: (payload) => ipcRenderer.invoke('youtube:list-playlist-tracks', payload),
  getSpotifyAuthStatus: () => ipcRenderer.invoke('spotify:auth-status'),
  connectSpotifyAccount: (payload) => ipcRenderer.invoke('spotify:connect', payload),
  disconnectSpotifyAccount: () => ipcRenderer.invoke('spotify:disconnect'),
  getSpotifyPlaylists: () => ipcRenderer.invoke('spotify:list-playlists'),
  getSpotifyPlaylistTracks: (payload) => ipcRenderer.invoke('spotify:list-playlist-tracks', payload),
  fetchLyricsFromYtMusic: (payload) => ipcRenderer.invoke('lyrics:fetch-ytmusic', payload),
  resolveLocalTrackUrls: (payload) => ipcRenderer.invoke('library:resolve-local-track-urls', payload),
  deleteLocalTrackFile: (payload) => ipcRenderer.invoke('library:delete-local-track-file', payload),
  controlDownload: (payload) => ipcRenderer.invoke('library:control-download', payload),
  getUpdaterState: () => ipcRenderer.invoke('updater:get-state'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  reportIssue: (payload) => ipcRenderer.invoke('report:issue', payload),
  restartApp: () => ipcRenderer.invoke('app:reset'),
  getPendingDeepLink: () => ipcRenderer.invoke('app:get-pending-deep-link'),
  copyText: (payload) => ipcRenderer.invoke('app:copy-text', payload),
  restoreLegacyData: () => ipcRenderer.invoke('data:restore-legacy'),
  factoryResetData: () => ipcRenderer.invoke('data:factory-reset'),
  listLocalLibraryFiles: () => ipcRenderer.invoke('data:list-local-library-files'),
  checkDependencies: () => ipcRenderer.invoke('check:dependencies'),
  autoInstallDependencies: () => ipcRenderer.invoke('dependencies:auto-install'),
  onUpdaterEvent: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, payload) => callback(payload)
    ipcRenderer.on('updater:event', listener)
    return () => ipcRenderer.removeListener('updater:event', listener)
  },
  onDeepLink: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_, payload) => callback(payload)
    ipcRenderer.on('app:deep-link', listener)
    return () => ipcRenderer.removeListener('app:deep-link', listener)
  },
})



