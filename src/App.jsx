import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  BarChart3,
  Bell,
  Bug,
  Check,
  Download,
  Disc,
  FileUp,
  Edit3,
  Settings,
  Forward,
  Heart,
  ImageIcon,
  Mic2,
  Repeat,
  ListMusic,
  ListOrdered,
  Link2,
  Lock,
  MoreVertical,
  GripVertical,
  Pause,
  Play,
  Plus,
  Shuffle,
  Rewind,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  RefreshCw,
  Pin,
  Youtube,
  UserRound,
  House,
  Volume2,
  Maximize2,
  Minimize2,
  Minus,
  Square,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  X,
} from 'lucide-react'
import './App.css'

const gradients = [
  'linear-gradient(135deg, #ff8a65 0%, #ff5e7a 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #60a5fa 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  'linear-gradient(135deg, #10b981 0%, #22c55e 100%)',
]

const playlistColors = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f87171',
  '#fca5a5',
  '#f97316',
  '#fb923c',
  '#fbbd08',
  '#eab308',
  '#facc15',
  '#fcd34d',
  '#84cc16',
  '#a3e635',
  '#bfdbfe',
  '#22c55e',
  '#4ade80',
  '#86efac',
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#14b8a6',
  '#2dd4bf',
  '#5eead4',
  '#06b6d4',
  '#22d3ee',
  '#67e8f9',
  '#0ea5e9',
  '#38bdf8',
  '#7dd3fc',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#6366f1',
  '#818cf8',
  '#c7d2fe',
  '#8b5cf6',
  '#a78bfa',
  '#ddd6fe',
  '#a855f7',
  '#c084fc',
  '#e9d5ff',
  '#d946ef',
  '#f0abfc',
  '#f5d0fe',
  '#ec4899',
  '#f472b6',
  '#fbbbf9',
  '#f43f5e',
  '#fb7185',
  '#fb91cf',
]

const equalizerBands = [
  { key: 'bass', label: 'Bas', type: 'lowshelf', frequency: 110, q: 0.7 },
  { key: 'lowMid', label: 'Alt', type: 'peaking', frequency: 340, q: 1.0 },
  { key: 'mid', label: 'Orta', type: 'peaking', frequency: 1200, q: 1.0 },
  { key: 'highMid', label: 'Net', type: 'peaking', frequency: 3200, q: 1.0 },
  { key: 'treble', label: 'Tiz', type: 'highshelf', frequency: 10500, q: 0.7 },
]

// Spotify-benzeri: düşüklerde daha kontrollü, üst seviyede daha hassas.
const VOLUME_TAPER_POWER = 1.9
const toAudioGain = (sliderValue) => {
  const x = Math.max(0, Math.min(1, Number(sliderValue) || 0))
  return Math.pow(x, VOLUME_TAPER_POWER)
}

const DB_NAME = 'nova-player-db'
const DB_VERSION = 1
const STORE_NAME = 'tracks'
const TRACK_SWITCH_COOLDOWN_MS = 1000
const TRACK_SWITCH_FADE_MS = 180
const UI_KEY = 'nova-player-ui'
const PLAYLISTS_KEY = 'nova-player-playlists'
const ARTIST_FACTS_KEY = 'nova-player-artist-facts'
const FAVORITES_KEY = 'nova-player-favorites'
const PINNED_TRACKS_KEY = 'nova-player-pinned'
const PLAY_STATS_KEY = 'nova-player-play-stats'
const LISTEN_HISTORY_KEY = 'nova-player-listen-history'
const DRIVE_MANIFEST_URL = import.meta.env.VITE_DRIVE_MANIFEST_URL?.trim() || ''
const DEFAULT_SHARED_MANIFEST_URL =
  'https://raw.githubusercontent.com/ghxsty-dev/glitch-music-pool/main/tracks.json'
const POOL_ADMIN_PASSWORD = 'ab56AB56!'
const API_BASE = import.meta.env.VITE_API_BASE?.trim() || 'http://127.0.0.1:8787'
const appLogo = `${import.meta.env.BASE_URL}logo.png`
const SHOW_DEPENDENCY_NOTICE = true
const APP_NAME = __APP_NAME__
const APP_VERSION = __APP_VERSION__
const HOME_LATEST_ROTATE_MS = 120000
const HOME_LATEST_RELEASE_CACHE_KEY = 'nova-player-home-latest-release'
const HOME_MOOD_PLAYLISTS_CACHE_KEY = 'nova-player-home-mood-playlists'
const LYRICS_TEMP_DISABLED_NOTICE =
  'Bir sonraki güncellemeye kadar kullanılamıyor. Lütfen yeni güncellemeyi bekleyin.'
const LYRICS_TEMP_DISABLED = false
const LYRICS_SEARCH_TIMEOUT_MS = 20000
const UI_LANGUAGES = ['tr', 'en']
const UI_TEXT = {
  tr: {
    library: 'Kütüphane',
    tracks: 'Parçalar',
    add: 'Ekle',
    playlists: 'Playlistler',
    create: 'Oluştur',
    allTracks: 'Tüm parçalar',
    favorites: 'Favoriler',
    serverTracks: 'Sunucudakiler',
    publicPool: 'Müzik Havuzu',
    noPlaylistYet: 'Henüz playlist yok',
    totalTracksReady: '',
    noTracksYet: 'Henüz parça yok',
    noTracksHint: 'Dosya ya da link ekleyince burada temiz bir liste halinde görünecek.',
    noResults: 'Sonuç bulunamadı',
    noResultsHint: 'Arama veya indirilebilir filtresini değiştirip tekrar dene.',
    searchPlaceholder: 'Şarkı, sanatçı veya albüm ara',
    onlyDownloadable: 'Sadece indirilebilir şarkıları göster',
    sharedSongs: 'Ortak şarkılar',
    remoteManifestLoaded: '{count} ortak şarkı uzak manifest dosyasından çekiliyor.',
    remoteManifestMissing: 'Henüz uzak manifest URL girilmedi.',
    importAllToLibrary: 'Tümünü kütüphaneme ekle',
    uploadToPool: 'Müzik Havuzu\'na Yükle',
    uploadToPoolHint: 'Şarkını kütüphanede başkalarının bulup indireceği havuza yükle.',
    poolFileName: 'Şarkı dosyası',
    poolCoverImage: 'Kapak resmi (isteğe bağlı)',
    settings: 'Ayarlar',
    appSettings: 'Uygulama ayarları',
    close: 'Kapat',
    audioOutput: 'Ses çıkışı',
    audioOutputHint: 'Buradan hoparlör, kulaklık ya da sanal çıkış aygıtını seçebilirsin.',
    outputNotSupported: 'Bu cihazda desteklenmiyor',
    outputNotFound: 'Çıkış aygıtı bulunamadı',
    equalizer: 'Ekolayzer',
    equalizerHint: 'Frekansları hafifçe yükseltip azaltarak sesi şekillendirebilirsin.',
    reset: 'Sıfırla',
    theme: 'Tema',
    themeHint: 'Arayüz görünümünü seç.',
    dark: 'Koyu',
    gray: 'Grimsi',
    light: 'Açık',
    transparent: 'Şeffaf',
    customTheme: 'Özel renk',
    customThemeHint: 'Koyu, gri ve açık dışında kendi ana rengini seç.',
    themeColor: 'Tema rengi',
    options: 'Ayarlar',
    optionsHint: 'Kullanım seçeneklerini buradan açıp kapat.',
    system: 'Sistem',
    console: 'Konsol',
    systemOptions: 'Sistem ayarları',
    systemOptionsHint: 'Genel kullanım ve oynatma davranışlarını buradan yönet.',
    preventSleepWhilePlaying: 'Şarkı çalarken ekranı açık tut ve uyku modunu engelle',
    launchOnStartup: 'Bilgisayar açıldığında uygulamayı otomatik başlat',
    monoAudio: 'Sesi mono olarak çal',
    spaceShortcut: 'Boşluk tuşu ile çal/duraklat',
    arrowShortcut: 'Ok tuşlarıyla 5 sn ileri/geri sar',
    resetShortcut: 'Acil reset kısayolu (Ctrl + Shift + R)',
    mediaShortcut: 'Global çal/duraklat kısayolu',
    mediaShortcutHint: 'Örnek: Ctrl+Alt+P. Boş bırakırsan kapalı olur.',
    closeMode: 'Kapatma',
    closeModeHint: 'Kapat tuşuna basınca uygulamanın ne yapacağını seç.',
    closeTray: 'Arka planda kalsın',
    closeQuit: 'Tamamen kapansın',
    export: 'Dışa aktarma',
    exportHint: 'Tüm şarkıları ve mevcut kapakları klasöre indir.',
    exportStart: 'Müzikleri ve kapakları indir',
    exporting: 'Hazırlanıyor...',
    resetCache: 'Önbelleği sıfırla',
    resetCacheHint: 'Kapak, albüm, söz ve sanatçı bilgisini temizler. Şarkıların silinmez.',
    resetCacheDone: 'Önbellek temizlendi.',
    factoryReset: 'Tüm uygulama verilerini sil',
    factoryResetHint: 'Şarkılar, kapaklar, ayarlar, önbellek ve tüm yerel veriler kalıcı olarak silinir.',
    confirmFactoryResetTitle: 'Fabrika ayarına dön',
    confirmFactoryResetBody: 'Tüm uygulama verileri kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istediğine emin misin?',
    restoreLegacyData: 'Eski veriyi geri yükle',
    restoreLegacyDataHint: 'Önceki sürüm klasörlerinden şarkı verilerini geri almayı dener.',
    sharedSource: 'Ortak kaynak',
    sharedSourceHint: 'Yan bilgisayardaki tracks.json linkini gir. Buradaki şarkılar herkes tarafından görülebilir.',
    remoteManifestUrl: 'Uzak manifest URL',
    remoteManifestExample: 'Örnek: ağda açtığın küçük bir HTTP sunucu üzerinden tracks.json.',
    remoteManifestRelative: 'Manifest içinde audioFile/coverFile kullanırsan URL yazmadan dosya yoluyla ekleyebilirsin. (Örn: songs/parca.mp3)',
    notes: 'Not',
    noteLocal: 'Playlist ve favori durumları yerelde saklanır.',
    noteResume: 'Uygulama son çalınan parçayı ve konumu hatırlar.',
    language: 'Dil',
    languageHint: 'Arayüz dilini değiştir.',
    turkish: 'Türkçe',
    english: 'English',
    hardwareAcceleration: 'Donanım hızlandırma',
    hardwareAccelerationHint: 'Kapattığında uygulama yeniden başlatma ister.',
    fullscreenEffects: 'Tam ekran efektleri',
    fullscreenEffectsHint: 'Gradyan, animasyon ve görsel efektleri aç/kapat.',
    appearanceOptions: 'Görünüm seçenekleri',
    appearanceOptionsHint: 'Görünüm ve kaydırma tercihlerini tek yerden yönet.',
    reduceAnimations: 'Animasyonları azalt',
    reduceAnimationsHint: 'Arayüz geçişlerini ve hareketli efektleri sadeleştirir.',
    lowPowerMode: 'Performans modu',
    lowPowerModeHint: 'Blur, gölge ve cam efektlerini azaltarak daha stabil çalıştırır.',
    compactList: 'Kompakt liste görünümü',
    compactListHint: 'Şarkı satırlarını daha sıkı göstererek ekrana daha fazla parça sığdırır.',
    showScrollbars: 'Kaydırma çubuğunu göster',
    showScrollbarsHint: 'Kapalıyken kaydırma çubukları gizlenir, açıkken görünür olur.',
    notifications: 'Bildirimler',
    clearAllNotifications: 'Tümünü temizle',
    noNotifications: 'Henüz bildirim yok',
    backgroundStyle: 'Arka plan stili',
    backgroundStyleHint: 'Arka planı düz renk veya gradyan olarak ayarlayabilirsin.',
    backgroundSolid: 'Düz renk',
    backgroundGradient: 'Gradyan',
    backgroundColor1: 'Renk 1',
    backgroundColor2: 'Renk 2',
    coverBasedBackground: 'Kapak rengine göre arka plan',
    coverBasedBackgroundHint: 'Açıkken arka plan gradyanı çalan şarkının kapak tonundan üretilir.',
    noteShared: 'Müzik havuzu yalnızca Yenile tuşuna bastığında güncellenir.',
    noteExport: 'Dışa aktarma, ses ve kapakları tek klasörde yedekler.',
    noteResetShortcut: 'Acil reset kısayolu: Ctrl + Shift + R',
    noteAppVersion: '{app} sürümü: v{version}',
    confirmDeleteTrackTitle: 'Şarkıyı sil',
    confirmDeleteTrackBody: '"{name}" parçasını silmek istediğine emin misin?',
    confirmDeletePlaylistTitle: 'Playlisti sil',
    confirmDeletePlaylistBody: '"{name}" playlistini silmek istediğine emin misin?',
    confirmResetCacheTitle: 'Önbelleği sıfırla',
    confirmResetCacheBody: 'Önbelleği temizlemek istediğine emin misin? Şarkılar silinmez.',
    deleteAction: 'Sil',
    cancelAction: 'Vazgeç',
    resetAction: 'Sıfırla',
    firstRun: 'İlk kurulum',
    firstRunStep: 'Adım {current}/{total}',
    firstRunHelpersTitle: '1. Yardımcı uygulamalar kontrolü',
    firstRunHelpersHint:
      'yt-dlp, ffmpeg, python ve ytmusicapi bileşenleri kontrol edilir. Eksikse otomatik kurulum başlatabilirsin.',
    firstRunAllReady: 'Tümü hazır',
    recheck: 'Yeniden kontrol et',
    autoInstall: 'Otomatik indir/kur',
    checking: 'Kontrol ediliyor...',
    continue: 'Devam et',
    back: 'Geri',
    finish: 'Bitir',
    firstRunThemeTitle: '2. Tema seçimi',
    firstRunLanguageTitle: 'Dil',
    firstRunCloseTitle: '3. Kapatma davranışı',
    firstRunAnimationTitle: 'Animasyon',
    normal: 'Normal',
    reduced: 'Azaltılmış',
    dependencyTitle: 'Eksik bağımlılıklar bulundu',
    dependencyHint:
      'Uygulamada indirme ve YouTube Music arama özellikleri için aşağıdaki araçlar gerekli:',
    pasteCommandHint: 'Aşağıdakini kopyalayıp CMD/PowerShell’e yapıştır:',
    autoInstallRunning: 'Eksik bileşenler otomatik kuruluyor...',
    autoInstallFailed: 'Otomatik kurulum tamamlanamadı: {reason}',
    autoInstallDone: 'Otomatik kurulum adımları tamamlandı.',
    autoInstallWaiting: 'Otomatik kurulum bekleniyor.',
    installCommandsCopied: 'Kurulum komutları panoya kopyalandı.',
    copyFailed: 'Kopyalama başarısız oldu.',
    copyCommands: 'Komutları kopyala',
    welcome: 'Hoş geldin',
    firstRunIntro:
      'İlk kurulumda tema, dil ve kapanış davranışını ayarlayalım. Yardımcı modüller eksikse uygulama içinde ayrı menüde göstereceğiz.',
    on: 'Açık',
    off: 'Kapalı',
    searchFilter: 'Arama filtresi',
    searchYoutube: "YouTube'da ara",
    searching: 'Aranıyor...',
    backToResults: 'Sonuçlara dön',
    artist: 'Sanatçı',
    artists: 'Sanatçılar',
    album: 'Albüm',
    albums: 'Albümler',
    songs: 'Şarkılar',
    otherArtists: 'Diğer sanatçılar',
    otherAlbums: 'Diğer albümler',
    unknownArtist: 'Bilinmeyen sanatçı',
    unknownTrack: 'Bilinmeyen parça',
    unknownContent: 'Bilinmeyen içerik',
    open: 'Aç',
    loaded: 'Yüklü',
    downloading: 'İndiriliyor...',
    download: 'İndir',
    home: 'Ana menü',
    reportIssue: 'Hata bildir',
    statistics: 'İstatistikler',
    downloads: 'İndirilenler',
    minimize: 'Simge durumuna küçült',
    restore: 'Geri yükle',
    maximize: 'Büyüt',
    updateReady: 'Güncelleme hazır',
    updateDownloading: 'Güncelleme indiriliyor',
    updateAvailable: 'Yeni sürüm bulundu',
    updateStatus: 'Güncelleme durumu',
    installAndRestart: 'Kur ve yeniden başlat',
    downloadAndRestart: 'İndir ve yeniden başlat',
    checkAgain: 'Tekrar kontrol et',
    dropMusicTitle: 'Müziği bırak, otomatik ekleyelim',
    dropMusicHint: 'MP3 ve diğer ses dosyaları desteklenir.',
    lyricsDisabledNotice: LYRICS_TEMP_DISABLED_NOTICE,
    selectedCollection: 'Seçili koleksiyon',
    collection: 'Koleksiyon',
    totalDuration: 'Toplam süre',
    recommendationSearching: 'Öneri aranıyor...',
    recommendationNotFound: 'Öneri bulunamadı',
    noArtist: 'Sanatçı yok',
    scrollLeft: 'Sola kaydır',
    scrollRight: 'Sağa kaydır',
    expand: 'Genişlet',
    collapse: 'Küçült',
    coverAlt: 'kapak',
    playlistCoverAlt: 'Playlist kapağı',
    specialPlaylists: 'Özel playlistler',
    songsCount: '{count} şarkı',
    artistCount: '{count} sanatçı',
    trackCount: '{count} parça',
    downloadedOnly: 'İndirdiklerimi gizle',
    poolArtists: 'Sanatçılar',
    poolArtistHint: 'Havuzdaki parçaları sanatçıya göre filtrele',
    allArtists: 'Tüm şarkıcılar',
    selectedArtist: 'Seçili sanatçı',
    shownTracks: 'Gösterilen şarkı',
    totalPool: 'Toplam havuz',
    refreshPool: 'Müzik havuzunu yenile',
    downloadAll: 'Hepsini indir',
    downloadSelected: 'Seçileni indir',
    bulkEdit: 'Toplu düzenle',
    editPlaylist: "Playlist'i düzenle",
    addSongsToPlaylist: "Playlist'e şarkı ekle",
    play: 'Çal',
    shufflePlay: 'Karışık çal',
    playPlaylistInOrder: 'Playlisti sırayla çal',
    playPlaylistShuffled: 'Playlisti karışık çal',
    noSongsYet: 'Henüz şarkı yok',
    addFileOrDrive: 'Dosya veya Drive bağlantısı ekleyebilirsin.',
    goAllTracksAdd: 'Tüm parçalara git ve şarkı ekle',
    order: 'Sıra',
    dragToSort: 'Sıralamak için sürükle',
    cannotReorder: 'Bu şarkının sırası değiştirilemez',
    clickCoverToPlay: 'Kapağa tıklayarak oynat',
    downloadAndAddToLibrary: 'İndir ve Kütüphaneye ekle',
    added: 'Eklendi',
    adding: 'Ekleniyor...',
    trackMenu: 'Parça menüsü',
    queue: 'Sıradaki liste',
    removeFavorite: 'Favoriden çıkar',
    addFavorite: 'Favorilere ekle',
    shrinkPlayer: 'Playerı küçült',
    trackCoverAlt: 'Parça kapağı',
    artistInfo: 'Sanatçı bilgisi',
    albumDetails: 'Albüm detayları',
    queueReadyHint: 'Sıra hazır olduğunda burada görünecek.',
    lyrics: 'Sözler',
    about: 'Hakkında',
    artistInfoLoading: 'Sanatçı bilgisi çekiliyor...',
    artistInfoNotFound: 'Sanatçı bilgisi bulunamadı.',
    artistImageAlt: 'Sanatçı görseli',
    noArtistImage: 'Sanatçı görseli yok',
    lyricsLoading: 'Sözler yükleniyor...',
    lyricsNotFound: 'Sözler bulunamadı.',
    uploadTxt: 'TXT yükle',
    retrySearch: 'Tekrar ara',
    shuffle: 'Karıştır',
    shuffleOnTitle: 'Karıştır açık (kapat)',
    shuffleOffTitle: 'Karıştır aç',
    restart: 'Başa al',
    restartTrack: 'Şarkıyı başa sar',
    pause: 'Duraklat',
    playTrack: 'Şarkıyı oynat',
    pausePlayback: 'Çalmayı duraklat',
    next: 'Sonraki',
    nextTrack: 'Sonraki şarkıya geç',
    repeatOne: 'Aynı şarkıyı tekrarla',
    repeatOnTitle: 'Tekrar açık (kapat)',
    repeatOffTitle: 'Tekrar aç',
    edit: 'Düzenle',
    editing: 'Düzenleme',
    trackInfo: 'Parça bilgisi',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    saveAll: 'Tümünü kaydet',
    coverPreview: 'Kapak önizleme',
    changeCover: 'Kapağı değiştir',
    removeCover: 'Kapağı sil',
    trackTitle: 'Şarkı adı',
    title: 'Başlık',
    albumName: 'Albüm adı',
    albumPlaceholder: 'Albüm adı (yoksa Single)',
    coverFile: 'Kapak dosyası',
    willRemove: 'Kaldırılacak',
    notSelected: 'Seçilmedi',
    selected: 'Seçildi',
    chooseTrackToEdit: 'Bir parçayı seçip sağ üstteki düzenle butonuyla değişiklik yapabilirsin',
    openRightPlayer: 'Sağ playerı aç',
    toTop: 'En üste çık',
    fullscreenCoverPreview: 'Kapak önizleme',
    upNext: 'Sıradaki',
    queueTitle: 'Çalma listesi',
    nowPlaying: 'Şu anda çalan',
    noNextTrack: 'Sıradaki parça yok.',
    toggleLyrics: 'Şarkı sözlerini aç/kapat',
    toggleQueue: 'Sıradaki listeyi aç/kapat',
    bulkEditTitle: 'Şarkıları toplu düzenle',
    bulkEditHint: 'İsim, sanatçı ve albüm bilgisini düzenle. Kapağa tıklayıp değiştir veya sil.',
    coverOptions: 'Kapak seçenekleri',
    deleteInBulk: 'Bu şarkıyı toplu kayıtta sil',
    playlistName: 'Playlist adı',
    playlistNamePlaceholder: 'Örneğin: Gece listesi',
    description: 'Açıklama',
    playlistDescriptionPlaceholder: 'Playlist açıklaması',
    coverImage: 'Kapak görseli',
    addCover: 'Kapak ekle',
    txtSelectImport: 'TXT seç ve aktar',
    importing: 'Aktarılıyor...',
    txtImportReview: 'TXT Aktarım Kontrolü',
    addedSongs: 'Eklenen şarkılar',
    removeFromPlaylist: 'Bu şarkıyı playlistten çıkar',
    emptyImportReview: 'Henüz eklenen şarkı yok. Aktarım başlayınca burada canlı görünür.',
    editPlaylistTitle: 'Playlist düzenle',
    noSong: 'Şarkı yok',
    closeQueuePanel: 'Sıradaki paneli kapat',
    dragQueue: 'Sırayı değiştirmek için sürükle',
    noMoreQueue: 'Sırada başka şarkı yok.',
    favorite: 'Favorile',
    unpin: 'Sabitlemeyi kaldır',
    pin: 'Sabitle',
    youtubeSearch: "YouTube'da ara",
    copyShareLink: 'Paylaşım linkini kopyala',
    setAsNext: 'Bir sonraki olarak ayarla',
    addToPlaylist: 'Playliste ekle',
  },
  en: {
    library: 'Library',
    tracks: 'Tracks',
    add: 'Add',
    playlists: 'Playlists',
    create: 'Create',
    allTracks: 'All tracks',
    favorites: 'Favorites',
    serverTracks: 'Server tracks',
    publicPool: 'Music Pool',
    noPlaylistYet: 'No playlist yet',
    totalTracksReady: '{count} tracks ready. Use Add to include files or links.',
    noTracksYet: 'No tracks yet',
    noTracksHint: 'Once you add a file or link, tracks will appear here.',
    noResults: 'No results found',
    noResultsHint: 'Try changing your search or downloadable filter.',
    searchPlaceholder: 'Search by track, artist, or album',
    onlyDownloadable: 'Show only downloadable tracks',
    sharedSongs: 'Shared songs',
    remoteManifestLoaded: '{count} shared songs loaded from remote manifest.',
    remoteManifestMissing: 'No remote manifest URL provided yet.',
    importAllToLibrary: 'Add all to my library',
    uploadToPool: 'Upload to Music Pool',
    uploadToPoolHint: 'Upload your song to the pool so others can find and download it.',
    poolFileName: 'Song file',
    poolCoverImage: 'Cover image (optional)',
    settings: 'Settings',
    appSettings: 'App settings',
    close: 'Close',
    audioOutput: 'Audio output',
    audioOutputHint: 'Choose speaker, headset, or virtual output.',
    outputNotSupported: 'Not supported on this device',
    outputNotFound: 'No output device found',
    equalizer: 'Equalizer',
    equalizerHint: 'Shape the sound by boosting or lowering frequencies.',
    reset: 'Reset',
    theme: 'Theme',
    themeHint: 'Choose the interface look.',
    dark: 'Dark',
    gray: 'Gray',
    light: 'Light',
    transparent: 'Transparent',
    customTheme: 'Custom color',
    customThemeHint: 'Pick your own main color beyond dark, gray and light.',
    themeColor: 'Theme color',
    options: 'Options',
    optionsHint: 'Toggle app behavior options.',
    system: 'System',
    console: 'Console',
    systemOptions: 'System settings',
    systemOptionsHint: 'Manage general behavior and playback actions here.',
    preventSleepWhilePlaying: 'Keep screen awake and block sleep while music is playing',
    launchOnStartup: 'Launch app automatically when computer starts',
    monoAudio: 'Play audio in mono',
    spaceShortcut: 'Space to play/pause',
    arrowShortcut: 'Arrow keys seek 5 seconds',
    resetShortcut: 'Emergency reset shortcut (Ctrl + Shift + R)',
    mediaShortcut: 'Global play/pause shortcut',
    mediaShortcutHint: 'Example: Ctrl+Alt+P. Leave empty to disable.',
    closeMode: 'On close',
    closeModeHint: 'Choose what happens when you close the app.',
    closeTray: 'Keep running in background',
    closeQuit: 'Quit completely',
    export: 'Export',
    exportHint: 'Export all tracks and covers to a folder.',
    exportStart: 'Export music and covers',
    exporting: 'Preparing...',
    resetCache: 'Reset cache',
    resetCacheHint: 'Clears cover, album, lyrics and artist caches. Tracks are kept.',
    resetCacheDone: 'Cache cleared.',
    factoryReset: 'Delete all app data',
    factoryResetHint: 'Tracks, covers, settings, cache and all local data will be permanently deleted.',
    confirmFactoryResetTitle: 'Factory reset',
    confirmFactoryResetBody: 'All application data will be permanently deleted. This action cannot be undone. Continue?',
    restoreLegacyData: 'Restore legacy data',
    restoreLegacyDataHint: 'Tries to recover song data from older app folders.',
    sharedSource: 'Shared source',
    sharedSourceHint: 'Paste the tracks.json URL from your other PC. Everyone can access these songs.',
    remoteManifestUrl: 'Remote manifest URL',
    remoteManifestExample: 'Example: tracks.json served by a local HTTP server.',
    remoteManifestRelative: 'You can use audioFile/coverFile in manifest to avoid writing full URLs. (e.g. songs/track.mp3)',
    notes: 'Notes',
    noteLocal: 'Playlist and favorite state is stored locally.',
    noteResume: 'The app remembers last track and position.',
    language: 'Language',
    languageHint: 'Change interface language.',
    turkish: 'Türkçe',
    english: 'English',
    hardwareAcceleration: 'Hardware acceleration',
    hardwareAccelerationHint: 'Changing this may require an app restart.',
    fullscreenEffects: 'Fullscreen effects',
    fullscreenEffectsHint: 'Toggle gradients, animation and visual effects.',
    appearanceOptions: 'Appearance options',
    appearanceOptionsHint: 'Manage appearance and scrolling preferences in one place.',
    reduceAnimations: 'Reduce animations',
    reduceAnimationsHint: 'Simplifies motion effects and interface transitions.',
    lowPowerMode: 'Performance mode',
    lowPowerModeHint: 'Reduces blur, shadows and glass effects for smoother usage.',
    compactList: 'Compact list view',
    compactListHint: 'Makes track rows denser so more songs fit on screen.',
    showScrollbars: 'Show scrollbars',
    showScrollbarsHint: 'When off, scrollbars stay hidden; when on, they are visible.',
    notifications: 'Notifications',
    clearAllNotifications: 'Clear all',
    noNotifications: 'No notifications yet',
    backgroundStyle: 'Background style',
    backgroundStyleHint: 'Set the app background as a solid color or gradient.',
    backgroundSolid: 'Solid',
    backgroundGradient: 'Gradient',
    backgroundColor1: 'Color 1',
    backgroundColor2: 'Color 2',
    coverBasedBackground: 'Cover-based background',
    coverBasedBackgroundHint: 'When enabled, the background gradient is generated from the current track cover tone.',
    noteShared: 'Pool tracks refresh only when you press the Refresh button.',
    noteExport: 'Export creates a backup folder with audio and cover files.',
    noteResetShortcut: 'Emergency reset shortcut: Ctrl + Shift + R',
    noteAppVersion: '{app} version: v{version}',
    confirmDeleteTrackTitle: 'Delete track',
    confirmDeleteTrackBody: 'Are you sure you want to delete "{name}"?',
    confirmDeletePlaylistTitle: 'Delete playlist',
    confirmDeletePlaylistBody: 'Are you sure you want to delete "{name}"?',
    confirmResetCacheTitle: 'Reset cache',
    confirmResetCacheBody: 'Are you sure you want to clear cache? Tracks will be kept.',
    deleteAction: 'Delete',
    cancelAction: 'Cancel',
    resetAction: 'Reset',
    firstRun: 'First setup',
    firstRunStep: 'Step {current}/{total}',
    firstRunHelpersTitle: '1. Helper tools check',
    firstRunHelpersHint:
      'yt-dlp, ffmpeg, python and ytmusicapi are checked. If missing, you can start automatic install.',
    firstRunAllReady: 'All ready',
    recheck: 'Check again',
    autoInstall: 'Auto install',
    checking: 'Checking...',
    continue: 'Continue',
    back: 'Back',
    finish: 'Finish',
    firstRunThemeTitle: '2. Theme selection',
    firstRunLanguageTitle: 'Language',
    firstRunCloseTitle: '3. Close behavior',
    firstRunAnimationTitle: 'Animation',
    normal: 'Normal',
    reduced: 'Reduced',
    dependencyTitle: 'Missing dependencies found',
    dependencyHint:
      'The following tools are required for download and YouTube Music search features in the app:',
    pasteCommandHint: 'Copy and run this in CMD/PowerShell:',
    autoInstallRunning: 'Missing components are being installed automatically...',
    autoInstallFailed: 'Automatic install could not complete: {reason}',
    autoInstallDone: 'Automatic install steps are complete.',
    autoInstallWaiting: 'Waiting for automatic install.',
    installCommandsCopied: 'Install commands copied to clipboard.',
    copyFailed: 'Copy failed.',
    copyCommands: 'Copy commands',
    welcome: 'Welcome',
    firstRunIntro:
      'Let’s choose your theme, language, and close behavior. If helper tools are missing, the app will show them in a separate in-app panel.',
    on: 'On',
    off: 'Off',
    searchFilter: 'Search filter',
    searchYoutube: 'Search YouTube',
    searching: 'Searching...',
    backToResults: 'Back to results',
    artist: 'Artist',
    artists: 'Artists',
    album: 'Album',
    albums: 'Albums',
    songs: 'Songs',
    otherArtists: 'Other artists',
    otherAlbums: 'Other albums',
    unknownArtist: 'Unknown artist',
    unknownTrack: 'Unknown track',
    unknownContent: 'Unknown content',
    open: 'Open',
    loaded: 'Added',
    downloading: 'Downloading...',
    download: 'Download',
    home: 'Home',
    reportIssue: 'Report issue',
    statistics: 'Statistics',
    downloads: 'Downloads',
    minimize: 'Minimize',
    restore: 'Restore',
    maximize: 'Maximize',
    updateReady: 'Update ready',
    updateDownloading: 'Downloading update',
    updateAvailable: 'New version found',
    updateStatus: 'Update status',
    installAndRestart: 'Install and restart',
    downloadAndRestart: 'Download and restart',
    checkAgain: 'Check again',
    dropMusicTitle: 'Drop music to add it automatically',
    dropMusicHint: 'MP3 and other audio files are supported.',
    lyricsDisabledNotice: 'Lyrics are unavailable until the next update. Please wait for the new version.',
    selectedCollection: 'Selected collection',
    collection: 'Collection',
    totalDuration: 'Total duration',
    recommendationSearching: 'Finding a recommendation...',
    recommendationNotFound: 'No recommendation found',
    noArtist: 'No artist',
    scrollLeft: 'Scroll left',
    scrollRight: 'Scroll right',
    expand: 'Expand',
    collapse: 'Collapse',
    coverAlt: 'cover',
    playlistCoverAlt: 'Playlist cover',
    specialPlaylists: 'Special playlists',
    songsCount: '{count} songs',
    artistCount: '{count} artists',
    trackCount: '{count} tracks',
    downloadedOnly: 'Hide downloaded',
    poolArtists: 'Artists',
    poolArtistHint: 'Filter pool tracks by artist',
    allArtists: 'All artists',
    selectedArtist: 'Selected artist',
    shownTracks: 'Shown tracks',
    totalPool: 'Total pool',
    refreshPool: 'Refresh music pool',
    downloadAll: 'Download all',
    downloadSelected: 'Download selected',
    bulkEdit: 'Bulk edit',
    editPlaylist: 'Edit playlist',
    addSongsToPlaylist: 'Add songs to playlist',
    play: 'Play',
    shufflePlay: 'Shuffle play',
    playPlaylistInOrder: 'Play playlist in order',
    playPlaylistShuffled: 'Shuffle playlist',
    noSongsYet: 'No songs yet',
    addFileOrDrive: 'You can add a file or Drive link.',
    goAllTracksAdd: 'Go to All tracks and add songs',
    order: 'Order',
    dragToSort: 'Drag to reorder',
    cannotReorder: 'This track cannot be reordered',
    clickCoverToPlay: 'Click cover to play',
    downloadAndAddToLibrary: 'Download and add to library',
    added: 'Added',
    adding: 'Adding...',
    trackMenu: 'Track menu',
    queue: 'Queue',
    removeFavorite: 'Remove from favorites',
    addFavorite: 'Add to favorites',
    shrinkPlayer: 'Shrink player',
    trackCoverAlt: 'Track cover',
    artistInfo: 'Artist info',
    albumDetails: 'Album details',
    queueReadyHint: 'The queue will appear here when ready.',
    lyrics: 'Lyrics',
    about: 'About',
    artistInfoLoading: 'Loading artist info...',
    artistInfoNotFound: 'Artist info not found.',
    artistImageAlt: 'Artist image',
    noArtistImage: 'No artist image',
    lyricsLoading: 'Loading lyrics...',
    lyricsNotFound: 'Lyrics not found.',
    uploadTxt: 'Upload TXT',
    retrySearch: 'Search again',
    shuffle: 'Shuffle',
    shuffleOnTitle: 'Shuffle is on (turn off)',
    shuffleOffTitle: 'Turn shuffle on',
    restart: 'Restart',
    restartTrack: 'Restart track',
    pause: 'Pause',
    playTrack: 'Play track',
    pausePlayback: 'Pause playback',
    next: 'Next',
    nextTrack: 'Skip to next track',
    repeatOne: 'Repeat this track',
    repeatOnTitle: 'Repeat is on (turn off)',
    repeatOffTitle: 'Turn repeat on',
    edit: 'Edit',
    editing: 'Editing',
    trackInfo: 'Track info',
    save: 'Save',
    saving: 'Saving...',
    saveAll: 'Save all',
    coverPreview: 'Cover preview',
    changeCover: 'Change cover',
    removeCover: 'Remove cover',
    trackTitle: 'Track title',
    title: 'Title',
    albumName: 'Album',
    albumPlaceholder: 'Album name (Single if empty)',
    coverFile: 'Cover file',
    willRemove: 'Will be removed',
    notSelected: 'Not selected',
    selected: 'Selected',
    chooseTrackToEdit: 'Select a track and use the edit button in the top right to change it',
    openRightPlayer: 'Open right player',
    toTop: 'Back to top',
    fullscreenCoverPreview: 'Cover preview',
    upNext: 'Up next',
    queueTitle: 'Play queue',
    nowPlaying: 'Now playing',
    noNextTrack: 'No next track.',
    toggleLyrics: 'Toggle lyrics',
    toggleQueue: 'Toggle queue',
    bulkEditTitle: 'Bulk edit songs',
    bulkEditHint: 'Edit title, artist, and album. Click the cover to change or remove it.',
    coverOptions: 'Cover options',
    deleteInBulk: 'Delete this track in bulk save',
    playlistName: 'Playlist name',
    playlistNamePlaceholder: 'Example: Night list',
    description: 'Description',
    playlistDescriptionPlaceholder: 'Playlist description',
    coverImage: 'Cover image',
    addCover: 'Add cover',
    txtSelectImport: 'Select and import TXT',
    importing: 'Importing...',
    txtImportReview: 'TXT import review',
    addedSongs: 'Added songs',
    removeFromPlaylist: 'Remove this song from playlist',
    emptyImportReview: 'No songs added yet. Live results will appear here when import starts.',
    editPlaylistTitle: 'Edit playlist',
    noSong: 'No song',
    closeQueuePanel: 'Close queue panel',
    dragQueue: 'Drag to reorder queue',
    noMoreQueue: 'No other songs in queue.',
    favorite: 'Favorite',
    unpin: 'Unpin',
    pin: 'Pin',
    youtubeSearch: 'Search on YouTube',
    copyShareLink: 'Copy share link',
    setAsNext: 'Set as next',
    addToPlaylist: 'Add to playlist',
  },
}

const formatTime = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const formatListenDuration = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 dk'
  }

  const total = Math.floor(value)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  if (hours > 0) {
    return `${hours} sa ${minutes.toString().padStart(2, '0')} dk`
  }

  if (minutes > 0) {
    return `${minutes} dk ${seconds.toString().padStart(2, '0')} sn`
  }

  return `${seconds} sn`
}

const formatCollectionDuration = (value, language = 'tr') => {
  if (!Number.isFinite(value) || value <= 0) {
    return language === 'en' ? '0 min 0 sec' : '0 dakika 0 saniye'
  }

  const total = Math.floor(value)
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  if (language === 'en') {
    return `${minutes} min ${seconds} sec`
  }

  return `${minutes} dakika ${seconds} saniye`
}

const formatBytes = (value) => {
  const bytes = Number(value || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB'
  }

  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(mb >= 100 ? 0 : mb >= 10 ? 1 : 2)} MB`
}

const getTrackSortValue = (track, fallbackIndex = 0) =>
  Number.isFinite(track?.order)
    ? track.order
    : Number.isFinite(track?.createdAt)
      ? track.createdAt
      : fallbackIndex

const sortTracksByOrder = (list) =>
  list
    .map((track, index) => ({ track, index }))
    .sort(
      (left, right) =>
        getTrackSortValue(left.track, left.index) - getTrackSortValue(right.track, right.index),
    )
    .map(({ track }) => track)

const LEADING_TRACK_TOKEN_PATTERN =
  /^(?:\d{1,3}|cd\s*\d{1,2}|disc\s*\d{1,2}|track\s*\d{1,3}|trk\s*\d{1,3}|side\s*[ab])$/i

const stripLeadingTrackTokens = (tokens = []) => {
  const cleaned = [...tokens]
  while (cleaned.length > 1 && LEADING_TRACK_TOKEN_PATTERN.test(String(cleaned[0] || '').trim())) {
    cleaned.shift()
  }
  return cleaned
}

const cleanFilenameTrackTitle = (value = '') =>
  sanitizeDisplayText(value)
    .replace(/\[[A-Za-z0-9_-]{8,}\]$/g, '')
    .replace(/\[[^\]]*album[^\]]*\]/gi, '')
    .replace(/\((?:visualizer|visualiser|official video|official music video|audio|lyrics?)\)/gi, '')
    .replace(/\b(?:visualizer|visualiser)\b/gi, '')
    .replace(/\[(official|lyrics?|lyric video|audio|video|clip|music video|hq|hd|remaster(?:ed)?(?:\s*\d{2,4})?)\]/gi, '')
    .replace(/\((official|lyrics?|lyric video|audio|video|clip|music video|hq|hd|remaster(?:ed)?(?:\s*\d{2,4})?)\)/gi, '')
    .replace(/\b(official|lyrics?|lyric video|audio|video|clip|music video|hq|hd)\b/gi, '')
    .replace(/\s*\[[^\]]{9,}\]\s*$/g, ' ')
    .replace(/\s*[-–—_]+\s*/g, ' ')
    .replace(/^[\s\-_.:]+/, '')
    .replace(/[\s\-_.:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()

const stripLeadingTrackNumbers = (value = '') =>
  String(value || '')
    .replace(/^\s*(?:\d{1,3}(?:\s*[-._]\s*\d{1,3}){0,4}|track\s*\d{1,3}|trk\s*\d{1,3}|cd\s*\d{1,2}|disc\s*\d{1,2})\s*[-._:\s]+\s*/i, '')
    .trim()

const parseTrackName = (fileName) => {
  const cleanName = sanitizeDisplayText(String(fileName || '').replace(/\.[^/.]+$/, ''))
  const withoutTrackNumbers = stripLeadingTrackNumbers(cleanName)
  const normalizedName = withoutTrackNumbers || cleanName

  if (!normalizedName) {
    return {
      artist: 'Yerel Koleksiyon',
      title: 'Bilinmeyen parça',
    }
  }

  const explicitParts = normalizedName
    .split(/\s+[-–—]\s+/)
    .map((part) => sanitizeDisplayText(part))
    .filter(Boolean)
  const normalizedExplicit = stripLeadingTrackTokens(explicitParts)

  const seemsLikeArtistName = (value = '') => {
    const cleaned = sanitizeDisplayText(value)
    if (!cleaned) {
      return false
    }
    if (/\d/.test(cleaned)) {
      return false
    }
    const words = cleaned.split(/\s+/).filter(Boolean)
    return words.length >= 1 && words.length <= 5
  }

  const seemsLikeTrackTitle = (value = '') => {
    const raw = String(value || '')
    const cleaned = sanitizeDisplayText(raw)
    if (!cleaned) {
      return false
    }
    return /[,!?()[\]]/.test(raw) || /\d/.test(raw)
  }

  if (normalizedExplicit.length >= 2) {
    const firstPart = normalizedExplicit[0]
    const secondPart = normalizedExplicit.slice(1).join(' - ')
    const shouldSwapOrder =
      seemsLikeTrackTitle(firstPart) &&
      seemsLikeArtistName(secondPart) &&
      !seemsLikeTrackTitle(secondPart)

    return {
      artist: shouldSwapOrder ? sanitizeDisplayText(secondPart) : sanitizeDisplayText(firstPart),
      title: cleanFilenameTrackTitle(shouldSwapOrder ? firstPart : secondPart),
    }
  }

  const compactTokens = normalizedName
    .split(/[-_]+/)
    .map((part) => sanitizeDisplayText(part))
    .filter(Boolean)
  const normalizedCompact = stripLeadingTrackTokens(compactTokens)

  if (normalizedCompact.length >= 2) {
    return {
      artist: normalizedCompact[0],
      title: cleanFilenameTrackTitle(normalizedCompact.slice(1).join(' - ')),
    }
  }

  const titleCandidate = cleanFilenameTrackTitle(normalizedName)
  return {
    artist: 'Yerel Koleksiyon',
    title: titleCandidate || normalizedName,
  }
}

const inferTrackIdentityFromTitle = async (title = '') => {
  const cleanTitle = normalizeCoverMatchText(title)
  if (!cleanTitle) {
    return null
  }

  const titleTokens = cleanTitle.split(' ').filter((token) => token.length >= 3)
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(title)}&media=music&entity=song&limit=50`,
  )
  if (!response.ok) {
    return null
  }

  const json = await response.json()
  const results = Array.isArray(json?.results) ? json.results : []
  let best = null
  let bestScore = -1

  for (const item of results) {
    const rawTrackName = String(item?.trackName || '').trim()
    const rawArtistName = String(item?.artistName || '').trim()
    if (!rawTrackName || !rawArtistName) {
      continue
    }

    const normalizedTrack = normalizeCoverMatchText(rawTrackName)
    if (!normalizedTrack) {
      continue
    }

    let score = 0
    if (normalizedTrack === cleanTitle) {
      score += 140
    }
    if (normalizedTrack.startsWith(cleanTitle) || cleanTitle.startsWith(normalizedTrack)) {
      score += 85
    }

    const tokenMatches = titleTokens.filter((token) => normalizedTrack.includes(token)).length
    score += tokenMatches * 20

    if (tokenMatches === 0 && titleTokens.length > 0) {
      continue
    }

    if (/\b(live|karaoke|instrumental|remix|sped up|slowed)\b/i.test(rawTrackName)) {
      score -= 35
    }

    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  if (!best || bestScore < 35) {
    return null
  }

  return {
    title: cleanFilenameTrackTitle(String(best.trackName || '').trim()),
    artist: String(best.artistName || '').trim(),
    album: String(best.collectionName || '').trim(),
    coverUrl: best.artworkUrl100 ? best.artworkUrl100.replace(/100x100bb\./, '300x300bb.') : '',
  }
}

const readDuration = (url) =>
  new Promise((resolve) => {
    const probe = document.createElement('audio')
    const finalize = (duration = 0) => {
      probe.src = ''
      resolve(duration)
    }

    probe.preload = 'metadata'
    probe.onloadedmetadata = () => finalize(probe.duration)
    probe.onerror = () => finalize(0)
    probe.src = url
  })

const formatWikiDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  if (expanded.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`
  }

  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const normalizeArtistQuery = (value) =>
  value
    .replace(/^\s*\d{1,3}\s*[\.\-:)\]]\s*/i, '')
    .replace(/\s*\((feat\.?|ft\.?|with|remix|live|official).*$/i, '')
    .replace(/\s*(feat\.?|ft\.?|with|x|vs\.)\s+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

const extractArtistCandidates = (value = '') => {
  const cleaned = String(value || '')
    .replace(/^\s*\d{1,3}\s*[\.\-:)\]]\s*/i, '')
    .trim()

  const rawTokens = cleaned.split(/\s*(?:,|&|\/|\\|\+|;|\bx\b|\band\b)\s*/i)
  const normalized = rawTokens
    .map((token) => normalizeArtistQuery(token))
    .filter(
      (token) =>
        token &&
        token.toLowerCase() !== 'yerel koleksiyon' &&
        token.toLowerCase() !== 'various artists',
    )

  return Array.from(new Set(normalized))
}

const sanitizeDisplayText = (text) =>
  String(text || '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const getFullscreenTitlePresentation = (text, singleLineLimit = 28) => {
  const value = sanitizeDisplayText(text)
  const length = value.length
  const keepSingleLine = length > 0 && length <= singleLineLimit

  let fontSize = 'clamp(2rem, 5vw, 4rem)'
  if (length > 28 && length <= 40) {
    fontSize = 'clamp(1.9rem, 4.6vw, 3.4rem)'
  } else if (length > 40) {
    fontSize = 'clamp(1.55rem, 3.9vw, 2.7rem)'
  } else if (length > 20) {
    fontSize = 'clamp(1.95rem, 4.8vw, 3.7rem)'
  }

  return {
    text: value,
    className: keepSingleLine ? 'fullscreen-title-single' : 'fullscreen-title-wrap',
    style: {
      fontSize,
    },
  }
}

const hashSeed = (value) => {
  let hash = 2166136261
  const input = String(value || '')
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed) => {
  let state = (seed >>> 0) || 1
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const deterministicShuffleTracks = (trackList, seedKey) => {
  const items = [...trackList].sort((left, right) => String(left?.id || '').localeCompare(String(right?.id || '')))
  if (items.length <= 1) {
    return items
  }

  const random = createSeededRandom(hashSeed(seedKey))
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex], items[index]]
  }
  return items
}

const getGenreShapeVariant = (seed = '') => Math.abs(hashSeed(seed)) % 7

const readTrackMetadata = async (file) => {
  try {
    const { parseBlob } = await import('music-metadata-browser')
    const metadata = await parseBlob(file)
    const title = metadata?.common?.title?.trim() || ''
    const artist =
      metadata?.common?.artists?.filter(Boolean).join(', ')?.trim() ||
      metadata?.common?.artist?.trim() ||
      ''
    const album = metadata?.common?.album?.trim() || ''
    const genre = normalizeGenreName(metadata?.common?.genre?.find(Boolean) || '')

    return {
      title,
      artist,
      album,
      genre,
    }
  } catch {
    return null
  }
}

const pickGradient = (seed = '') => {
  const value = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return gradients[Math.abs(value) % gradients.length]
}

const normalizeDriveUrl = (value = '') => {
  const url = value.trim()
  if (!url) {
    return ''
  }

  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
  if (fileMatch?.[1]) {
    return `https://drive.usercontent.google.com/download?id=${fileMatch[1]}&export=download&confirm=t`
  }

  const openMatch = url.match(/[?&]id=([^&]+)/i)
  if (url.includes('drive.google.com') && openMatch?.[1]) {
    return `https://drive.usercontent.google.com/download?id=${openMatch[1]}&export=download&confirm=t`
  }

  return url
}

const isYouTubeLikeUrl = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) return false
  try {
    const parsed = new URL(raw)
    const host = String(parsed.hostname || '').toLowerCase()
    return host.includes('youtube.com') || host.includes('youtu.be')
  } catch {
    return /(?:^|\s)(https?:\/\/)?(?:www\.)?(?:music\.)?youtube\.com\/|(?:^|\s)(https?:\/\/)?youtu\.be\//i.test(raw)
  }
}

const extractYouTubeVideoId = (value = '') => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    const parsed = new URL(raw)
    const host = String(parsed.hostname || '').toLowerCase()
    if (host.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0] || ''
      return id.trim()
    }
    const v = parsed.searchParams.get('v')
    if (v) return String(v).trim()
    const parts = parsed.pathname.split('/').filter(Boolean)
    const embedIndex = parts.findIndex((part) => part === 'embed' || part === 'shorts')
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return String(parts[embedIndex + 1]).trim()
    }
  } catch {
    // ignore parse errors
  }
  const looseMatch = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/i)
  return looseMatch?.[1] ? String(looseMatch[1]).trim() : ''
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

const getFileNameFromUrl = (value = '') => {
  const url = String(value || '').trim()
  if (!url) {
    return ''
  }

  try {
    const parsed = new URL(url)
    const nameParam =
      parsed.searchParams.get('filename') ||
      parsed.searchParams.get('file') ||
      parsed.searchParams.get('name') ||
      ''
    if (nameParam) {
      return decodeURIComponent(nameParam.replace(/\+/g, ' ')).trim()
    }

    const lastSegment = parsed.pathname.split('/').pop() || ''
    return decodeURIComponent(lastSegment).trim()
  } catch {
    const clean = url.split('?')[0] || ''
    const lastSegment = clean.split('/').pop() || ''
    try {
      return decodeURIComponent(lastSegment).trim()
    } catch {
      return lastSegment.trim()
    }
  }
}

const resolveRemoteAssetUrl = (manifestUrl = '', assetValue = '') => {
  const raw = String(assetValue || '').trim()
  if (!raw) {
    return ''
  }

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return normalizeDriveUrl(raw)
  }

  try {
    return normalizeDriveUrl(new URL(raw, manifestUrl).href)
  } catch {
    return normalizeDriveUrl(raw)
  }
}

const isTrackDownloadable = (track) => {
  if (!track?.audioUrl) {
    return false
  }

  if (track.source === 'local' || track.source === 'link') {
    return true
  }

  const normalized = String(track.audioUrl || '').toLowerCase()
  return (
    normalized.includes('export=download') ||
    /\.(mp3|wav|flac|m4a|aac|ogg)(\?|$)/i.test(normalized)
  )
}

const normalizeDriveTrack = (track, sourceTag = 'drive', manifestUrl = '') => {
  const trackObject =
    typeof track === 'string'
      ? { downloadUrl: track }
      : track && typeof track === 'object'
        ? track
        : {}
  const rawAudioValue =
    trackObject.audioUrl ||
    trackObject.downloadUrl ||
    trackObject.directUrl ||
    trackObject.mp3Url ||
    trackObject.streamUrl ||
    trackObject.url ||
    trackObject.audioFile ||
    trackObject.audioPath ||
    trackObject.file ||
    ''
  const rawCoverValue =
    trackObject.coverUrl || trackObject.coverFile || trackObject.coverPath || trackObject.image || ''
  const audioUrl = resolveRemoteAssetUrl(manifestUrl, rawAudioValue)
  const coverUrl = resolveRemoteAssetUrl(manifestUrl, rawCoverValue)
  const inferredFromUrl = parseTrackName(getFileNameFromUrl(audioUrl || rawAudioValue))
  const normalizedTitle =
    cleanFilenameTrackTitle(String(trackObject.title || '').trim()) ||
    cleanFilenameTrackTitle(inferredFromUrl.title || '') ||
    'Bilinmeyen parça'
  const normalizedArtist =
    String(trackObject.artist || '').trim() || inferredFromUrl.artist || 'Yerel Koleksiyon'
  const rawId =
    trackObject.id ||
    trackObject.driveId ||
    rawAudioValue ||
    `${normalizedTitle || 'track'}-${normalizedArtist || 'artist'}`
  const normalizedId = `${sourceTag}:${encodeURIComponent(String(rawId))}`

  return {
    ...trackObject,
    id: normalizedId,
    source: sourceTag,
    title: normalizedTitle,
    artist: normalizedArtist,
    album: String(trackObject.album || '').trim() || 'Single',
    genre: normalizeGenreName(trackObject.genre || ''),
    duration: Number(trackObject.duration || 0) || 0,
    audioUrl,
    coverUrl,
    gradient: trackObject.gradient || pickGradient(trackObject.id || normalizedTitle || normalizedArtist || ''),
  }
}

const normalizeCoverMatchText = (value = '') =>
  String(value || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[ı]/g, 'i')
    .replace(/[ş]/g, 's')
    .replace(/[ğ]/g, 'g')
    .replace(/[ç]/g, 'c')
    .replace(/[ö]/g, 'o')
    .replace(/[ü]/g, 'u')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\s*(feat\.?|ft\.?|with)\s+.*$/i, '')
    .replace(/[^a-z0-9\u00c0-\u024f\u0400-\u04ff\u0600-\u06ff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeGenreName = (value = '') => {
  const normalized = sanitizeDisplayText(String(value || '')).replace(/\s+/g, ' ').trim()
  if (!normalized) {
    return ''
  }

  const lowered = normalized.toLocaleLowerCase('tr-TR')
  if (lowered === 'single' || lowered === 'unknown' || lowered === 'unknown genre') {
    return ''
  }

  return normalized
}

const isSingleOrEpAlbumName = (value = '') => {
  const normalized = normalizeCoverMatchText(value)
  if (!normalized) {
    return false
  }

  return (
    /\bsingle\b/i.test(normalized) ||
    /\bep\b/i.test(normalized) ||
    /\be p\b/i.test(normalized)
  )
}

const isStrongAlbumNameMatch = (leftValue = '', rightValue = '') => {
  const left = normalizeCoverMatchText(leftValue)
  const right = normalizeCoverMatchText(rightValue)
  if (!left || !right) {
    return false
  }
  if (left === right) {
    return true
  }

  const leftTokens = left.split(' ').filter((token) => token.length >= 3)
  const rightTokens = right.split(' ').filter((token) => token.length >= 3)
  const leftSet = new Set(leftTokens)
  const sharedTokens = rightTokens.filter((token) => leftSet.has(token)).length

  if (leftTokens.length && rightTokens.length) {
    const ratio = sharedTokens / Math.max(leftTokens.length, rightTokens.length)
    if (sharedTokens >= Math.min(2, rightTokens.length) && ratio >= 0.74) {
      return true
    }
  }

  const includesMatch = left.includes(right) || right.includes(left)
  const lengthGap = Math.abs(left.length - right.length)
  if (includesMatch && lengthGap <= 2 && Math.min(left.length, right.length) >= 5) {
    return true
  }

  return false
}

const fetchYouTubeMusicMeta = async (title, artist, options = {}) => {
  const cleanTitle = normalizeCoverMatchText(title)
  const cleanArtist = normalizeCoverMatchText(artist)
  const preferredDuration = Number(options?.preferredDuration || 0)
  if (!cleanTitle || !cleanArtist) {
    return { coverUrl: '', album: '', genre: '', confidence: 0, source: '' }
  }

  const query = `${sanitizeDisplayText(artist)} ${cleanFilenameTrackTitle(title)}`
  const result = window?.novaPlayer?.searchYtMusic
    ? await window.novaPlayer.searchYtMusic({ query, limit: 12 })
    : await window.novaPlayer?.searchYoutube?.({ query, limit: 12 })
  if (!result?.ok || !Array.isArray(result.items) || !result.items.length) {
    return { coverUrl: '', album: '', genre: '', confidence: 0, source: '' }
  }

  const titleTokens = cleanTitle.split(' ').filter((token) => token.length >= 3)
  const artistTokens = cleanArtist.split(' ').filter((token) => token.length >= 3)
  const blocked = /\b(slowed|sped\s*up|nightcore|karaoke|8d|bass\s*boosted|live|concert|cover|remix)\b/i

  const scoreItem = (item) => {
    const itemTitleRaw = String(item?.title || '')
    const itemArtistRaw = String(item?.artist || '')
    const itemTitle = normalizeCoverMatchText(itemTitleRaw)
    const itemArtist = normalizeCoverMatchText(itemArtistRaw)
    if (!itemTitle || !itemArtist) {
      return -1
    }
    if (blocked.test(itemTitleRaw) || blocked.test(itemArtistRaw)) {
      return -1
    }

    let score = 0
    if (itemTitle === cleanTitle) score += 42
    else if (itemTitle.includes(cleanTitle) || cleanTitle.includes(itemTitle)) score += 30
    else score += Math.min(18, titleTokens.filter((t) => itemTitle.includes(t)).length * 6)

    if (itemArtist === cleanArtist) score += 36
    else if (itemArtist.includes(cleanArtist) || cleanArtist.includes(itemArtist)) score += 24
    else score += Math.min(14, artistTokens.filter((t) => itemArtist.includes(t)).length * 5)

    const lowerTitleRaw = itemTitleRaw.toLowerCase()
    const lowerArtistRaw = itemArtistRaw.toLowerCase()
    if (/\bofficial\b|\baudio\b/.test(lowerTitleRaw)) score += 8
    if (/\btopic\b/.test(lowerArtistRaw)) score += 7

    const duration = Number(item?.duration || 0)
    if (preferredDuration > 0 && duration > 0) {
      const diff = Math.abs(duration - preferredDuration)
      if (diff <= 2) score += 12
      else if (diff <= 5) score += 8
      else if (diff <= 10) score += 4
      else if (diff > 20) score -= 10
    }

    return score
  }

  let best = null
  let bestScore = -1
  for (const item of result.items) {
    const score = scoreItem(item)
    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  if (!best || bestScore < 52) {
    return { coverUrl: '', album: '', genre: '', confidence: 0, source: '' }
  }

  return {
    coverUrl: String(best.thumbnail || '').trim(),
    album: String(best.album || '').trim(),
    genre: '',
    confidence: Math.max(0, Math.min(100, Math.round(bestScore))),
    source: 'ytmusicapi-first',
  }
}

const fetchRemoteTrackMeta = async (title, artist, options = {}) => {
  const cleanTitle = normalizeCoverMatchText(title)
  const cleanArtist = normalizeCoverMatchText(artist)
  const normalizedPreferredAlbum = normalizeCoverMatchText(options?.preferredAlbum || '')
  const cleanAlbum = isSingleOrEpAlbumName(normalizedPreferredAlbum) ? '' : normalizedPreferredAlbum
  const preferredDuration = Number(options?.preferredDuration || 0)
  if (!cleanTitle || !cleanArtist) {
    return { coverUrl: '', album: '', genre: '' }
  }

  // Primary source: YouTube Music/YouTube matching (cover + title/artist confidence).
  try {
    const ytMeta = await fetchYouTubeMusicMeta(title, artist, options)
    if (ytMeta?.coverUrl) {
      return ytMeta
    }
    return {
      coverUrl: String(ytMeta?.coverUrl || '').trim(),
      album: String(ytMeta?.album || '').trim(),
      genre: normalizeGenreName(ytMeta?.genre || ''),
      confidence: Number(ytMeta?.confidence || 0),
      source: 'ytmusicapi-only',
    }
  } catch {
    // ignore and return empty below
  }
  return { coverUrl: '', album: '', genre: '' }
}

const mediaShortcutFromKeyboardEvent = (event) => {
  const ctrl = Boolean(event?.ctrlKey)
  const alt = Boolean(event?.altKey)
  const shift = Boolean(event?.shiftKey)
  const meta = Boolean(event?.metaKey)
  const key = String(event?.key || '')
  const code = String(event?.code || '')

  const modifiers = []
  if (ctrl) modifiers.push('Ctrl')
  if (alt) modifiers.push('Alt')
  if (shift) modifiers.push('Shift')
  if (meta) modifiers.push('Super')

  const isModifierOnlyKey =
    key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta'

  const codeMap = {
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Tab: 'Tab',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
  }

  let main = ''
  if (codeMap[code]) {
    main = codeMap[code]
  } else if (/^Key[A-Z]$/.test(code)) {
    main = code.slice(3).toUpperCase()
  } else if (/^Digit[0-9]$/.test(code)) {
    main = code.slice(5)
  } else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) {
    main = key.toUpperCase()
  } else if (!isModifierOnlyKey && key.length === 1) {
    main = key.toUpperCase()
  }

  if (!main) {
    if (isModifierOnlyKey) {
      return modifiers.join('+')
    }
    return modifiers.join('+')
  }

  if (modifiers.includes(main)) {
    return modifiers.join('+')
  }
  return modifiers.length ? `${modifiers.join('+')}+${main}` : main
}

const areArtistsCompatible = (leftArtist = '', rightArtist = '') => {
  const left = normalizeArtistQuery(leftArtist).toLowerCase()
  const right = normalizeArtistQuery(rightArtist).toLowerCase()
  if (!left || !right) {
    return false
  }
  if (left === right || left.includes(right) || right.includes(left)) {
    return true
  }

  const leftVariants = Array.from(
    new Set([left, ...extractArtistCandidates(leftArtist).map((name) => normalizeArtistQuery(name).toLowerCase())]),
  ).filter(Boolean)
  const rightVariants = Array.from(
    new Set([right, ...extractArtistCandidates(rightArtist).map((name) => normalizeArtistQuery(name).toLowerCase())]),
  ).filter(Boolean)

  return leftVariants.some((leftVariant) =>
    rightVariants.some(
      (rightVariant) =>
        leftVariant === rightVariant ||
        leftVariant.includes(rightVariant) ||
        rightVariant.includes(leftVariant),
    ),
  )
}

const fetchRemoteCoverArt = async (title, artist) => {
  const remoteMeta = await fetchRemoteTrackMeta(title, artist)
  return remoteMeta.coverUrl || ''
}

const fetchRemoteTrackMetaSmart = async (title, artist, options = {}) => {
  const primary = await fetchRemoteTrackMeta(title, artist, options)
  const primaryConfidence = Number(primary?.confidence || 0)
  let best = primary
  let swapped = false

  const cleanTitle = cleanFilenameTrackTitle(title || '')
  const cleanArtist = sanitizeDisplayText(artist || '')
  if (!cleanTitle || !cleanArtist || options?.disableSwapCheck) {
    return { ...best, swapped }
  }

  if (primary?.coverUrl && primaryConfidence >= 72) {
    return { ...best, swapped }
  }

  try {
    const swappedMeta = await fetchRemoteTrackMeta(cleanArtist, cleanTitle, {
      ...options,
      disableSwapCheck: true,
    })
    const swappedConfidence = Number(swappedMeta?.confidence || 0)
    if (
      swappedMeta?.coverUrl &&
      swappedConfidence >= Math.max(primaryConfidence + 10, 70)
    ) {
      best = swappedMeta
      swapped = true
    }
  } catch {
    // ignore swapped lookup errors
  }

  return { ...best, swapped }
}

const fetchAlbumInsights = async ({ artist = '', album = '', title = '' }) => {
  const cleanArtist = normalizeCoverMatchText(artist)
  const cleanAlbum = normalizeCoverMatchText(album)
  const cleanTitle = normalizeCoverMatchText(title)
  const term = [artist, album || title].filter(Boolean).join(' ').trim()
  if (!term) {
    return null
  }

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=album&limit=35`,
  )
  if (!response.ok) {
    return null
  }

  const json = await response.json()
  const results = Array.isArray(json?.results) ? json.results : []
  let best = null
  let bestScore = -1

  for (const item of results) {
    const artistName = normalizeCoverMatchText(item?.artistName || '')
    const albumName = normalizeCoverMatchText(item?.collectionName || '')
    if (!albumName) {
      continue
    }

    let score = 0
    if (cleanArtist) {
      if (artistName === cleanArtist) {
        score += 45
      } else if (artistName.includes(cleanArtist) || cleanArtist.includes(artistName)) {
        score += 30
      } else {
        continue
      }
    }

    if (cleanAlbum) {
      if (albumName === cleanAlbum) {
        score += 55
      } else if (isStrongAlbumNameMatch(albumName, cleanAlbum)) {
        score += 36
      } else {
        // Albüm adı verildiyse yanlış albüme hiç düşme.
        continue
      }
    } else if (cleanTitle && (albumName.includes(cleanTitle) || cleanTitle.includes(albumName))) {
      score += 12
    }

    const trackCount = Number(item?.trackCount || 0)
    score += Math.min(trackCount, 20)
    if (isSingleOrEpAlbumName(albumName)) {
      score -= 25
    } else {
      score += 8
    }

    if (score > bestScore) {
      bestScore = score
      best = item
    }
  }

  if (!best) {
    return null
  }

  if (cleanAlbum && !isStrongAlbumNameMatch(best.collectionName || '', cleanAlbum)) {
    return null
  }

  return {
    album: String(best.collectionName || album || '').trim(),
    artist: String(best.artistName || artist || '').trim(),
    releaseDate: String(best.releaseDate || '').trim(),
    coverUrl: best.artworkUrl100 ? best.artworkUrl100.replace(/100x100bb\./, '600x600bb.') : '',
  }
}

const fillCoverFromAlbumInsight = async ({
  title = '',
  artist = '',
  album = '',
  coverUrl = '',
}) => {
  const currentCover = String(coverUrl || '').trim()
  const currentAlbum = String(album || '').trim()
  if (currentCover) {
    return { coverUrl: currentCover, album: currentAlbum }
  }

  const cleanArtist = sanitizeDisplayText(artist || '').trim()
  const cleanTitle = cleanFilenameTrackTitle(title || '').trim()
  if (!cleanArtist || !cleanTitle) {
    return { coverUrl: currentCover, album: currentAlbum }
  }

  try {
    const fallbackMeta = await fetchRemoteTrackMeta(cleanTitle, cleanArtist, {
      preferredAlbum: '',
      preferredDuration: 0,
    })

    return {
      coverUrl: String(fallbackMeta?.coverUrl || currentCover || '').trim(),
      album: String(fallbackMeta?.album || currentAlbum || '').trim(),
    }
  } catch {
    return { coverUrl: currentCover, album: currentAlbum }
  }
}

const upgradeCoverUrl = (url = '', size = '100x100bb') => {
  if (!url) {
    return ''
  }

  return url.replace(/\/\d+x\d+bb\./, `/${size}.`).replace(/100x100bb\./, `${size}.`)
}

const isLocalLikeAssetUrl = (url = '') => {
  const value = String(url || '').trim()
  if (!value) return false
  return (
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('file://') ||
    /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?\/local-media\//i.test(value)
  )
}

const getTrackDisplayUrl = (track, mode = 'thumb', pendingCover = null) => {
  const pendingUrl = String(pendingCover?.coverUrl || '').trim()
  const localUrl = String(track?.coverUrl || '').trim()
  const preferLocalForLargeSurfaces = mode === 'hero' || mode === 'cover'

  const url = preferLocalForLargeSurfaces
    ? (pendingUrl || (isLocalLikeAssetUrl(localUrl) ? localUrl : '') || localUrl)
    : (pendingUrl || localUrl)

  if (!url) {
    return ''
  }

  const toRemoteProxyUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim()
    if (!value || isLocalLikeAssetUrl(value) || !/^https?:\/\//i.test(value)) {
      return value
    }
    try {
      const token = btoa(unescape(encodeURIComponent(value)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')
      return `http://127.0.0.1:31733/remote-media/${token}`
    } catch {
      return value
    }
  }

  if (url.includes('itunes.apple.com') || url.includes('mzstatic.com')) {
    const optimized = upgradeCoverUrl(url, mode === 'hero' || mode === 'cover' ? '1200x1200bb' : '300x300bb')
    return toRemoteProxyUrl(optimized)
  }

  // YouTube Music / Google-hosted thumbnails often include size params like =w120-h120.
  // Force larger variants for player/cover surfaces.
  if (/googleusercontent\.com|ggpht\.com|ytimg\.com/i.test(url)) {
    const largeGoogle = url
      .replace(/=w\d+-h\d+[^&]*/i, mode === 'hero' || mode === 'cover' ? '=w1200-h1200' : '=w300-h300')
      .replace(/=s\d+[^&]*/i, mode === 'hero' || mode === 'cover' ? '=s1200' : '=s300')
    if (/i\.ytimg\.com\/vi\//i.test(largeGoogle)) {
      if (mode === 'hero' || mode === 'cover') {
        return toRemoteProxyUrl(
          largeGoogle
          .replace('/mqdefault.jpg', '/hqdefault.jpg')
          .replace('/default.jpg', '/hqdefault.jpg')
        )
      }
      return toRemoteProxyUrl(
        largeGoogle
        .replace('/mqdefault.jpg', '/hqdefault.jpg')
        .replace('/default.jpg', '/hqdefault.jpg')
      )
    }
    return toRemoteProxyUrl(largeGoogle)
  }

  return toRemoteProxyUrl(url)
}

const formatMonthKeyLabel = (monthKey = '', language = 'tr') => {
  const [yearRaw, monthRaw] = String(monthKey || '').split('-')
  const year = Number(yearRaw)
  const monthIndex = Number(monthRaw) - 1
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return monthKey || 'Ay'
  }
  const locale = language === 'en' ? 'en-US' : 'tr-TR'
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex, 1))
}

const getTrackCoverUrl = (track, pendingCover = null) =>
  getTrackDisplayUrl(track, 'hero', pendingCover)

const decodeRemoteMediaProxyUrl = (url = '') => {
  const value = String(url || '').trim()
  const match = value.match(/\/remote-media\/([^/?#]+)/i)
  if (!match?.[1]) return value

  try {
    const normalizedToken = match[1].replace(/-/g, '+').replace(/_/g, '/')
    const paddedToken = normalizedToken.padEnd(Math.ceil(normalizedToken.length / 4) * 4, '=')
    return decodeURIComponent(escape(atob(paddedToken)))
  } catch {
    return value
  }
}

const getTrackDiscordCoverUrl = (track) => {
  const candidates = [
    track?.coverRemoteUrl,
    track?.remoteCoverUrl,
    track?.artworkUrl,
    track?.thumbnail,
    track?.image,
    track?.coverUrl,
  ]

  for (const candidate of candidates) {
    const rawUrl = decodeRemoteMediaProxyUrl(candidate)
    if (!/^https:\/\//i.test(rawUrl) || isLocalLikeAssetUrl(rawUrl)) {
      continue
    }

    if (/itunes\.apple\.com|mzstatic\.com/i.test(rawUrl)) {
      return upgradeCoverUrl(rawUrl, '1200x1200bb')
    }

    if (/googleusercontent\.com|ggpht\.com|ytimg\.com/i.test(rawUrl)) {
      return rawUrl
        .replace(/=w\d+-h\d+[^&]*/i, '=w1200-h1200')
        .replace(/=s\d+[^&]*/i, '=s1200')
        .replace('/mqdefault.jpg', '/hqdefault.jpg')
        .replace('/default.jpg', '/hqdefault.jpg')
    }

    return rawUrl
  }

  return ''
}

const getTrackPublicCoverUrl = (track) => getTrackDiscordCoverUrl(track)

const isKeyboardInputContext = (event) => {
  const target = event?.target instanceof Element ? event.target : null
  const active = document?.activeElement instanceof Element ? document.activeElement : null
  const node = target || active
  if (!node) return false

  const tagName = node.tagName?.toLowerCase?.() || ''
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    Boolean(node.isContentEditable)
  ) {
    return true
  }

  if (
    node.closest?.(
      'input, textarea, select, [contenteditable="true"], .topbar-youtube-search, .add-link-search-results, .field',
    )
  ) {
    return true
  }

  return false
}

const getTrackSignature = (track) => {
  const title = normalizeArtistQuery(track?.title || '').toLowerCase()
  const artist = normalizeArtistQuery(track?.artist || '').toLowerCase()
  const size = track?.size || ''
  const durationBucket = Number.isFinite(track?.duration) ? Math.round(track.duration) : ''
  const sourceKey =
    track?.source === 'link' ? normalizeDriveUrl(track?.audioUrl || '') : ''
  return `${title}|${artist}|${size}|${durationBucket}|${sourceKey}`
}

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image-load-failed'))
    image.src = src
  })

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('file-read-failed'))
    reader.readAsDataURL(file)
  })

const extractDominantColor = async (src) => {
  if (!src) {
    return ''
  }

  let objectUrl = src
  let shouldRevoke = false

  try {
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      const response = await fetch(src)
      if (!response.ok) {
        return ''
      }

      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      shouldRevoke = true
    }

    const image = await loadImageElement(objectUrl)
    const canvas = document.createElement('canvas')
    const size = 24
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) {
      return ''
    }

    context.drawImage(image, 0, 0, size, size)
    const { data } = context.getImageData(0, 0, size, size)
    const buckets = new Map()

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3]
      if (alpha < 180) {
        continue
      }

      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`
      buckets.set(key, (buckets.get(key) || 0) + 1)
    }

    let dominant = ''
    let dominantCount = 0
    buckets.forEach((count, key) => {
      if (count > dominantCount) {
        dominant = key
        dominantCount = count
      }
    })

    if (!dominant) {
      return ''
    }

    const [r, g, b] = dominant.split(',').map(Number)
    return `rgb(${r}, ${g}, ${b})`
  } catch {
    return ''
  } finally {
    if (shouldRevoke) {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

const getReadableCoverColors = (background) => {
  const rgb = parseColorToRgb(background)
  if (!rgb) {
    return {
      fg: '#ffffff',
      fgSoft: 'rgba(255, 255, 255, 0.72)',
      fgMuted: 'rgba(255, 255, 255, 0.58)',
    }
  }

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000

  if (brightness >= 180) {
    return {
      fg: '#111111',
      fgSoft: 'rgba(17, 17, 17, 0.72)',
      fgMuted: 'rgba(17, 17, 17, 0.58)',
    }
  }

  return {
    fg: '#ffffff',
    fgSoft: 'rgba(255, 255, 255, 0.72)',
    fgMuted: 'rgba(255, 255, 255, 0.58)',
  }
}

const parseColorToRgb = (value = '') => {
  const text = String(value || '').trim()
  const rgbMatch = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (rgbMatch) {
    return {
      r: Math.max(0, Math.min(255, Number(rgbMatch[1]))),
      g: Math.max(0, Math.min(255, Number(rgbMatch[2]))),
      b: Math.max(0, Math.min(255, Number(rgbMatch[3]))),
    }
  }

  const hexTokenMatch = text.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i)
  const hex = (hexTokenMatch ? hexTokenMatch[1] : text.replace('#', '')).trim()
  if (hex.length === 3 || hex.length === 6) {
    const expanded = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    }
  }

  return null
}

const mixRgbColor = (left, right, ratio = 0.5) => {
  const t = Math.max(0, Math.min(1, Number(ratio) || 0))
  return {
    r: Math.round(left.r + (right.r - left.r) * t),
    g: Math.round(left.g + (right.g - left.g) * t),
    b: Math.round(left.b + (right.b - left.b) * t),
  }
}

const rgbToRgbaCss = (rgb, alpha = 1) =>
  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, Number(alpha) || 0))})`

const getClaimString = (claims, propertyId) => {
  const value = claims?.[propertyId]?.[0]?.mainsnak?.datavalue?.value || ''
  if (typeof value === 'string') {
    return value
  }
  if (value?.text) {
    return value.text
  }
  return ''
}

const getClaimDate = (claims, propertyId) => {
  const raw = claims?.[propertyId]?.[0]?.mainsnak?.datavalue?.value?.time
  if (!raw) {
    return ''
  }

  return formatWikiDate(raw.replace(/^\+/, '').split('T')[0])
}

const getClaimEntityIds = (claims, propertyId) =>
  (claims?.[propertyId] || [])
    .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
    .filter(Boolean)

const fetchArtistFacts = async (artistName) => {
  const MUSIC_HINT_PATTERN =
    /\b(musician|singer|rapper|band|music|songwriter|composer|record producer|dj|vocalist|guitarist|drummer|bassist|pianist|conductor)\b/i
  const searchQueries = Array.from(
    new Set([normalizeArtistQuery(artistName), artistName].map((query) => query.trim()).filter(Boolean)),
  )

  let entityId = ''
  for (const query of searchQueries) {
    const searchResponse = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        query,
      )}&language=en&format=json&formatversion=2&origin=*&limit=5`,
    )
    const searchJson = await searchResponse.json()
    const candidates = Array.isArray(searchJson?.search) ? searchJson.search : []
    const bestMusicCandidate = candidates.find((item) => {
      const label = String(item?.label || '')
      const description = String(item?.description || '')
      const text = `${label} ${description}`.trim()
      return MUSIC_HINT_PATTERN.test(text)
    })
    entityId = bestMusicCandidate?.id || candidates?.[0]?.id || ''
    if (entityId) {
      break
    }
  }

  if (!entityId) {
    return null
  }

  const entityResponse = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=labels|descriptions|claims|sitelinks&languages=en&languagefallback=1&format=json&formatversion=2&origin=*`,
  )
  const entityJson = await entityResponse.json()
  const entity = entityJson?.entities?.[entityId]
  if (!entity) {
    return null
  }

  const claims = entity.claims || {}
  const occupationIds = getClaimEntityIds(claims, 'P106')
  const instanceIds = getClaimEntityIds(claims, 'P31')
  const genreIds = getClaimEntityIds(claims, 'P136')
  const hasMusicSignals =
    occupationIds.length > 0 ||
    genreIds.length > 0 ||
    instanceIds.some((id) => ['Q215380', 'Q5741069', 'Q2088357', 'Q177220'].includes(String(id)))
  if (!hasMusicSignals) {
    return null
  }
  const memberIds = getClaimEntityIds(claims, 'P527').slice(0, 8)

  let memberNames = []
  if (memberIds.length) {
    const membersResponse = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${memberIds.join(
        '|',
      )}&props=labels&languages=en&languagefallback=1&format=json&formatversion=2&origin=*`,
    )
    const membersJson = await membersResponse.json()
    memberNames = memberIds
      .map((id) => membersJson?.entities?.[id]?.labels?.en?.value)
      .filter(Boolean)
  }

  const wikiTitle = entity?.sitelinks?.enwiki?.title || ''
  let summary = entity?.descriptions?.en?.value || ''
  let photoUrl = ''

  if (wikiTitle) {
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
    )
    if (summaryResponse.ok) {
      const summaryJson = await summaryResponse.json()
      summary = summaryJson?.extract || summary
      photoUrl = summaryJson?.thumbnail?.source || ''
    }
  }

  return {
    name: entity?.labels?.en?.value || artistName,
    summary,
    realName: getClaimString(claims, 'P1477'),
    formedAt: getClaimDate(claims, 'P571'),
    birthDate: getClaimDate(claims, 'P569'),
    members: memberNames,
    photoUrl,
  }
}

let dbPromise = null

const openTracksDb = () => {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

const getStoredTracks = async () => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()

    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

const putStoredTracks = async (records) => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.clear()
    records.forEach((record) => {
      store.put(record)
    })

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const deleteStoredTrack = async (id) => {
  const db = await openTracksDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

const loadJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

const splitSearchResults = (items = []) => {
  const list = Array.isArray(items) ? items : []
  const artists = list.filter((item) => String(item?.type || '') === 'artist')
  const albums = list.filter((item) => String(item?.type || '') === 'album')
  const playlists = list.filter((item) => String(item?.type || '') === 'playlist')
  const songs = list.filter((item) => {
    const itemType = String(item?.type || 'song')
    return itemType === 'song' || itemType === 'podcast' || itemType === 'playlist'
  })
  return {
    featuredArtist: artists[0] || null,
    featuredAlbum: albums[0] || null,
    songs,
    restArtists: artists.slice(1),
    restAlbums: albums.slice(1),
    playlists,
  }
}

const saveJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const loadUiPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY) || '{}')
  } catch {
    return {}
  }
}

const saveUiPrefs = (prefs) => {
  localStorage.setItem(UI_KEY, JSON.stringify(prefs))
}

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hashConsoleSecret = async (secret = '') => {
  const value = String(secret || '')
  if (!value || typeof window === 'undefined' || !window.crypto?.subtle || !window.TextEncoder) {
    return ''
  }
  const data = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

const normalizeHexColor = (value, fallback) => {
  const raw = String(value || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    const [_, r, g, b] = raw
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return fallback
}

const getDefaultBackgroundPalette = (mode) => {
  if (mode === 'light') {
    return { color1: '#eef1f6', color2: '#dde3ea' }
  }
  if (mode === 'custom') {
    return { color1: '#000000', color2: '#111827' }
  }
  if (mode === 'transparent') {
    return { color1: '#18181b', color2: '#0f0f11' }
  }
  if (mode === 'gray') {
    return { color1: '#101317', color2: '#1a2028' }
  }
  return { color1: '#000000', color2: '#111827' }
}

const getUiThemeVars = (mode, customColor = '#3b82f6') => {
  if (mode === 'light') {
    return {
      '--app-bg': 'radial-gradient(120% 120% at 8% 6%, #eef1f6 0%, #e7ebf1 48%, #dde3ea 100%)',
      '--surface-bg': '#f4f7fb',
      '--surface-bg-strong': '#eff3f8',
      '--surface-border': 'rgba(15, 23, 42, 0.10)',
      '--text-primary': '#0f172a',
      '--text-secondary': 'rgba(15, 23, 42, 0.66)',
      '--text-muted': 'rgba(15, 23, 42, 0.52)',
      '--control-bg': '#e7edf4',
      '--control-bg-hover': '#dbe4ee',
      '--control-strong-bg': '#0f172a',
      '--control-strong-fg': '#ffffff',
      '--control-border': 'rgba(15, 23, 42, 0.10)',
      '--range-track': 'rgba(15, 23, 42, 0.2)',
      '--range-thumb': '#0f172a',
      '--range-progress': 'linear-gradient(90deg, #0f172a, rgba(15, 23, 42, 0.42))',
    }
  }

  if (mode === 'gray') {
    return {
      '--app-bg': 'radial-gradient(120% 120% at 10% 8%, #1b1b1d 0%, #141416 52%, #101011 100%)',
      '--surface-bg': '#1c1c1e',
      '--surface-bg-strong': '#222224',
      '--surface-border': 'rgba(255, 255, 255, 0.1)',
      '--text-primary': '#f2f2f3',
      '--text-secondary': 'rgba(242, 242, 243, 0.66)',
      '--text-muted': 'rgba(242, 242, 243, 0.48)',
      '--control-bg': '#2b2b2e',
      '--control-bg-hover': '#343438',
      '--control-strong-bg': '#f2f2f3',
      '--control-strong-fg': '#121214',
      '--control-border': 'rgba(255, 255, 255, 0.08)',
      '--range-track': 'rgba(255, 255, 255, 0.2)',
      '--range-thumb': '#ffffff',
      '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.38))',
    }
  }

  if (mode === 'transparent') {
    return {
      '--app-bg': 'radial-gradient(130% 130% at 10% 8%, #1a1a1d 0%, #121216 52%, #0e0e11 100%)',
      '--surface-bg': 'rgba(255, 255, 255, 0.06)',
      '--surface-bg-strong': 'rgba(255, 255, 255, 0.08)',
      '--panel-solid': 'rgba(255, 255, 255, 0.08)',
      '--surface-border': 'rgba(255, 255, 255, 0.22)',
      '--text-primary': '#ffffff',
      '--text-secondary': 'rgba(255, 255, 255, 0.76)',
      '--text-muted': 'rgba(255, 255, 255, 0.58)',
      '--control-bg': 'rgba(255, 255, 255, 0.08)',
      '--control-bg-hover': 'rgba(255, 255, 255, 0.14)',
      '--control-strong-bg': 'rgba(255, 255, 255, 0.20)',
      '--control-strong-fg': '#ffffff',
      '--control-border': 'rgba(255, 255, 255, 0.24)',
      '--range-track': 'rgba(255, 255, 255, 0.24)',
      '--range-thumb': '#ffffff',
      '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.46))',
    }
  }

  if (mode === 'custom') {
    const base = parseColorToRgb(customColor) || { r: 59, g: 130, b: 246 }
    const brightness = (base.r * 299 + base.g * 587 + base.b * 114) / 1000
    const isBright = brightness >= 174
    const surface = isBright
      ? mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.72)
      : mixRgbColor(base, { r: 8, g: 10, b: 16 }, 0.72)
    const surfaceStrong = isBright
      ? mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.82)
      : mixRgbColor(base, { r: 12, g: 15, b: 22 }, 0.6)
    const control = isBright
      ? mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.62)
      : mixRgbColor(base, { r: 24, g: 26, b: 34 }, 0.52)
    const controlHover = isBright
      ? mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.48)
      : mixRgbColor(base, { r: 40, g: 44, b: 58 }, 0.42)
    const textPrimary = isBright ? '#0f172a' : '#ffffff'
    const textSecondary = isBright ? 'rgba(15, 23, 42, 0.68)' : 'rgba(255, 255, 255, 0.68)'
    const textMuted = isBright ? 'rgba(15, 23, 42, 0.52)' : 'rgba(255, 255, 255, 0.50)'
    const border = isBright ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.12)'

    return {
      '--surface-bg': rgbToRgbaCss(surface, isBright ? 0.88 : 0.9),
      '--surface-bg-strong': rgbToRgbaCss(surfaceStrong, isBright ? 0.92 : 0.94),
      '--surface-border': border,
      '--text-primary': textPrimary,
      '--text-secondary': textSecondary,
      '--text-muted': textMuted,
      '--control-bg': rgbToRgbaCss(control, 0.92),
      '--control-bg-hover': rgbToRgbaCss(controlHover, 0.96),
      '--control-strong-bg': textPrimary,
      '--control-strong-fg': isBright ? '#ffffff' : '#0f172a',
      '--control-border': border,
      '--range-track': isBright ? 'rgba(15, 23, 42, 0.22)' : 'rgba(255, 255, 255, 0.22)',
      '--range-thumb': textPrimary,
      '--range-progress': `linear-gradient(90deg, ${textPrimary}, ${rgbToRgbaCss(base, 0.72)})`,
    }
  }

  return {
    '--app-bg': '#000000',
    '--surface-bg': '#0d0d0d',
    '--surface-bg-strong': '#121212',
    '--surface-border': 'rgba(255, 255, 255, 0.08)',
    '--text-primary': '#ffffff',
    '--text-secondary': 'rgba(255, 255, 255, 0.58)',
    '--text-muted': 'rgba(255, 255, 255, 0.46)',
    '--control-bg': '#1f1f1f',
    '--control-bg-hover': '#2a2a2a',
    '--control-strong-bg': '#ffffff',
    '--control-strong-fg': '#000000',
    '--control-border': 'rgba(255, 255, 255, 0.08)',
    '--range-track': 'rgba(255, 255, 255, 0.12)',
    '--range-thumb': '#ffffff',
    '--range-progress': 'linear-gradient(90deg, #ffffff, rgba(255, 255, 255, 0.35))',
  }
}

const loadArtistFactsCache = () => {
  try {
    return JSON.parse(localStorage.getItem(ARTIST_FACTS_KEY) || '{}')
  } catch {
    return {}
  }
}

let artistFactsSaveTimerId = null
let pendingArtistFactsCache = null

const saveArtistFactsCache = (cache) => {
  pruneCacheEntries(cache, MAX_ARTIST_FACTS_CACHE_ENTRIES)
  pendingArtistFactsCache = cache
  if (artistFactsSaveTimerId) {
    return
  }

  artistFactsSaveTimerId = window.setTimeout(() => {
    artistFactsSaveTimerId = null
    if (pendingArtistFactsCache === null) {
      return
    }
    localStorage.setItem(ARTIST_FACTS_KEY, JSON.stringify(pendingArtistFactsCache))
  }, 2200)
}

const loadJsonCache = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

const createPoolEditorTrack = (track = {}) => ({
  id: String(track.id || `pool-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  title: cleanFilenameTrackTitle(String(track.title || '').trim()) || '',
  artist: sanitizeDisplayText(String(track.artist || '').trim()) || '',
  downloadUrl: String(track.audioUrl || track.downloadUrl || '').trim(),
  coverUrl: String(track.coverUrl || track.image || '').trim(),
})

const normalizePoolManifestTrack = (track = {}) => {
  if (typeof track === 'string') {
    const directUrl = normalizeDriveUrl(track)
    if (!directUrl) {
      return null
    }
    return {
      title: '',
      artist: '',
      downloadUrl: directUrl,
      coverUrl: '',
    }
  }

  const title = cleanFilenameTrackTitle(String(track.title || '').trim())
  const artist = sanitizeDisplayText(String(track.artist || '').trim())
  const downloadUrl = normalizeDriveUrl(String(track.downloadUrl || track.audioUrl || '').trim())
  const coverUrl = normalizeDriveUrl(String(track.coverUrl || track.image || '').trim())
  if (!downloadUrl) {
    return null
  }
  return {
    title,
    artist,
    downloadUrl,
    coverUrl,
  }
}

const poolManifestTrackKey = (track = {}) =>
  `${normalizeCoverMatchText(track.artist || '')}|||${normalizeCoverMatchText(track.title || '')}|||${normalizeDriveUrl(
    track.downloadUrl || track.audioUrl || '',
  ).toLowerCase()}`

const parsePoolManifestTracks = (payload) => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.tracks)
      ? payload.tracks
      : Array.isArray(payload?.items)
        ? payload.items
        : []
  return source.map((item) => normalizePoolManifestTrack(item)).filter(Boolean)
}

const doesArtistMatch = (trackArtist = '', targetArtist = '') => {
  const target = normalizeArtistQuery(targetArtist).toLowerCase()
  if (!target) {
    return false
  }

  const variants = Array.from(
    new Set([
      normalizeArtistQuery(trackArtist).toLowerCase(),
      ...extractArtistCandidates(trackArtist).map((item) => normalizeArtistQuery(item).toLowerCase()),
    ].filter(Boolean)),
  )

  return variants.some((variant) => variant === target || variant.includes(target) || target.includes(variant))
}

const cacheWriteTimers = new Map()
const cacheWritePayloads = new Map()
const MAX_COVER_CACHE_ENTRIES = 180
const MAX_ALBUM_CACHE_ENTRIES = 420
const MAX_GENRE_CACHE_ENTRIES = 260
const MAX_LYRICS_CACHE_ENTRIES = 180
const MAX_ARTIST_FACTS_CACHE_ENTRIES = 180
const MAX_ARTIST_PROFILE_YT_CACHE_ENTRIES = 96
const MAX_YTM_SEARCH_CACHE_ENTRIES = 120
const MAX_YTM_ALBUM_TRACKS_CACHE_ENTRIES = 120
const MAX_ALBUM_INFO_MODAL_CACHE_ENTRIES = 140
const YTM_SEARCH_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const YTM_ALBUM_TRACKS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7
const MAX_IN_MEMORY_SEARCH_RESULTS = 42
const VIRTUAL_ROW_HEIGHT = 92
const VIRTUAL_OVERSCAN = 6

const pruneCacheEntries = (cache, maxEntries) => {
  if (!cache || typeof cache !== 'object') {
    return
  }
  const keys = Object.keys(cache)
  if (keys.length <= maxEntries) {
    return
  }
  const removeCount = keys.length - maxEntries
  for (let index = 0; index < removeCount; index += 1) {
    delete cache[keys[index]]
  }
}

const getLruCacheValue = (cache, key) => {
  if (!cache || !key || !Object.prototype.hasOwnProperty.call(cache, key)) {
    return undefined
  }
  const value = cache[key]
  delete cache[key]
  cache[key] = value
  return value
}

const setLruCacheValue = (cache, key, value, maxEntries) => {
  if (!cache || !key) {
    return
  }
  if (Object.prototype.hasOwnProperty.call(cache, key)) {
    delete cache[key]
  }
  cache[key] = value
  pruneCacheEntries(cache, maxEntries)
}

const saveJsonCache = (key, value) => {
  cacheWritePayloads.set(key, value)
  if (cacheWriteTimers.has(key)) {
    return
  }

  const flush = () => {
    cacheWriteTimers.delete(key)
    const payload = cacheWritePayloads.get(key)
    if (payload === undefined) {
      return
    }
    cacheWritePayloads.delete(key)
    localStorage.setItem(key, JSON.stringify(payload))
  }

  const timerId = setTimeout(flush, 2200)
  cacheWriteTimers.set(key, timerId)
}

const scheduleIdle = (task) => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(() => task())
  }

  return window.setTimeout(task, 32)
}

const withTimeout = async (promise, timeoutMs, fallbackValue) => {
  let timeoutId = null
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise((resolve) => {
        timeoutId = window.setTimeout(() => resolve(fallbackValue), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId)
    }
  }
}

const ENRICHMENT_TIMEOUT_MS = 12000

const isTrackAudioOnly = (track) => {
  if (!track) return false
  const hasAudio = Boolean(String(track.audioUrl || '').trim())
  const hasCover = Boolean(String(track.coverUrl || track.coverRemoteUrl || '').trim())
  const hasLyrics = Boolean(String(track.lyricsLocal || track.lyrics || '').trim())
  return hasAudio && !hasCover && !hasLyrics
}

const inferCoverFileExtension = (url = '', contentType = '') => {
  const extFromUrl = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(String(url || ''))?.[1]?.toLowerCase() || ''
  if (extFromUrl) {
    return `.${extFromUrl}`
  }
  const normalizedType = String(contentType || '').toLowerCase()
  if (normalizedType.includes('png')) return '.png'
  if (normalizedType.includes('webp')) return '.webp'
  if (normalizedType.includes('gif')) return '.gif'
  return '.jpg'
}

const COVER_ART_CACHE_KEY = 'nova-player-cover-art-cache'
const ALBUM_CACHE_KEY = 'nova-player-album-cache'
const GENRE_CACHE_KEY = 'nova-player-genre-cache'
const COVER_TONE_CACHE_KEY = 'nova-player-cover-tone-cache'
const LYRICS_CACHE_KEY = 'nova-player-lyrics-cache'
const ARTIST_PROFILE_YT_CACHE_KEY = 'nova-player-artist-profile-yt-cache'
const YTM_SEARCH_CACHE_KEY = 'nova-player-ytm-search-cache'
const YTM_ALBUM_TRACKS_CACHE_KEY = 'nova-player-ytm-album-tracks-cache'
const ALBUM_INFO_MODAL_CACHE_KEY = 'nova-player-album-info-modal-cache'
const COVER_FILE_CACHE_KEY = 'nova-player-cover-file-cache'
const FIRST_RUN_ONBOARDING_KEY = 'nova-player-first-run-onboarding-v1'
const DEPENDENCY_DOWNLOAD_LINKS = {
  python: 'https://www.python.org/downloads/windows/',
  'yt-dlp': 'https://github.com/yt-dlp/yt-dlp/releases/latest',
  ffmpeg: 'https://www.gyan.dev/ffmpeg/builds/',
  ytmusicapi: 'https://pypi.org/project/ytmusicapi/',
}
const DEPENDENCY_DOWNLOAD_LINKS_BY_PLATFORM = {
  linux: {
    python: 'https://www.python.org/downloads/source/',
    'yt-dlp': 'https://github.com/yt-dlp/yt-dlp/wiki/Installation',
    ffmpeg: 'https://ffmpeg.org/download.html#build-linux',
    ytmusicapi: 'https://pypi.org/project/ytmusicapi/',
  },
}
const getDependencyDownloadLink = (dep, platform = '') =>
  DEPENDENCY_DOWNLOAD_LINKS_BY_PLATFORM[platform]?.[dep] || DEPENDENCY_DOWNLOAD_LINKS[dep] || ''
const getDependencyInstallCommand = (dep, platform = '') => {
  if (platform === 'linux') {
    const linuxCommands = {
      python: 'sudo apt update && sudo apt install -y python3 python3-pip',
      'yt-dlp': 'python3 -m pip install --user -U yt-dlp',
      ffmpeg: 'sudo apt update && sudo apt install -y ffmpeg',
      ytmusicapi: 'python3 -m pip install --user -U ytmusicapi',
    }
    return linuxCommands[dep] || ''
  }

  const windowsCommands = {
    python: 'winget install Python.Python.3.12',
    'yt-dlp': 'pip install yt-dlp',
    ffmpeg: 'winget install ffmpeg',
    ytmusicapi: 'python -m pip install --user ytmusicapi',
  }
  return windowsCommands[dep] || ''
}
const MANUAL_DEPENDENCY_STATUS = {
  available: {},
  ytmusicapi: false,
  missing: [],
  missingPython: [],
}

const cleanTrackTitleForLyrics = (value = '') =>
  value
    .replace(/\s*\((feat\.?|ft\.?|with|remix|live|official|video).*?\)\s*/gi, ' ')
    .replace(/\s*\[(feat\.?|ft\.?|with|remix|live|official|video).*?\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizeLyricsText = (value = '') => String(value || '').replace(/\r\n/g, '\n').trim()

const getLinkDraftSignature = (draft = {}) =>
  [
    String(draft?.audioUrl || '').trim(),
    String(draft?.title || '').trim(),
    String(draft?.artist || '').trim(),
    String(draft?.coverUrl || '').trim(),
  ]
    .join('||')
    .toLowerCase()

const parseLrcTimestamp = (raw = '') => {
  const token = String(raw || '').trim()
  const match = token.match(/^(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/)
  if (!match) {
    return null
  }
  const minutes = Number(match[1] || 0)
  const seconds = Number(match[2] || 0)
  const fractionRaw = String(match[3] || '')
  const fraction = fractionRaw
    ? Number(`0.${fractionRaw.padEnd(3, '0').slice(0, 3)}`)
    : 0
  return minutes * 60 + seconds + fraction
}

const parseLyricsWithTiming = (text = '') => {
  const normalized = normalizeLyricsText(text)
  if (!normalized) {
    return { hasTiming: false, lines: [] }
  }
  const rawLines = normalized.split('\n')
  const timed = []
  const plain = []
  for (const rawLine of rawLines) {
    const line = String(rawLine || '')
    const matches = [...line.matchAll(/\[(\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\]/g)]
    const lyric = line.replace(/\[(\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\]/g, '').trim()
    if (matches.length) {
      for (const item of matches) {
        const at = parseLrcTimestamp(item[1])
        if (at == null) continue
        timed.push({ at, text: lyric || '...' })
      }
    } else {
      plain.push(line)
    }
  }
  if (!timed.length) {
    return {
      hasTiming: false,
      lines: plain.map((line) => ({ at: null, text: line })),
    }
  }
  timed.sort((a, b) => a.at - b.at)
  return { hasTiming: true, lines: timed }
}

const fetchLyricsFromLrcLib = async (artist, title) => {
  try {
    if (window?.novaPlayer?.fetchLyricsFromLrcLib) {
      const result = await window.novaPlayer.fetchLyricsFromLrcLib({ artist, title })
      if (result?.ok) {
        return normalizeLyricsText(String(result.lyrics || '').trim())
      }
    }
  } catch {
    // LRCLIB is the only lyrics source; failures fall through to not found.
  }
  return ''
}

const fetchLyricsForTrack = async (track) => {
  if (LYRICS_TEMP_DISABLED) {
    return ''
  }
  const startedAt = Date.now()
  const titleVariants = Array.from(
    new Set([cleanTrackTitleForLyrics(track?.title || ''), track?.title || ''].filter(Boolean)),
  )
  const artistVariants = Array.from(
    new Set([
      normalizeArtistQuery(track?.artist || '').split(/[,&/]/)[0]?.trim(),
      track?.artist || '',
    ].filter(Boolean)),
  )

  for (const artist of artistVariants) {
    for (const title of titleVariants) {
      const elapsed = Date.now() - startedAt
      const remaining = LYRICS_SEARCH_TIMEOUT_MS - elapsed
      if (remaining <= 0) {
        return ''
      }
      try {
        const lyricText = await withTimeout(fetchLyricsFromLrcLib(artist, title), remaining, '')
        if (lyricText) {
          return lyricText
        }
      } catch {
        // Try the next LRCLIB query variant until the total 20 second budget ends.
      }
    }
  }

  return ''
}

const materializeTrack = (record, urlsRef) => {
  let nextAudioUrl = record?.audioUrl || ''
  let nextCoverUrl = record?.coverUrl || ''

  if (record?.audioBlob) {
    nextAudioUrl = URL.createObjectURL(record.audioBlob)
    urlsRef.current.push(nextAudioUrl)
  }

  if (record?.coverBlob) {
    nextCoverUrl = URL.createObjectURL(record.coverBlob)
    urlsRef.current.push(nextCoverUrl)
  }

  if (!record?.audioBlob && !record?.coverBlob) {
    return record
  }

  return {
    ...record,
    audioUrl: nextAudioUrl,
    coverUrl: nextCoverUrl,
  }
}

const serializeTrack = (track) => {
  const persistentAudioUrl = String(track?.audioUrl || '').trim()
  const persistentCoverUrl = String(track?.coverUrl || '').trim()
  const persistentCoverRemoteUrl = getTrackPublicCoverUrl(track)
  const canPersistAudioUrl = persistentAudioUrl && !persistentAudioUrl.startsWith('blob:')
  const canPersistCoverUrl = persistentCoverUrl && !persistentCoverUrl.startsWith('blob:')

  if (track?.source === 'link') {
    const { audioBlob: _audioBlob, isFavorite: _isFavorite, ...rest } = track
    return {
      ...rest,
      audioUrl: normalizeDriveUrl(track.audioUrl || ''),
      coverUrl: track?.coverBlob ? '' : normalizeDriveUrl(track.coverUrl || ''),
      coverRemoteUrl: persistentCoverRemoteUrl,
    }
  }

  const { audioUrl: _audioUrl, coverUrl: _coverUrl, isFavorite: _isFavorite, ...rest } = track
  if (track?.audioBlob) {
    return rest
  }

  return {
    ...rest,
    audioUrl: canPersistAudioUrl ? persistentAudioUrl : '',
    coverUrl: canPersistCoverUrl ? persistentCoverUrl : '',
    coverRemoteUrl: persistentCoverRemoteUrl,
  }
}

const applyFavoriteFlags = (tracks, favoriteIds = []) => {
  const favoriteSet = new Set(favoriteIds)
  return tracks.map((track) => ({
    ...track,
    isFavorite: favoriteSet.has(track.id),
  }))
}

const applyPinnedFlags = (tracks, pinnedIds = []) => {
  const pinnedSet = new Set(pinnedIds)
  return tracks.map((track) => ({
    ...track,
    isPinned: pinnedSet.has(track.id),
  }))
}

const encodeUtf8ToBase64 = (value = '') => {
  const bytes = new TextEncoder().encode(String(value))
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

const decodeUtf8FromBase64 = (value = '') => {
  const binary = atob(String(value || '').replace(/\s+/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const MotionDiv = motion.div
const MotionSection = motion.section
const MotionAside = motion.aside
const MotionFooter = motion.footer
const SCROLL_TOP_TARGET_SELECTOR =
  '.playlist-rail, .track-column, .pool-browser-main, .pool-artist-list, .pool-tracks-scroll, .track-list, .artist-profile-track-list, .artist-profile-about, .album-info-content, .pool-admin-grid, .settings-content, .settings-menu'

function App() {
  const savedUi = loadUiPrefs()
  const inputRef = useRef(null)
  const coverInputRef = useRef(null)
  const poolAdminPasswordInputRef = useRef(null)
  const poolAdminGridRef = useRef(null)
  const initialPoolRefreshDoneRef = useRef(false)
  const lyricsFileInputRef = useRef(null)
  const audioRef = useRef(null)
  const loadedAudioStateRef = useRef({ trackId: null, audioUrl: '' })
  const audioContextRef = useRef(null)
  const audioSourceRef = useRef(null)
  const audioGainRef = useRef(null)
  const audioAnalyserRef = useRef(null)
  const monoRoutingNodesRef = useRef(null)
  const equalizerFiltersRef = useRef([])
  const assetUrlsRef = useRef([])
  const artistFactsCacheRef = useRef(loadArtistFactsCache())
  const coverArtCacheRef = useRef(loadJsonCache(COVER_ART_CACHE_KEY))
  const albumCacheRef = useRef(loadJsonCache(ALBUM_CACHE_KEY))
  const genreCacheRef = useRef(loadJsonCache(GENRE_CACHE_KEY))
  const coverToneCacheRef = useRef(loadJsonCache(COVER_TONE_CACHE_KEY))
  const lyricsCacheRef = useRef(loadJsonCache(LYRICS_CACHE_KEY))
  const lyricsPrefetchInFlightRef = useRef(new Set())
  const coverRepairInFlightRef = useRef(new Set())
  const coverLocalizeInFlightRef = useRef(new Set())
  const coverRemoteBackfillInFlightRef = useRef(new Set())
  const artistCatalogPrefetchInFlightRef = useRef(new Set())
  const ytmSearchCacheRef = useRef(loadJsonCache(YTM_SEARCH_CACHE_KEY))
  const ytmAlbumTracksCacheRef = useRef(loadJsonCache(YTM_ALBUM_TRACKS_CACHE_KEY))
  const albumInfoModalCacheRef = useRef(loadJsonCache(ALBUM_INFO_MODAL_CACHE_KEY))
  const coverFileCacheRef = useRef(loadJsonCache(COVER_FILE_CACHE_KEY))
  const lastManualTrackRepairRequestRef = useRef(0)
  const ytmSearchInFlightRef = useRef(new Map())
  const ytmAlbumTracksInFlightRef = useRef(new Map())
  const backgroundLyricsScanIndexRef = useRef(0)
  const restoreSeekRef = useRef(null)
  const restoreTrackIdRef = useRef(null)
  const spaceToggleLockUntilRef = useRef(0)
  const coverStageRef = useRef(null)
  const bottomDockRef = useRef(null)
  const dockHideTimerRef = useRef(null)
  const scrollTopTargetRef = useRef(null)
  const scrollTopUiStateRef = useRef({
    visible: false,
    left: null,
    target: null,
  })
  const trackListViewportRef = useRef(null)
  const virtualListRafRef = useRef(0)
  const previousCollectionIdRef = useRef('home')
  const playlistDockRef = useRef(null)
  const playlistDockDragRef = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
  })
  const suppressPlaylistDockClickRef = useRef(false)
  const lastUpdaterNoticeRef = useRef('')
  const [tracks, setTracks] = useState([])
  const [serverTracks, setServerTracks] = useState([])
  const [favoriteTrackIds, setFavoriteTrackIds] = useState(() => loadJson(FAVORITES_KEY, []))
  const favoriteTrackIdsRef = useRef(favoriteTrackIds)
  const [pinnedTrackIds, setPinnedTrackIds] = useState(() => loadJson(PINNED_TRACKS_KEY, []))
  const pinnedTrackIdsRef = useRef(pinnedTrackIds)
  const [playlists, setPlaylists] = useState(() => loadJson(PLAYLISTS_KEY, []))
  const [selectedCollectionId, setSelectedCollectionId] = useState('home')
  const [playlistRailCollapsed, setPlaylistRailCollapsed] = useState(Boolean(savedUi.playlistRailCollapsed))
  const [showDependenciesModal, setShowDependenciesModal] = useState(true)
  const [dependenciesStatus, setDependenciesStatus] = useState(MANUAL_DEPENDENCY_STATUS)
  useEffect(() => {
    if (selectedCollectionId === 'pool' || selectedCollectionId === 'server') {
      setSelectedCollectionId('all')
    }
  }, [selectedCollectionId])
  const [language, setLanguage] = useState(
    UI_LANGUAGES.includes(savedUi.language) ? savedUi.language : 'tr',
  )
  const [sharedManifestUrl, setSharedManifestUrl] = useState(
    savedUi.sharedManifestUrl || DEFAULT_SHARED_MANIFEST_URL,
  )
  const [themeMode, setThemeMode] = useState(savedUi.themeMode || 'dark')
  const [customThemeColor, setCustomThemeColor] = useState(
    normalizeHexColor(savedUi.customThemeColor, '#3b82f6'),
  )
  const defaultBackgroundPalette = getDefaultBackgroundPalette(savedUi.themeMode || 'dark')
  const [backgroundStyle, setBackgroundStyle] = useState(
    savedUi.backgroundStyle === 'solid' ? 'solid' : 'gradient',
  )
  const [coverBasedBackgroundEnabled, setCoverBasedBackgroundEnabled] = useState(
    Boolean(savedUi.coverBasedBackgroundEnabled),
  )
  const [backgroundColor1, setBackgroundColor1] = useState(
    normalizeHexColor(savedUi.backgroundColor1, defaultBackgroundPalette.color1),
  )
  const [backgroundColor2, setBackgroundColor2] = useState(
    normalizeHexColor(savedUi.backgroundColor2, defaultBackgroundPalette.color2),
  )
  const [closeBehavior, setCloseBehavior] = useState(savedUi.closeBehavior || 'tray')
  const [launchOnStartupEnabled, setLaunchOnStartupEnabled] = useState(
    savedUi.launchOnStartupEnabled === true,
  )
  const [hardwareAccelerationEnabled, setHardwareAccelerationEnabled] = useState(
    savedUi.hardwareAccelerationEnabled !== false,
  )
  const [preventSleepWhilePlayingEnabled, setPreventSleepWhilePlayingEnabled] = useState(
    savedUi.preventSleepWhilePlayingEnabled !== false,
  )
  const [fullscreenEffectsEnabled, setFullscreenEffectsEnabled] = useState(
    savedUi.fullscreenEffectsEnabled !== false,
  )
  const [reduceAnimationsEnabled, setReduceAnimationsEnabled] = useState(
    Boolean(savedUi.reduceAnimationsEnabled),
  )
  const [lowPowerModeEnabled, setLowPowerModeEnabled] = useState(
    savedUi.lowPowerModeEnabled !== false,
  )
  const [compactListEnabled, setCompactListEnabled] = useState(
    Boolean(savedUi.compactListEnabled),
  )
  const [showScrollbars, setShowScrollbars] = useState(Boolean(savedUi.showScrollbars))
  const [showScrollTopButton, setShowScrollTopButton] = useState(false)
  const [scrollTopButtonLeft, setScrollTopButtonLeft] = useState(null)
  const [spaceKeyPlaybackEnabled, setSpaceKeyPlaybackEnabled] = useState(
    savedUi.spaceKeyPlaybackEnabled !== false,
  )
  const [arrowSeekEnabled, setArrowSeekEnabled] = useState(savedUi.arrowSeekEnabled !== false)
  const [resetShortcutEnabled, setResetShortcutEnabled] = useState(
    savedUi.resetShortcutEnabled !== false,
  )
  const [resetShortcut, setResetShortcut] = useState(
    typeof savedUi.resetShortcut === 'string' ? savedUi.resetShortcut : 'Ctrl+Shift+R',
  )
  const [mediaToggleShortcut, setMediaToggleShortcut] = useState(
    typeof savedUi.mediaToggleShortcut === 'string' ? savedUi.mediaToggleShortcut : '',
  )
  const [sidebarPlayerExpanded, setSidebarPlayerExpanded] = useState(
    savedUi.sidebarPlayerExpanded !== false,
  )
  const [sidebarPlayerSide, setSidebarPlayerSide] = useState(
    savedUi.sidebarPlayerSide === 'left' ? 'left' : 'right',
  )
  const [windowCanUseSidebarPlayer, setWindowCanUseSidebarPlayer] = useState(false)
  const [windowIsMaximized, setWindowIsMaximized] = useState(false)
  const [shuffleEnabled, setShuffleEnabled] = useState(savedUi.shuffleEnabled || false)
  const [repeatEnabled, setRepeatEnabled] = useState(savedUi.repeatEnabled || false)
  const [currentTrackId, setCurrentTrackId] = useState(null)
  const [editTargetId, setEditTargetId] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkEditDrafts, setBulkEditDrafts] = useState([])
  const [bulkEditInitialDrafts, setBulkEditInitialDrafts] = useState([])
  const [bulkEditSaving, setBulkEditSaving] = useState(false)
  const [bulkCoverMenuTrackId, setBulkCoverMenuTrackId] = useState(null)
  const [bulkCoverTargetTrackId, setBulkCoverTargetTrackId] = useState(null)
  const [pendingCover, setPendingCover] = useState(null)
  const [coverMenuOpen, setCoverMenuOpen] = useState(false)
  const [coverRemovalRequested, setCoverRemovalRequested] = useState(false)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [playlistNameDraft, setPlaylistNameDraft] = useState('')
  const [playlistDescriptionDraft, setPlaylistDescriptionDraft] = useState('')
  const [playlistColorDraft, setPlaylistColorDraft] = useState(playlistColors[0])
  const [playlistCoverDraft, setPlaylistCoverDraft] = useState('')
  const [playlistTxtImporting, setPlaylistTxtImporting] = useState(false)
  const [playlistTxtFileName, setPlaylistTxtFileName] = useState('')
  const [playlistTxtImportedTrackIds, setPlaylistTxtImportedTrackIds] = useState([])
  const [playlistTxtEntriesDraft, setPlaylistTxtEntriesDraft] = useState([])
  const [playlistTxtReviewOpen, setPlaylistTxtReviewOpen] = useState(false)
  const [playlistTxtReviewItems, setPlaylistTxtReviewItems] = useState([])
  const [playlistTxtPreviewingTrackId, setPlaylistTxtPreviewingTrackId] = useState(null)
  const [playlistTxtImportPlaylistId, setPlaylistTxtImportPlaylistId] = useState('')
  const playlistTxtPreviewAudioRef = useRef(null)
  const playlistTxtPreviewTimerRef = useRef(null)
  const playlistTxtImportCancelRef = useRef(false)
  const playlistTxtImportNoticeIdRef = useRef('')
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [playlistEditDraft, setPlaylistEditDraft] = useState('')
  const [playlistEditDescriptionDraft, setPlaylistEditDescriptionDraft] = useState('')
  const [playlistEditColorDraft, setPlaylistEditColorDraft] = useState(playlistColors[0])
  const [playlistEditCoverDraft, setPlaylistEditCoverDraft] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [dockFavoritePulseId, setDockFavoritePulseId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(typeof savedUi.volume === 'number' ? savedUi.volume : 0.85)
  const [monoAudioEnabled, setMonoAudioEnabled] = useState(Boolean(savedUi.monoAudioEnabled))
  const [equalizerGains, setEqualizerGains] = useState(() => Array.isArray(savedUi.equalizerGains) ? savedUi.equalizerGains.slice(0, equalizerBands.length) : Array(equalizerBands.length).fill(0))
  const equalizerGainsRef = useRef(equalizerGains)
  const [audioOutputs, setAudioOutputs] = useState([])
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(savedUi.audioOutputId || 'default')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('audio')
  const [consoleAccessHash, setConsoleAccessHash] = useState(savedUi.consoleAccessHash || '')
  const [consoleAccessSalt, setConsoleAccessSalt] = useState(savedUi.consoleAccessSalt || '')
  const [consoleUnlocked, setConsoleUnlocked] = useState(false)
  const [consoleSecretInput, setConsoleSecretInput] = useState('')
  const [consoleSecretConfirm, setConsoleSecretConfirm] = useState('')
  const [consoleAuthError, setConsoleAuthError] = useState('')
  const [statsOpen, setStatsOpen] = useState(false)
  const [monthlyRecapOpen, setMonthlyRecapOpen] = useState(false)
  const [monthlyRecapStep, setMonthlyRecapStep] = useState(0)
  const [monthlyRecapSnapshot, setMonthlyRecapSnapshot] = useState(null)
  const [monthlyRecapDelayedMessage, setMonthlyRecapDelayedMessage] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [updaterUiState, setUpdaterUiState] = useState({
    supported: false,
    checking: false,
    updateAvailable: false,
    downloading: false,
    downloaded: false,
    progressPercent: 0,
    latestVersion: '',
    error: '',
  })
  const [updaterManualCheckUpToDate, setUpdaterManualCheckUpToDate] = useState(false)
  const updaterManualCheckPendingRef = useRef(false)
  const [notificationsPanelPosition, setNotificationsPanelPosition] = useState({
    top: 80,
    left: 16,
    width: 420,
  })
  const [downloadsOpen, setDownloadsOpen] = useState(false)
  const [downloadJobs, setDownloadJobs] = useState([])
  const [downloadFilter, setDownloadFilter] = useState('all')
  const [downloadsConsoleOpen, setDownloadsConsoleOpen] = useState(false)
  const [downloadsConsoleLines, setDownloadsConsoleLines] = useState([])
  const downloadStatusMapRef = useRef(new Map())
  const [downloadsPanelPosition, setDownloadsPanelPosition] = useState({
    top: 80,
    left: 16,
    width: 460,
  })
  const [fullscreenTrackOpen, setFullscreenTrackOpen] = useState(false)
  const [fullscreenQueueOpen, setFullscreenQueueOpen] = useState(false)
  const [fullscreenAudioLevel, setFullscreenAudioLevel] = useState(0)
  const [lyricsOpen, setLyricsOpen] = useState(false)
  const [playerCoverRefreshKey, setPlayerCoverRefreshKey] = useState(0)
  const [activeCoverTone, setActiveCoverTone] = useState('')
  const [queueOpen, setQueueOpen] = useState(false)
  const [dockPointerInside, setDockPointerInside] = useState(false)
  const [dockProximityVisible, setDockProximityVisible] = useState(true)
  const [rightPanelTab, setRightPanelTab] = useState('artist')
  const [artistProfileOpen, setArtistProfileOpen] = useState(false)
  const [artistProfileName, setArtistProfileName] = useState('')
  const [artistProfileSelectedAlbumKey, setArtistProfileSelectedAlbumKey] = useState('')
  const [artistProfileYtAlbums, setArtistProfileYtAlbums] = useState([])
  const [artistProfileYtSingles, setArtistProfileYtSingles] = useState([])
  const [artistProfileYtTopSongs, setArtistProfileYtTopSongs] = useState([])
  const [artistProfileYtLoading, setArtistProfileYtLoading] = useState(false)
  const [artistProfileSelectedYtAlbumKey, setArtistProfileSelectedYtAlbumKey] = useState('')
  const [artistProfileSelectedYtSingleKey, setArtistProfileSelectedYtSingleKey] = useState('')
  const [artistReleaseModalOpen, setArtistReleaseModalOpen] = useState(false)
  const [artistProfileReleaseTracksByKey, setArtistProfileReleaseTracksByKey] = useState({})
  const [artistProfileReleaseLoadingKey, setArtistProfileReleaseLoadingKey] = useState('')
  const [artistProfileDownloadingIds, setArtistProfileDownloadingIds] = useState(new Set())
  const [artistProfileFacts, setArtistProfileFacts] = useState(null)
  const [artistProfileFactsLoading, setArtistProfileFactsLoading] = useState(false)
  const [albumInfoOpen, setAlbumInfoOpen] = useState(false)
  const [albumInfoLoading, setAlbumInfoLoading] = useState(false)
  const [albumInfo, setAlbumInfo] = useState(null)
  const [albumInfoYtTracks, setAlbumInfoYtTracks] = useState([])
  const [albumInfoYtTracksLoading, setAlbumInfoYtTracksLoading] = useState(false)
  const [albumInfoDownloadingIds, setAlbumInfoDownloadingIds] = useState(new Set())
  const [coverTransitionWashVisible, setCoverTransitionWashVisible] = useState(false)
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [lyricsText, setLyricsText] = useState('')
  const [lyricsError, setLyricsError] = useState('')
  const [fullscreenControlsVisible, setFullscreenControlsVisible] = useState(false)
  const fullscreenControlsTimerRef = useRef(null)
  const notificationsButtonRef = useRef(null)
  const downloadsButtonRef = useRef(null)
  const [trackMenuId, setTrackMenuId] = useState(null)
  const [trackMenuPosition, setTrackMenuPosition] = useState(null)
  const [playlistContextMenuId, setPlaylistContextMenuId] = useState(null)
  const [playlistContextMenuPosition, setPlaylistContextMenuPosition] = useState(null)
  const [pendingDeleteTrackId, setPendingDeleteTrackId] = useState(null)
  const [pendingDeletePlaylistId, setPendingDeletePlaylistId] = useState(null)
  const [pendingResetCache, setPendingResetCache] = useState(false)
  const [pendingFactoryReset, setPendingFactoryReset] = useState(false)
  const [restoringLegacyData, setRestoringLegacyData] = useState(false)
  const [manualTrackRepairRequest, setManualTrackRepairRequest] = useState(0)
  const [draggedTrackId, setDraggedTrackId] = useState(null)
  const [dragOverTrackId, setDragOverTrackId] = useState(null)
  const [queueDraggedTrackId, setQueueDraggedTrackId] = useState(null)
  const [queueDragOverTrackId, setQueueDragOverTrackId] = useState(null)
  const [dockPlaylistMenuOpen, setDockPlaylistMenuOpen] = useState(false)
  const [artistFactsLoading, setArtistFactsLoading] = useState(false)
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState(null)
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState(null)
  const [queuedNextTrackIds, setQueuedNextTrackIds] = useState([])
  const queuedNextTrackIdsRef = useRef([])
  const [shuffleOrderIds, setShuffleOrderIds] = useState([])
  const shuffleOrderIdsRef = useRef([])
  const shuffleSeedRef = useRef(`${Date.now()}-${Math.random()}`)
  const [artistFacts, setArtistFacts] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [playlistAddOpen, setPlaylistAddOpen] = useState(false)
  const [playlistAddSearchQuery, setPlaylistAddSearchQuery] = useState('')
  const [trackListLayoutVersion, setTrackListLayoutVersion] = useState(0)
  const [virtualScrollTop, setVirtualScrollTop] = useState(0)
  const [virtualViewportHeight, setVirtualViewportHeight] = useState(0)
  const [appBackgrounded, setAppBackgrounded] = useState(() =>
    typeof document !== 'undefined' ? (document.hidden || !document.hasFocus?.()) : false,
  )
  const [playStats, setPlayStats] = useState(() =>
    loadJson(PLAY_STATS_KEY, {
      totalSeconds: 0,
      trackSeconds: {},
      trackPlayCount: {},
      monthlyTrackSeconds: {},
    }),
  )
  const [listenHistory, setListenHistory] = useState(() => loadJson(LISTEN_HISTORY_KEY, []))
  const [historyFilterDate, setHistoryFilterDate] = useState('')
  const [historyFilterQuery, setHistoryFilterQuery] = useState('')
  const playStatsRef = useRef(playStats)
  const listenHistoryRef = useRef(listenHistory)
  const listenStartLockRef = useRef({ trackId: '', at: 0 })
  const monthlyRecapPlaybackSnapshotRef = useRef(null)
  const monthlyRecapOpenRef = useRef(false)
  const poolAdminLoadRequestRef = useRef(0)
  const youtubeSearchRequestRef = useRef(0)
  const topbarYoutubeSearchRequestRef = useRef(0)
  const topbarYoutubeAutoSearchKeyRef = useRef('')
  const dragCounterRef = useRef(0)
  const addFilesToLibraryRef = useRef(null)
  const switchTrackRef = useRef(null)
  const trackSwitchCooldownUntilRef = useRef(0)
  const trackSwitchFadeUntilRef = useRef(0)
  const lastSavedUiPrefsRef = useRef('')
  const lastSavedPlaylistsRef = useRef('')
  const lastSavedFavoritesRef = useRef('')
  const lastSavedPinnedRef = useRef('')
  const lastPersistedTracksSignatureRef = useRef('')
  const playbackSequenceRef = useRef(null)
  const playbackSequenceDragRef = useRef({
    active: false,
    pointerId: null,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  })
  const fullscreenAudioRafRef = useRef(null)
  const isPlayingRef = useRef(isPlaying)
  const serverMetaAttemptedAtRef = useRef({})
  const serverMetaInFlightRef = useRef(new Set())
  const artistProfileYtCacheRef = useRef(loadJsonCache(ARTIST_PROFILE_YT_CACHE_KEY))
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [exportingLibrary, setExportingLibrary] = useState(false)
  const [addMode, setAddMode] = useState('choose')
  const [linkDraft, setLinkDraft] = useState({
    title: '',
    artist: '',
    audioUrl: '',
    coverUrl: '',
  })
  const [linkAddSuccessSignature, setLinkAddSuccessSignature] = useState('')
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('')
  const [youtubeSearchLoading, setYoutubeSearchLoading] = useState(false)
  const [youtubeSearchResults, setYoutubeSearchResults] = useState([])
  const [youtubeSearchRootResults, setYoutubeSearchRootResults] = useState([])
  const [youtubeSearchAlbumViewTitle, setYoutubeSearchAlbumViewTitle] = useState('')
  const [youtubeSearchError, setYoutubeSearchError] = useState('')
  const [topbarYoutubeQuery, setTopbarYoutubeQuery] = useState('')
  const [topbarYoutubeFilter, setTopbarYoutubeFilter] = useState('all')
  const [dependencyNoticeOpen, setDependencyNoticeOpen] = useState(false)
  const [dependencyStatus, setDependencyStatus] = useState(MANUAL_DEPENDENCY_STATUS)
  const [dependencyAutoInstalling, setDependencyAutoInstalling] = useState(false)
  const [dependencyAutoInstallLogs, setDependencyAutoInstallLogs] = useState([])
  const [dependencyAutoInstallError, setDependencyAutoInstallError] = useState('')
  const [dependencyRestartNotice, setDependencyRestartNotice] = useState(false)
  const dependencyAutoInstallStartedRef = useRef(false)
  const [firstRunWizardOpen, setFirstRunWizardOpen] = useState(false)
  const [firstRunWizardStep, setFirstRunWizardStep] = useState(1)
  const [firstRunDependencyStatus, setFirstRunDependencyStatus] = useState(MANUAL_DEPENDENCY_STATUS)
  const [firstRunDependencyLoading, setFirstRunDependencyLoading] = useState(false)
  const [firstRunDependencyError, setFirstRunDependencyError] = useState('')
  const [topbarYoutubeLoading, setTopbarYoutubeLoading] = useState(false)
  const [topbarYoutubeResults, setTopbarYoutubeResults] = useState([])
  const [topbarYoutubeRootResults, setTopbarYoutubeRootResults] = useState([])
  const [topbarYoutubeAlbumViewTitle, setTopbarYoutubeAlbumViewTitle] = useState('')
  const [topbarYoutubeError, setTopbarYoutubeError] = useState('')
  const [topbarYoutubeAddingIds, setTopbarYoutubeAddingIds] = useState(() => new Set())
  const [topbarYoutubeAddedIds, setTopbarYoutubeAddedIds] = useState(() => new Set())
  const [homeOfficialYtMusicRows, setHomeOfficialYtMusicRows] = useState([])
  const [homeLatestRelease, setHomeLatestRelease] = useState(() => {
    const cached = loadJsonCache(HOME_LATEST_RELEASE_CACHE_KEY)
    return cached?.current || null
  })
  const [homeLatestReleaseNext, setHomeLatestReleaseNext] = useState(() => {
    const cached = loadJsonCache(HOME_LATEST_RELEASE_CACHE_KEY)
    return cached?.next || null
  })
  const [homeLatestReleaseLoading, setHomeLatestReleaseLoading] = useState(false)
  const [homeMoodPlaylists, setHomeMoodPlaylists] = useState(() => {
    const cached = loadJsonCache(HOME_MOOD_PLAYLISTS_CACHE_KEY)
    return Array.isArray(cached?.items) ? cached.items : []
  })
  const [homeMoodLoading, setHomeMoodLoading] = useState(false)
  const [homeArtistSeeds, setHomeArtistSeeds] = useState([])
  const homeArtistSeedsInitializedRef = useRef(false)
  const [homeMoodModalOpen, setHomeMoodModalOpen] = useState(false)
  const [homeMoodModalTitle, setHomeMoodModalTitle] = useState('')
  const [homeMoodModalTracks, setHomeMoodModalTracks] = useState([])
  const [homeMoodModalLoading, setHomeMoodModalLoading] = useState(false)
  const [homeMoodDownloadingIds, setHomeMoodDownloadingIds] = useState(() => new Set())
  const homeLatestReleaseNextRef = useRef(null)
  const [poolDraft, setPoolDraft] = useState({
    title: '',
    artist: '',
    audioFile: null,
    coverFile: null,
  })
  const [poolAdminOpen, setPoolAdminOpen] = useState(false)
  const [poolAdminUnlocked, setPoolAdminUnlocked] = useState(false)
  const [poolAdminPasswordInput, setPoolAdminPasswordInput] = useState('')
  const [poolAdminAuthError, setPoolAdminAuthError] = useState('')
  const [poolAdminTracks, setPoolAdminTracks] = useState([])
  const [poolAdminNotice, setPoolAdminNotice] = useState('')
  const [poolAdminLoading, setPoolAdminLoading] = useState(false)
  const [poolAdminSearchQuery, setPoolAdminSearchQuery] = useState('')
  const [poolGithubOwner, setPoolGithubOwner] = useState(savedUi.poolGithubOwner || '')
  const [poolGithubRepo, setPoolGithubRepo] = useState(savedUi.poolGithubRepo || '')
  const [poolGithubBranch, setPoolGithubBranch] = useState(savedUi.poolGithubBranch || 'main')
  const [poolGithubPath, setPoolGithubPath] = useState(savedUi.poolGithubPath || 'tracks.json')
  const [poolGithubToken, setPoolGithubToken] = useState(savedUi.poolGithubToken || '')
  const googleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
  const googleClientSecret = String(import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '').trim()
  const spotifyClientId = String(import.meta.env.VITE_SPOTIFY_CLIENT_ID || '').trim()
  const spotifyClientSecret = String(import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '').trim()
  const [youtubeAuthStatus, setYoutubeAuthStatus] = useState({ connected: false, channelTitle: '', channelId: '' })
  const [youtubeAuthLoading, setYoutubeAuthLoading] = useState(false)
  const [youtubeImportOpen, setYoutubeImportOpen] = useState(false)
  const [youtubePlaylists, setYoutubePlaylists] = useState([])
  const [youtubePlaylistsLoading, setYoutubePlaylistsLoading] = useState(false)
  const [youtubeImportingPlaylistId, setYoutubeImportingPlaylistId] = useState('')
  const [spotifyAuthStatus, setSpotifyAuthStatus] = useState(() => {
    const saved = loadJson('nova-player-spotify-auth-status', { connected: false, accountLabel: '' })
    return {
      connected: Boolean(saved?.connected),
      accountLabel: String(saved?.accountLabel || '').trim(),
    }
  })
  const [updaterCenterModalOpen, setUpdaterCenterModalOpen] = useState(false)
  const [spotifyAuthLoading, setSpotifyAuthLoading] = useState(false)
  const [spotifyImportLoading, setSpotifyImportLoading] = useState(false)
  const [spotifyImportOpen, setSpotifyImportOpen] = useState(false)
  const [spotifyPlaylists, setSpotifyPlaylists] = useState([])
  const [spotifyPlaylistsLoading, setSpotifyPlaylistsLoading] = useState(false)
  const [spotifyImportingPlaylistId, setSpotifyImportingPlaylistId] = useState('')
  const [poolGithubSaving, setPoolGithubSaving] = useState(false)
  const [reportIssueOpen, setReportIssueOpen] = useState(false)
  const [reportIssueSubmitting, setReportIssueSubmitting] = useState(false)
  const [reportIssueDraft, setReportIssueDraft] = useState({
    title: '',
    subject: '',
    description: '',
  })
  const textSet = UI_TEXT[language] || UI_TEXT.tr
  const t = useCallback(
    (key, fallback = '') => {
      const value = textSet[key]
      return typeof value === 'string' ? value : fallback
    },
    [textSet],
  )
  const tf = useCallback(
    (key, vars = {}, fallback = '') => {
      const template = t(key, fallback)
      return Object.entries(vars).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        template,
      )
    },
    [t],
  )
  const tt = useCallback(
    (trText = '', enText = '') => (language === 'en' ? enText || trText : trText),
    [language],
  )
  const [trackSearchQuery, setTrackSearchQuery] = useState('')
  const [hideDownloadedPoolTracks, setHideDownloadedPoolTracks] = useState(false)
  const [poolArtistFilter, setPoolArtistFilter] = useState('all')
  const [poolDownloadingTrackId, setPoolDownloadingTrackId] = useState(null)
  const [poolBulkDownloading, setPoolBulkDownloading] = useState(false)
  const [poolSelectedTrackIds, setPoolSelectedTrackIds] = useState([])
  const poolSelectionAnchorIdRef = useRef(null)
  const [poolRefreshing, setPoolRefreshing] = useState(false)

  useEffect(() => {
    homeLatestReleaseNextRef.current = homeLatestReleaseNext || null
  }, [homeLatestReleaseNext])

  useEffect(() => {
    try {
      localStorage.setItem(
        HOME_LATEST_RELEASE_CACHE_KEY,
        JSON.stringify({
          current: homeLatestRelease || null,
          next: homeLatestReleaseNext || null,
          savedAt: Date.now(),
        }),
      )
    } catch {
      // ignore
    }
  }, [homeLatestRelease, homeLatestReleaseNext])

  useEffect(() => {
    try {
      localStorage.setItem(
        HOME_MOOD_PLAYLISTS_CACHE_KEY,
        JSON.stringify({
          items: homeMoodPlaylists,
          savedAt: Date.now(),
        }),
      )
    } catch {
      // ignore
    }
  }, [homeMoodPlaylists])
  const [playbackCollectionId, setPlaybackCollectionId] = useState(() => {
    const savedPlaybackCollectionId = String(savedUi.playbackCollectionId || '').trim()
    if (savedPlaybackCollectionId === 'pool' || savedPlaybackCollectionId === 'server') {
      return 'all'
    }
    const selected = String(savedUi.selectedCollectionId || '').trim()
    const normalizedSelected = selected === 'home' ? 'all' : (selected || 'all')
    return savedPlaybackCollectionId || normalizedSelected
  })

  const getScrollableScrollTopTargets = useCallback(() => {
    if (typeof document === 'undefined') {
      return []
    }
    return Array.from(document.querySelectorAll(SCROLL_TOP_TARGET_SELECTOR)).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false
      }
      if (element.offsetParent === null) {
        return false
      }
      if (element.scrollHeight <= element.clientHeight + 24) {
        return false
      }
      return element.scrollTop > 120
    })
  }, [])

  const isScrollableScrollTopTarget = useCallback((element) => {
    if (!(element instanceof HTMLElement)) {
      return false
    }
    if (element.offsetParent === null) {
      return false
    }
    if (element.closest('.player-panel')) {
      return false
    }
    if (element.closest('.playlist-rail')) {
      return false
    }
    return element.scrollHeight > element.clientHeight + 24
  }, [])

  const getScrollTopButtonLeftForTarget = useCallback((element) => {
    if (typeof window === 'undefined' || !(element instanceof HTMLElement)) {
      return null
    }
    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const targetCenter = rect.left + rect.width / 2
    const safeCenter = Math.min(Math.max(targetCenter, 96), Math.max(96, viewportWidth - 96))
    return `${Math.round(safeCenter)}px`
  }, [])

  const updateScrollTopButtonVisibility = useCallback((sourceTarget = null) => {
    let nextTarget = null
    if (sourceTarget instanceof HTMLElement) {
      const closestTarget = sourceTarget.closest(SCROLL_TOP_TARGET_SELECTOR)
      if (isScrollableScrollTopTarget(closestTarget)) {
        nextTarget = closestTarget
      } else if (isScrollableScrollTopTarget(sourceTarget)) {
        nextTarget = sourceTarget
      }
    }

    const targets = nextTarget ? [nextTarget] : getScrollableScrollTopTargets()
    if (!targets.length) {
      scrollTopTargetRef.current = null
      const prev = scrollTopUiStateRef.current
      if (prev.visible || prev.left !== null || prev.target) {
        scrollTopUiStateRef.current = { visible: false, left: null, target: null }
        setShowScrollTopButton(false)
        setScrollTopButtonLeft(null)
      }
      return
    }

    if (!nextTarget && scrollTopTargetRef.current && targets.includes(scrollTopTargetRef.current)) {
      nextTarget = scrollTopTargetRef.current
    }

    if (!nextTarget) {
      nextTarget = targets.reduce(
        (highest, element) => (element.scrollTop > highest.scrollTop ? element : highest),
        targets[0],
      )
    }

    scrollTopTargetRef.current = nextTarget
    const nextVisible = nextTarget.scrollTop > 120
    const nextLeft = nextVisible ? getScrollTopButtonLeftForTarget(nextTarget) : null
    const prev = scrollTopUiStateRef.current
    if (prev.visible !== nextVisible || prev.left !== nextLeft || prev.target !== nextTarget) {
      scrollTopUiStateRef.current = {
        visible: nextVisible,
        left: nextLeft,
        target: nextTarget,
      }
      setShowScrollTopButton(nextVisible)
      setScrollTopButtonLeft(nextLeft)
    }
  }, [getScrollTopButtonLeftForTarget, getScrollableScrollTopTargets, isScrollableScrollTopTarget])

  const scrollAllListsToTop = useCallback(() => {
    const target = scrollTopTargetRef.current
    if (target instanceof HTMLElement && target.scrollTop > 0) {
      target.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        updateScrollTopButtonVisibility(target)
      }, 320)
      return
    }

    updateScrollTopButtonVisibility()
  }, [updateScrollTopButtonVisibility])

  // Dependency check: local only (no automatic remote install).
  useEffect(() => {
    const checkDeps = async () => {
      try {
        const result =
          (await window.electron?.invoke?.('check:dependencies')) || MANUAL_DEPENDENCY_STATUS
        setDependenciesStatus(result)
        const missing = [
          ...(Array.isArray(result?.missing) ? result.missing : []),
          ...(Array.isArray(result?.missingPython) ? result.missingPython : []),
        ]
        setShowDependenciesModal(missing.length > 0)
      } catch {
        setDependenciesStatus(MANUAL_DEPENDENCY_STATUS)
      }
    }
    checkDeps()
  }, [])

  useEffect(() => {
    if (homeArtistSeedsInitializedRef.current) {
      return
    }
    const uniqueArtists = Array.from(
      new Set(
        tracks
          .map((track) => String(track?.artist || '').trim())
          .filter(Boolean),
      ),
    )
    if (!uniqueArtists.length) {
      return
    }
    const shuffled = [...uniqueArtists].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, 10)
    homeArtistSeedsInitializedRef.current = true
    setHomeArtistSeeds(selected)
  }, [tracks])

  useEffect(() => {
    let cancelled = false
    const pickRandomArtists = () => {
      if (homeArtistSeeds.length) return homeArtistSeeds
      return []
    }

    const buildOwnedSignatures = () =>
      tracks
        .map((track) => `${String(track?.artist || '').trim()}|||${String(track?.title || '').trim()}`)
        .filter((item) => item !== '|||')

    const fetchOne = async (seedValue = '') => {
      const artistSeeds = pickRandomArtists()
      const ownedSignatures = buildOwnedSignatures()
      if (!artistSeeds.length) return null
      const result = await window.novaPlayer.getYtMusicRandomMissingSong({
        artists: artistSeeds,
        ownedSignatures,
        seed: seedValue || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      })
      return result?.ok ? (result?.item || null) : null
    }

    const loadHomeLatestRelease = async () => {
      if (!window?.novaPlayer?.getYtMusicRandomMissingSong) {
        return
      }
      const artistSeeds = pickRandomArtists()
      if (!artistSeeds.length) {
        return
      }

      if (!homeLatestRelease) {
        setHomeLatestReleaseLoading(true)
      }
      try {
        const current = homeLatestRelease || (await fetchOne(new Date().toISOString().slice(0, 10)))
        const next = homeLatestReleaseNextRef.current || (await fetchOne(`${Date.now()}-next`))
        if (!cancelled) {
          if (current) {
            setHomeLatestRelease(current)
          }
          setHomeLatestReleaseNext(next || null)
          homeLatestReleaseNextRef.current = next || null
        }
      } catch {
        // mevcut öneriyi koru
      } finally {
        if (!cancelled) setHomeLatestReleaseLoading(false)
      }
    }
    loadHomeLatestRelease()

    const timer = window.setInterval(async () => {
      if (cancelled || !window?.novaPlayer?.getYtMusicRandomMissingSong) return
      try {
        const nextCurrent = homeLatestReleaseNextRef.current
        if (nextCurrent && !cancelled) {
          setHomeLatestRelease(nextCurrent)
        }
        // Sadece bir sonraki öneriyi önceden hazırlıyoruz.
        const nextQueued = await fetchOne(`${Date.now()}-queued`)
        if (!cancelled) {
          setHomeLatestReleaseNext(nextQueued || null)
          homeLatestReleaseNextRef.current = nextQueued || null
        }
      } catch {
        // keep current suggestion
      }
    }, HOME_LATEST_ROTATE_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [homeArtistSeeds])

  const refreshHomeMoodPlaylists = useCallback(async ({ initial = false } = {}) => {
    if (!window?.novaPlayer?.getYtMusicSimilarPlaylists) {
      return
    }
    if (initial && homeMoodPlaylists.length) {
      return
    }

    const artistSeeds = (homeArtistSeeds.length
      ? homeArtistSeeds
      : [...new Set(tracks.map((track) => String(track?.artist || '').trim()).filter(Boolean))])
      .slice(0, 10)
    if (!artistSeeds.length) {
      return
    }

    setHomeMoodLoading(true)
    try {
      const merged = []
      for (const artistName of artistSeeds) {
        try {
          const result = await window.novaPlayer.getYtMusicSimilarPlaylists({ artists: [artistName] })
          const items = Array.isArray(result?.playlists) ? result.playlists.slice(0, 2) : []
          items.forEach((item) => merged.push({ ...item, artistSeed: artistName }))
        } catch {
          // skip one artist
        }
      }

      const nextItems = merged.map((item, index) => ({
        id: String(item.id || `mood-${index}`),
        playlistId: String(item.playlistId || item.id || ''),
        title: String(item.title || 'Playlist'),
        artist: String(item.artist || item.artistSeed || 'YouTube Music'),
        thumbnail: String(item.thumbnail || ''),
        mood: String(item.mood || 'Mood'),
      }))

      if (nextItems.length) {
        setHomeMoodPlaylists(nextItems)
      }
    } finally {
      setHomeMoodLoading(false)
    }
  }, [homeArtistSeeds, homeMoodPlaylists.length, tracks])

  useEffect(() => {
    refreshHomeMoodPlaylists({ initial: true })
  }, [refreshHomeMoodPlaylists])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let rafId = null
    let lastTickAt = 0
    let pendingTarget = null
    const THROTTLE_MS = lowPowerModeEnabled || reduceAnimationsEnabled || appBackgrounded ? 180 : 90
    const handleScroll = (event) => {
      pendingTarget =
        event && 'target' in event && event.target instanceof HTMLElement ? event.target : null
      if (rafId) {
        return
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        const now = Date.now()
        if (now - lastTickAt < THROTTLE_MS) {
          return
        }
        lastTickAt = now
        updateScrollTopButtonVisibility(pendingTarget)
        pendingTarget = null
      })
    }
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
        rafId = null
      }
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [appBackgrounded, lowPowerModeEnabled, reduceAnimationsEnabled, updateScrollTopButtonVisibility])

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined
    }

    const updateBackgroundState = () => {
      const hidden = document.hidden || document.visibilityState === 'hidden' || !document.hasFocus?.()
      setAppBackgrounded(hidden)
    }

    updateBackgroundState()
    document.addEventListener('visibilitychange', updateBackgroundState)
    window.addEventListener('blur', updateBackgroundState)
    window.addEventListener('focus', updateBackgroundState)
    return () => {
      document.removeEventListener('visibilitychange', updateBackgroundState)
      window.removeEventListener('blur', updateBackgroundState)
      window.removeEventListener('focus', updateBackgroundState)
    }
  }, [])

  useEffect(() => {
    if (!coverMenuOpen || typeof window === 'undefined') {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('.editor-cover-wrap')) {
        return
      }
      setCoverMenuOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [coverMenuOpen])

  useEffect(() => {
    if (!bulkCoverMenuTrackId || typeof window === 'undefined') {
      return undefined
    }

    const handlePointerDown = (event) => {
      const target = event.target
      if (target instanceof Element && target.closest('.bulk-edit-cover-wrap')) {
        return
      }
      setBulkCoverMenuTrackId(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [bulkCoverMenuTrackId])
  const persistStateRef = useRef({
    selectedCollectionId,
    playbackCollectionId,
    currentTrackId,
    progress,
    volume,
    isPlaying,
    equalizerGains,
  })
  const playlistCoverInputRef = useRef(null)
  const playlistTxtInputRef = useRef(null)
  const playlistEditCoverInputRef = useRef(null)
  const bulkCoverInputRef = useRef(null)
  const homePlaylistRowRef = useRef(null)
  const homePinnedRowRef = useRef(null)
  const homeMoodRowRef = useRef(null)
  const dockFavoritePulseTimerRef = useRef(null)
  const audioOutputApplyRef = useRef({ deviceId: '', applying: false })
  const canSelectAudioOutput =
    typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype

  const allTracks = useMemo(() => [...tracks, ...serverTracks], [tracks, serverTracks])
  const genreCollections = useMemo(() => {
    const genreBuckets = new Map()
    for (const track of tracks) {
      const genreName = normalizeGenreName(track.genre || '')
      if (!genreName) {
        continue
      }
      const normalizedKey = normalizeCoverMatchText(genreName)
      if (!normalizedKey) {
        continue
      }
      if (!genreBuckets.has(normalizedKey)) {
        genreBuckets.set(normalizedKey, {
          id: `genre:${encodeURIComponent(normalizedKey)}`,
          key: normalizedKey,
          name: genreName,
          description: `${genreName} türündeki şarkılar`,
          color: playlistColors[(hashSeed(normalizedKey) % playlistColors.length + playlistColors.length) % playlistColors.length],
          coverUrl: '',
          trackIds: [],
          isGeneratedGenre: true,
        })
      }

      const bucket = genreBuckets.get(normalizedKey)
      bucket.trackIds.push(track.id)
      if (!bucket.coverUrl) {
        bucket.coverUrl = getTrackDisplayUrl(track, 'thumb') || ''
      }
    }

    return Array.from(genreBuckets.values())
      .filter((item) => item.trackIds.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name, 'tr-TR'))
  }, [tracks])
  const trackByIdMap = useMemo(() => {
    const map = new Map()
    for (const track of tracks) {
      map.set(track.id, track)
    }
    return map
  }, [tracks])
  const currentTrack = allTracks.find((track) => track.id === currentTrackId) || null
  const editingTrack = allTracks.find((track) => track.id === editTargetId) || null
  const currentPlaylist = playlists.find((playlist) => playlist.id === selectedCollectionId) || null
  const currentGenreCollection =
    genreCollections.find((collection) => collection.id === selectedCollectionId) || null
  const activePlaylistCollection = currentPlaylist || currentGenreCollection || null
  const pendingDeleteTrack = tracks.find((track) => track.id === pendingDeleteTrackId) || null
  const pendingDeletePlaylist = playlists.find((playlist) => playlist.id === pendingDeletePlaylistId) || null
  const currentCoverUrl = getTrackCoverUrl(currentTrack)
  const currentCoverTone = activeCoverTone || currentTrack?.coverTone || currentTrack?.gradient || gradients[0]
  const currentCoverColors = getReadableCoverColors(currentCoverTone)
  const fullscreenBaseRgb = parseColorToRgb(currentCoverTone)
  const fullscreenBackgroundIsBright = fullscreenBaseRgb
    ? ((fullscreenBaseRgb.r * 299 + fullscreenBaseRgb.g * 587 + fullscreenBaseRgb.b * 114) / 1000) > 172
    : false
  const fullscreenUseDarkReadability =
    !fullscreenEffectsEnabled &&
    (fullscreenBackgroundIsBright || currentCoverColors.fg === '#111111' || currentCoverColors.fg === '#0f172a')
  const fullscreenCoverColors = fullscreenUseDarkReadability
    ? {
        fg: '#0f172a',
        fgSoft: 'rgba(15, 23, 42, 0.82)',
        fgMuted: 'rgba(15, 23, 42, 0.68)',
      }
    : {
        fg: '#ffffff',
        fgSoft: 'rgba(255, 255, 255, 0.78)',
        fgMuted: 'rgba(255, 255, 255, 0.64)',
      }
  const fullscreenControlBg = fullscreenUseDarkReadability
    ? 'rgba(15, 23, 42, 0.16)'
    : 'rgba(255, 255, 255, 0.16)'
  const fullscreenControlBorder = fullscreenUseDarkReadability
    ? 'rgba(15, 23, 42, 0.22)'
    : 'rgba(255, 255, 255, 0.18)'
  const currentThemeColor =
    selectedCollectionId === 'favorites'
      ? '#ef4444'
      : selectedCollectionId === 'server'
        ? '#06b6d4'
      : activePlaylistCollection?.color || '#60a5fa'
  const fullscreenGradient = useMemo(() => {
    const base = parseColorToRgb(currentCoverTone) || parseColorToRgb(currentThemeColor) || { r: 22, g: 24, b: 30 }
    const accent = parseColorToRgb(currentThemeColor) || { r: 85, g: 140, b: 255 }
    const mid = mixRgbColor(base, accent, 0.32)
    const glow = mixRgbColor(accent, { r: 255, g: 255, b: 255 }, 0.18)
    const deep = mixRgbColor(base, { r: 5, g: 8, b: 14 }, 0.62)
    return {
      background: `
        radial-gradient(120% 140% at 12% 10%, ${rgbToRgbaCss(glow, 0.34)} 0%, transparent 42%),
        radial-gradient(120% 120% at 88% 14%, ${rgbToRgbaCss(mid, 0.30)} 0%, transparent 48%),
        linear-gradient(160deg, ${rgbToRgbaCss(mid, 0.94)} 0%, ${rgbToRgbaCss(deep, 0.98)} 65%, rgba(7, 10, 15, 0.99) 100%)
      `,
      orbA: rgbToRgbaCss(glow, 0.42),
      orbB: rgbToRgbaCss(mid, 0.35),
      orbC: rgbToRgbaCss(base, 0.3),
    }
  }, [currentCoverTone, currentThemeColor])
  const coverBasedBackground = useMemo(() => {
    const base = parseColorToRgb(currentCoverTone)
    if (!base) {
      return null
    }
    const deep = mixRgbColor(base, { r: 6, g: 9, b: 14 }, 0.58)
    const glow = mixRgbColor(base, { r: 255, g: 255, b: 255 }, 0.14)
    return {
      color1: `rgb(${base.r}, ${base.g}, ${base.b})`,
      color2: `rgb(${deep.r}, ${deep.g}, ${deep.b})`,
      gradient: `radial-gradient(130% 130% at 12% 10%, ${rgbToRgbaCss(glow, 0.26)} 0%, transparent 42%), linear-gradient(145deg, rgb(${base.r}, ${base.g}, ${base.b}) 0%, rgb(${deep.r}, ${deep.g}, ${deep.b}) 100%)`,
    }
  }, [currentCoverTone])
  const effectiveBackgroundColor1 = coverBasedBackgroundEnabled && coverBasedBackground
    ? coverBasedBackground.color1
    : backgroundColor1
  const effectiveAppBackground = coverBasedBackgroundEnabled && coverBasedBackground
    ? coverBasedBackground.gradient
    : backgroundStyle === 'solid'
      ? backgroundColor1
      : `linear-gradient(145deg, ${backgroundColor1} 0%, ${backgroundColor2} 100%)`
  const brightGradientReadabilityVars = useMemo(() => {
    if (themeMode !== 'transparent') {
      return null
    }

    const first = parseColorToRgb(effectiveBackgroundColor1)
    if (!first) {
      return null
    }

    const brightness = (rgb) => (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
    const firstBrightness = brightness(first)
    if (firstBrightness < 176) {
      return null
    }

    return {
      '--text-primary': '#0f172a',
      '--text-secondary': 'rgba(15, 23, 42, 0.68)',
      '--text-muted': 'rgba(15, 23, 42, 0.56)',
    }
  }, [effectiveBackgroundColor1, themeMode])
  const topbarTitleColor = useMemo(() => {
    const primary = parseColorToRgb(effectiveBackgroundColor1) || parseColorToRgb(currentThemeColor)
    if (!primary) {
      return themeMode === 'light' ? '#0f172a' : '#ffffff'
    }
    const brightness = (primary.r * 299 + primary.g * 587 + primary.b * 114) / 1000
    return brightness >= 176 ? '#0f172a' : '#ffffff'
  }, [currentThemeColor, effectiveBackgroundColor1, themeMode])
  const themeVars = {
    ...getUiThemeVars(themeMode, customThemeColor),
    ...(brightGradientReadabilityVars || {}),
    '--app-bg': effectiveAppBackground,
    '--theme-accent': hexToRgba(themeMode === 'custom' ? customThemeColor : currentThemeColor, 0.24),
    '--theme-accent-soft': hexToRgba(themeMode === 'custom' ? customThemeColor : currentThemeColor, 0.08),
    '--topbar-title-color': topbarTitleColor,
  }
  const runtimeLowPowerEnabled = true
  const cpuCoreCount =
    typeof navigator !== 'undefined' && Number.isFinite(navigator.hardwareConcurrency)
      ? Number(navigator.hardwareConcurrency)
      : 4
  const isLowCoreDevice = cpuCoreCount > 0 && cpuCoreCount <= 4
  const appShellClassName = `app-shell theme-${themeMode} ${brightGradientReadabilityVars ? 'bright-gradient' : ''} ${reduceAnimationsEnabled ? 'motion-reduced' : ''} ${appBackgrounded ? 'backgrounded' : ''} ${runtimeLowPowerEnabled ? 'low-power' : ''} ${firstRunWizardOpen ? 'wizard-open' : ''} ${tracks.length >= 300 ? 'large-library' : ''} ${compactListEnabled ? 'compact-list' : ''} ${showScrollbars ? 'scrollbars-visible' : ''}`.trim()
  const effectiveFullscreenEffectsEnabled =
    Boolean(fullscreenEffectsEnabled) && !reduceAnimationsEnabled && !isLowCoreDevice
  const sidebarPlayerActive = sidebarPlayerExpanded && windowCanUseSidebarPlayer
  const sidebarPlayerIsLeft = sidebarPlayerActive && sidebarPlayerSide === 'left'
  const lyricsViewActive = lyricsOpen || (sidebarPlayerActive && rightPanelTab === 'lyrics')
  const bottomDockVisible =
    dockPointerInside || dockProximityVisible || dockPlaylistMenuOpen || queueOpen || lyricsOpen
  const appShellLayoutClass = `${appShellClassName} ${sidebarPlayerActive ? 'sidebar-player-expanded' : 'sidebar-player-collapsed'} ${sidebarPlayerIsLeft ? 'sidebar-player-left' : 'sidebar-player-right'} ${windowCanUseSidebarPlayer ? 'window-fill' : ''} ${selectedCollectionId === 'home' ? 'collection-home' : ''} ${selectedCollectionId === 'all' ? 'collection-all' : ''}`.trim()
  const activeMonthlyKey = selectedCollectionId.startsWith('monthly:')
    ? selectedCollectionId.slice('monthly:'.length)
    : ''
  const activeCollectionLabel =
    selectedCollectionId === 'home'
      ? t('home', 'Ana menü')
      : selectedCollectionId === 'favorites'
      ? t('favorites', 'Favoriler')
      : activeMonthlyKey
        ? `${formatMonthKeyLabel(activeMonthlyKey, language)} • ${tt('En çok dinlenenler', 'Most played')}`
      : selectedCollectionId === 'pool'
        ? t('publicPool', 'Müzik Havuzu')
        : selectedCollectionId === 'server'
          ? t('serverTracks', 'Sunucudakiler')
          : activePlaylistCollection?.name || t('allTracks', 'Tüm parçalar')
  const activeCollectionDescription =
    selectedCollectionId === 'home'
      ? tt('Keşfet, listeler ve öneriler', 'Discover playlists and recommendations')
      : selectedCollectionId === 'favorites'
      ? tt('Beğendiğin şarkılar', 'Songs you liked')
      : activeMonthlyKey
        ? language === 'en'
          ? `Automatic list for ${formatMonthKeyLabel(activeMonthlyKey, language)}`
          : tt(`${formatMonthKeyLabel(activeMonthlyKey, language)} ayı için otomatik liste`, `Automatic list for ${formatMonthKeyLabel(activeMonthlyKey, language)}`)
      : selectedCollectionId === 'pool'
        ? tt('Havuzdaki parçalar', 'Tracks in the pool')
        : selectedCollectionId === 'server'
          ? tt('Sunucu kaynaklı parçalar', 'Server-sourced tracks')
        : selectedCollectionId === 'all'
          ? tt('Tüm kütüphane', 'Full library')
            : String(activePlaylistCollection?.description || '').trim() || tt('Playlist açıklaması yok', 'No playlist description')
  const activeCollectionCover =
    activePlaylistCollection?.coverUrl || (currentTrack ? getTrackDisplayUrl(currentTrack, 'thumb') : '')
  const activeCollectionColor = activePlaylistCollection?.color || currentThemeColor
  const isCustomPlaylistSelected = Boolean(currentPlaylist)
  const isPlaylistCollectionSelected = Boolean(activePlaylistCollection)
  const presenceProgressStepSeconds = appBackgrounded ? 30 : 5
  const progressBucket = Math.floor(progress / presenceProgressStepSeconds)
  const currentTrackPresenceId = currentTrack?.id || null
  const currentTrackPresenceTitle = currentTrack?.title || ''
  const currentTrackPresenceArtist = currentTrack?.artist || ''
  const currentTrackDisplayTitle = sanitizeDisplayText(currentTrack?.title || '') || tt('Bir parça seç', 'Choose a track')
  const dependencyMissingBase = Array.isArray(dependencyStatus?.missing) ? dependencyStatus.missing : []
  const dependencyMissingPython = Array.isArray(dependencyStatus?.missingPython) ? dependencyStatus.missingPython : []
  const firstRunMissingBase = Array.isArray(firstRunDependencyStatus?.missing) ? firstRunDependencyStatus.missing : []
  const firstRunMissingPython = Array.isArray(firstRunDependencyStatus?.missingPython)
    ? firstRunDependencyStatus.missingPython
    : []
  const dependencyMissingAll = useMemo(
    () => [...dependencyMissingBase, ...dependencyMissingPython].filter(Boolean),
    [dependencyMissingBase, dependencyMissingPython],
  )
  const firstRunMissingAll = useMemo(
    () => [...firstRunMissingBase, ...firstRunMissingPython].filter(Boolean),
    [firstRunMissingBase, firstRunMissingPython],
  )
  const appPlatform = window?.novaPlayer?.platform || ''
  const defaultDependencyInstallCommands = ['python', 'yt-dlp', 'ffmpeg', 'ytmusicapi']
    .map((dep) => getDependencyInstallCommand(dep, appPlatform))
    .filter(Boolean)
    .join('\n')
  const dependencyInstallCommands = dependencyMissingAll
    .map((dep) => getDependencyInstallCommand(dep, appPlatform))
    .filter(Boolean)
    .join('\n')
  const activeTxtImportNoticeId = playlistTxtImportNoticeIdRef.current
  const activeTxtImportNotice = activeTxtImportNoticeId
    ? notifications.find((notice) => notice.id === activeTxtImportNoticeId) || null
    : null
  const notificationsForList = activeTxtImportNotice
    ? notifications.filter((notice) => notice.id !== activeTxtImportNotice.id)
    : notifications
  const doneDownloadCount = useMemo(
    () =>
      downloadJobs.filter((item) =>
        ['completed', 'failed', 'cancelled'].includes(String(item.status || '').trim()),
      ).length,
    [downloadJobs],
  )
  const filteredDownloadJobs = useMemo(() => {
    if (downloadFilter === 'active') {
      return downloadJobs.filter((item) => item.status === 'starting' || item.status === 'downloading')
    }
    if (downloadFilter === 'done') {
      return downloadJobs.filter((item) => ['completed', 'failed', 'cancelled'].includes(String(item.status || '').trim()))
    }
    return downloadJobs
  }, [downloadFilter, downloadJobs])
  const parsedLyrics = useMemo(() => parseLyricsWithTiming(lyricsText), [lyricsText])
  const activeLyricIndex = useMemo(() => {
    if (!lyricsViewActive) {
      return -1
    }
    if (!parsedLyrics.hasTiming || !parsedLyrics.lines.length) {
      return -1
    }
    let activeIndex = -1
    for (let index = 0; index < parsedLyrics.lines.length; index += 1) {
      if (progress >= Number(parsedLyrics.lines[index]?.at || 0)) {
        activeIndex = index
      } else {
        break
      }
    }
    return activeIndex
  }, [lyricsViewActive, parsedLyrics, progress])
  const artistProfileLibraryTracks = useMemo(
    () => sortTracksByOrder(tracks.filter((track) => doesArtistMatch(track.artist || '', artistProfileName))),
    [artistProfileName, tracks],
  )
  const artistProfilePoolTracks = useMemo(
    () => sortTracksByOrder(serverTracks.filter((track) => doesArtistMatch(track.artist || '', artistProfileName))),
    [artistProfileName, serverTracks],
  )
  const artistProfileTracks = useMemo(
    () => [...artistProfileLibraryTracks, ...artistProfilePoolTracks],
    [artistProfileLibraryTracks, artistProfilePoolTracks],
  )

  const topbarSearchGroups = useMemo(
    () => splitSearchResults(topbarYoutubeResults),
    [topbarYoutubeResults],
  )
  const addLinkSearchGroups = useMemo(
    () => splitSearchResults(youtubeSearchResults),
    [youtubeSearchResults],
  )
  const artistProfileSelectedYtAlbum = useMemo(
    () => artistProfileYtAlbums.find((album) => album.key === artistProfileSelectedYtAlbumKey) || null,
    [artistProfileSelectedYtAlbumKey, artistProfileYtAlbums],
  )
  const artistProfileSelectedYtSingle = useMemo(
    () => artistProfileYtSingles.find((item) => item.key === artistProfileSelectedYtSingleKey) || null,
    [artistProfileSelectedYtSingleKey, artistProfileYtSingles],
  )
  const artistProfileSelectedYtRelease = artistProfileSelectedYtAlbum || artistProfileSelectedYtSingle
  const artistProfileSelectedYtReleaseTracks = useMemo(
    () =>
      artistProfileSelectedYtRelease
        ? (artistProfileReleaseTracksByKey[artistProfileSelectedYtRelease.key] || [])
        : [],
    [artistProfileReleaseTracksByKey, artistProfileSelectedYtRelease],
  )
  const artistReleaseTrackCount = artistProfileSelectedYtReleaseTracks.length
  const artistReleaseTotalDuration = useMemo(
    () =>
      artistProfileSelectedYtReleaseTracks.reduce(
        (sum, track) => sum + (Number(track?.duration || 0) > 0 ? Number(track.duration) : 0),
        0,
      ),
    [artistProfileSelectedYtReleaseTracks],
  )
  const artistProfileAlbums = useMemo(() => {
    const groups = new Map()
    for (const track of artistProfileTracks) {
      const albumName = String(track.album || '').trim() || 'Single'
      const key = albumName.toLocaleLowerCase('tr-TR')
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          album: albumName,
          coverTrack: track,
        })
      } else {
        const bucket = groups.get(key)
        if (!getTrackDisplayUrl(bucket.coverTrack, 'thumb') && getTrackDisplayUrl(track, 'thumb')) {
          bucket.coverTrack = track
        }
      }
    }

    return Array.from(groups.values()).sort((a, b) => a.album.localeCompare(b.album, 'tr-TR'))
  }, [artistProfileTracks])
  const artistProfileSelectedAlbum = useMemo(
    () => artistProfileAlbums.find((album) => album.key === artistProfileSelectedAlbumKey) || null,
    [artistProfileAlbums, artistProfileSelectedAlbumKey],
  )
  const artistProfileSelectedAlbumTracks = useMemo(() => {
    if (!artistProfileSelectedAlbum) return []
    return sortTracksByOrder(
      artistProfileTracks.filter(
        (track) =>
          (String(track.album || '').trim() || 'Single').toLocaleLowerCase('tr-TR') === artistProfileSelectedAlbum.key,
      ),
    )
  }, [artistProfileSelectedAlbum, artistProfileTracks])
  const artistProfilePhotoUrl =
    String(artistProfileFacts?.photoUrl || '').trim() ||
    getTrackDisplayUrl(artistProfileLibraryTracks[0], 'cover') ||
    getTrackDisplayUrl(artistProfilePoolTracks[0], 'cover') ||
    ''
  const artistProfileAboutLine = artistProfileFacts
    ? [
        artistProfileFacts.realName ? `${tt('Gerçek ad', 'Real name')}: ${artistProfileFacts.realName}` : '',
        artistProfileFacts.formedAt ? `${tt('Kuruluş', 'Formed')}: ${artistProfileFacts.formedAt}` : '',
        artistProfileFacts.birthDate ? `${tt('Doğum', 'Born')}: ${artistProfileFacts.birthDate}` : '',
        artistProfileFacts.members?.length ? `${tt('Üyeler', 'Members')}: ${artistProfileFacts.members.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' • ')
    : ''
  const fullscreenTitle = getFullscreenTitlePresentation(currentTrack?.title || '', 28)
  const artistFactLine = artistFacts
    ? [
        artistFacts.realName ? `${tt('Gerçek ad', 'Real name')}: ${artistFacts.realName}` : '',
        artistFacts.formedAt ? `${tt('Kuruluş', 'Formed')}: ${artistFacts.formedAt}` : '',
        artistFacts.birthDate ? `${tt('Doğum', 'Born')}: ${artistFacts.birthDate}` : '',
        artistFacts.members?.length ? `${tt('Üyeler', 'Members')}: ${artistFacts.members.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' • ')
    : ''
  const applyQueuedNextTracks = (nextQueue) => {
    queuedNextTrackIdsRef.current = nextQueue
    setQueuedNextTrackIds(nextQueue)
  }

  const applyShuffleOrderIds = (nextOrder) => {
    shuffleOrderIdsRef.current = nextOrder
    setShuffleOrderIds(nextOrder)
  }

  function sanitizeQueue(queueList) {
    const seen = new Set()
    return queueList.filter((trackId) => {
      if (trackId === currentTrackId || seen.has(trackId)) {
        return false
      }

      const exists = allTracks.some((track) => track.id === trackId)
      if (!exists) {
        return false
      }

      seen.add(trackId)
      return true
    })
  }

  const peekQueuedNextTrack = () => {
    const sanitized = sanitizeQueue(queuedNextTrackIdsRef.current)
    if (sanitized.length !== queuedNextTrackIdsRef.current.length) {
      applyQueuedNextTracks(sanitized)
    }

    if (!sanitized.length) {
      return null
    }

    return allTracks.find((track) => track.id === sanitized[0]) || null
  }

  const consumeQueuedNextTrack = () => {
    const sanitized = sanitizeQueue(queuedNextTrackIdsRef.current)
    if (!sanitized.length) {
      if (queuedNextTrackIdsRef.current.length) {
        applyQueuedNextTracks([])
      }
      return null
    }

    const [nextId, ...rest] = sanitized
    applyQueuedNextTracks(rest)
    return allTracks.find((track) => track.id === nextId) || null
  }

  const applyAudioChannelMode = useCallback((useMono) => {
    const context = audioContextRef.current
    const outputGain = audioGainRef.current
    const analyser = audioAnalyserRef.current
    const routeStart = analyser || outputGain
    if (!context || !outputGain || !routeStart) {
      return
    }

    const previous = monoRoutingNodesRef.current
    if (previous) {
      Object.values(previous).forEach((node) => {
        try {
          node?.disconnect?.()
        } catch {
          // ignore disconnection errors
        }
      })
      monoRoutingNodesRef.current = null
    }

    try {
      routeStart.disconnect()
    } catch {
      // ignore disconnect errors
    }

    if (!useMono) {
      routeStart.connect(context.destination)
      return
    }

    const splitter = context.createChannelSplitter(2)
    const sumLeft = context.createGain()
    const sumRight = context.createGain()
    sumLeft.gain.value = 0.5
    sumRight.gain.value = 0.5

    const monoMerger = context.createChannelMerger(1)
    const monoSplitter = context.createChannelSplitter(1)
    const stereoMerger = context.createChannelMerger(2)

    routeStart.connect(splitter)
    splitter.connect(sumLeft, 0)
    splitter.connect(sumRight, 1)
    sumLeft.connect(monoMerger, 0, 0)
    sumRight.connect(monoMerger, 0, 0)
    monoMerger.connect(monoSplitter, 0, 0)
    monoSplitter.connect(stereoMerger, 0, 0)
    monoSplitter.connect(stereoMerger, 0, 1)
    stereoMerger.connect(context.destination)

    monoRoutingNodesRef.current = {
      splitter,
      sumLeft,
      sumRight,
      monoMerger,
      monoSplitter,
      stereoMerger,
    }
  }, [])

  const topTrackStats = useMemo(() => {
    const trackById = new Map(allTracks.map((track) => [track.id, track]))
    const entries = Object.entries(playStats?.trackSeconds || {})
      .filter(([trackId, seconds]) => trackById.has(trackId) && Number.isFinite(seconds) && seconds > 0)
      .sort((left, right) => right[1] - left[1])

    const topEntry = entries[0] || null
    const topTrack = topEntry ? trackById.get(topEntry[0]) || null : null
    const artistTotals = new Map()
    const albumTotals = new Map()
    const albumTopTrackBySeconds = new Map()

    entries.forEach(([trackId, seconds]) => {
      const track = trackById.get(trackId)
      if (!track) {
        return
      }

      const artistNames = extractArtistCandidates(track.artist || '')
      const normalizedArtists = artistNames.length ? artistNames : []
      const albumName = track.album?.trim() || 'Single'

      normalizedArtists.forEach((artistName) => {
        if (!artistName) return
        artistTotals.set(artistName, Number(artistTotals.get(artistName) || 0) + Number(seconds || 0))
      })
      albumTotals.set(albumName, Number(albumTotals.get(albumName) || 0) + Number(seconds || 0))

      const currentTop = albumTopTrackBySeconds.get(albumName)
      if (!currentTop || Number(seconds || 0) > currentTop.seconds) {
        albumTopTrackBySeconds.set(albumName, {
          trackId,
          seconds: Number(seconds || 0),
        })
      }
    })

    const topArtistEntry = Array.from(artistTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null
    const topAlbumEntry = Array.from(albumTotals.entries()).sort((a, b) => b[1] - a[1])[0] || null
    const topAlbumTrackMeta = topAlbumEntry
      ? albumTopTrackBySeconds.get(topAlbumEntry[0]) || null
      : null
    const topAlbumTrack = topAlbumTrackMeta
      ? trackById.get(topAlbumTrackMeta.trackId) || null
      : null

    const topList = entries.slice(0, 6).map(([trackId, seconds]) => {
      const track = trackById.get(trackId)
      return {
        trackId,
        seconds,
        title: track?.title || 'Bilinmeyen parça',
        artist: track?.artist || '',
      }
    })

    return {
      topTrack,
      topSeconds: topEntry?.[1] || 0,
      topArtist: topArtistEntry
        ? { name: topArtistEntry[0], seconds: topArtistEntry[1] }
        : null,
      topAlbum: topAlbumEntry
        ? { name: topAlbumEntry[0], seconds: topAlbumEntry[1], track: topAlbumTrack }
        : null,
      topList,
    }
  }, [allTracks, playStats])
  const monthlyGeneratedCollections = useMemo(() => {
    const monthly = playStats?.monthlyTrackSeconds || {}
    const entries = Object.entries(monthly)
      .filter(([monthKey, map]) => monthKey && map && typeof map === 'object')
      .sort((a, b) => String(b[0]).localeCompare(String(a[0])))

    return entries
      .map(([monthKey, map]) => {
        const rankedTrackIds = Object.entries(map || {})
          .filter(([, seconds]) => Number(seconds || 0) > 0)
          .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
          .map(([trackId]) => trackId)
          .filter((trackId) => allTracks.some((track) => track.id === trackId))
          .slice(0, 50)

        if (!rankedTrackIds.length) {
          return null
        }

        return {
          id: `monthly:${monthKey}`,
          monthKey,
          name: `${formatMonthKeyLabel(monthKey, language)} • En çok dinlenenler`,
          trackIds: rankedTrackIds,
          count: rankedTrackIds.length,
          color: '#ffffff',
          isGeneratedMonthly: true,
        }
      })
      .filter(Boolean)
  }, [allTracks, language, playStats?.monthlyTrackSeconds])
  const monthlyRecapData = useMemo(() => {
    const selectedMonthKey = selectedCollectionId.startsWith('monthly:')
      ? selectedCollectionId.slice('monthly:'.length)
      : monthlyGeneratedCollections[0]?.monthKey || ''
    if (!selectedMonthKey) {
      return null
    }

    const monthMap = playStats?.monthlyTrackSeconds?.[selectedMonthKey] || {}
    const ranked = Object.entries(monthMap)
      .filter(([trackId, seconds]) => Number(seconds || 0) > 0 && allTracks.some((track) => track.id === trackId))
      .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))

    if (!ranked.length) {
      return null
    }

    const totalSeconds = ranked.reduce((sum, [, seconds]) => sum + Number(seconds || 0), 0)
    const topTrackId = ranked[0]?.[0] || ''
    const topTrackSeconds = Number(ranked[0]?.[1] || 0)
    const topTrack = allTracks.find((track) => track.id === topTrackId) || null
    const topTracks = ranked
      .slice(0, 4)
      .map(([trackId, seconds]) => {
        const track = allTracks.find((item) => item.id === trackId)
        if (!track) return null
        return { track, seconds: Number(seconds || 0) }
      })
      .filter(Boolean)

    const artistTotals = new Map()
    ranked.forEach(([trackId, seconds]) => {
      const track = allTracks.find((item) => item.id === trackId)
      if (!track) return
      const artists = extractArtistCandidates(track.artist || '')
      artists.forEach((artistName) => {
        if (!artistName) return
        artistTotals.set(artistName, Number(artistTotals.get(artistName) || 0) + Number(seconds || 0))
      })
    })
    const [topArtistName = '', topArtistSeconds = 0] = Array.from(artistTotals.entries())
      .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0] || []

    return {
      monthKey: selectedMonthKey,
      monthLabel: formatMonthKeyLabel(selectedMonthKey, language),
      totalSeconds,
      topTrack,
      topTrackSeconds,
      topTracks,
      topArtistName,
      topArtistSeconds: Number(topArtistSeconds || 0),
      trackCount: ranked.length,
    }
  }, [allTracks, language, monthlyGeneratedCollections, playStats?.monthlyTrackSeconds, selectedCollectionId])
  const offlineHealth = useMemo(() => {
    const seen = new Set()
    let duplicateCount = 0
    let missingCoverCount = 0
    let missingLyricsCount = 0
    let missingAudioCount = 0
    for (const track of tracks) {
      const signature = getTrackSignature(track)
      if (seen.has(signature)) duplicateCount += 1
      else seen.add(signature)
      if (!String(track?.audioUrl || '').trim()) missingAudioCount += 1
      if (!String(track?.coverUrl || track?.coverRemoteUrl || '').trim()) missingCoverCount += 1
      if (!String(track?.lyricsLocal || track?.lyrics || '').trim()) missingLyricsCount += 1
    }
    return {
      total: tracks.length,
      missingAudioCount,
      missingCoverCount,
      missingLyricsCount,
      duplicateCount,
      healthyCount: Math.max(
        0,
        tracks.length - Math.max(missingAudioCount, missingCoverCount, missingLyricsCount, duplicateCount),
      ),
    }
  }, [tracks])
  const recentListenHistory = useMemo(
    () => (Array.isArray(listenHistory) ? listenHistory.slice(0, 300) : []),
    [listenHistory],
  )

  const openArtistReleaseModal = useCallback((release, type = 'album') => {
    if (!release?.key) return
    if (type === 'single') {
      setArtistProfileSelectedYtSingleKey(release.key)
      setArtistProfileSelectedYtAlbumKey('')
    } else {
      setArtistProfileSelectedYtAlbumKey(release.key)
      setArtistProfileSelectedYtSingleKey('')
    }
    setArtistReleaseModalOpen(true)
  }, [])
  const filteredListenHistory = useMemo(() => {
    const normalizedQuery = String(historyFilterQuery || '').trim().toLowerCase()
    return recentListenHistory.filter((item) => {
      const title = String(item?.title || '').trim()
      if (!title) return false
      if (historyFilterDate) {
        const itemDate = new Date(item.at || 0).toISOString().slice(0, 10)
        if (itemDate !== historyFilterDate) return false
      }
      if (normalizedQuery && !title.toLowerCase().includes(normalizedQuery)) {
        return false
      }
      return true
    })
  }, [historyFilterDate, historyFilterQuery, recentListenHistory])
  const libraryTrackSignatures = useMemo(() => new Set(tracks.map(getTrackSignature)), [tracks])
  const homePlaylistRows = useMemo(
    () =>
      playlists.slice(0, 12).map((playlist) => ({
        id: playlist.id,
        name: String(playlist.name || 'Playlist'),
        count: Number(playlist.trackIds?.length || 0),
        cover: playlist.coverUrl || '',
        color: playlist.color || playlistColors[0],
      })),
    [playlists],
  )
  const homeYtMusicRows = useMemo(() => {
    const ytTracks = tracks.filter((track) => {
      const cover = String(track?.coverUrl || '')
      const audio = String(track?.audioUrl || '')
      return /ytimg\.com|youtube|youtu\.be|music\.youtube\.com/i.test(cover) || /youtube|youtu\.be|music\.youtube\.com/i.test(audio)
    })
    const grouped = new Map()
    for (const track of ytTracks) {
      const albumName = String(track.album || '').trim() || 'Single'
      const key = `${normalizeCoverMatchText(track.artist || '')}|${normalizeCoverMatchText(albumName)}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: `ytm-${key}`,
          name: albumName,
          artist: String(track.artist || '').trim() || 'Unknown Artist',
          count: 0,
          cover: getTrackDisplayUrl(track, 'cover') || '',
          seedTrackId: track.id,
        })
      }
      const row = grouped.get(key)
      row.count += 1
      if (!row.cover) row.cover = getTrackDisplayUrl(track, 'cover') || ''
    }
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count).slice(0, 12)
  }, [tracks])
  const homeDiscoveryRows = useMemo(() => {
    const topArtists = Array.from(
      new Set(
        (topTrackStats?.topList || [])
          .map((entry) => String(entry?.artist || '').trim())
          .filter(Boolean),
      ),
    ).slice(0, 5)
    if (!topArtists.length) return []

    const suggestions = []
    for (const poolTrack of serverTracks) {
      const artistName = String(poolTrack?.artist || '').trim()
      if (!artistName || !topArtists.some((artist) => doesArtistMatch(artistName, artist))) {
        continue
      }
      if (libraryTrackSignatures.has(getTrackSignature(poolTrack))) {
        continue
      }
      suggestions.push(poolTrack)
      if (suggestions.length >= 18) break
    }
    return suggestions
  }, [topTrackStats, serverTracks, libraryTrackSignatures])
  useEffect(() => {
    let cancelled = false
    const loadOfficialYtm = async () => {
      if (!window?.novaPlayer?.searchYtMusic && !window?.novaPlayer?.searchYoutube) {
        if (!cancelled) setHomeOfficialYtMusicRows([])
        return
      }
      const queries = [
        'YouTube Music Top 100 Global official audio',
        'YouTube Music New Releases official audio',
        'YouTube Music Trending official audio',
      ]
      const items = []
      for (const query of queries) {
        try {
          const result = window.novaPlayer?.searchYtMusic
            ? await window.novaPlayer.searchYtMusic({ query, limit: 1 })
            : await window.novaPlayer.searchYoutube({ query, limit: 1 })
          const first = Array.isArray(result?.items) ? result.items[0] : null
          if (!first) continue
          items.push({
            id: `ytm-official-${first.id || query}`,
            name: String(first.title || query),
            subtitle: String(first.artist || 'YouTube Music'),
            cover: String(first.thumbnail || ''),
            seedTrackId: String(first.id || ''),
            videoUrl: String(first.url || ''),
            artist: String(first.artist || '').trim(),
          })
        } catch {
          // ignore single query errors
        }
      }
      if (!cancelled) {
        setHomeOfficialYtMusicRows(items)
      }
    }
    loadOfficialYtm()
    return () => {
      cancelled = true
    }
  }, [])

  const getNextTrack = (options = {}) => {
    const { consumeQueue = false, ignoreShuffle = false } = options

    if (repeatEnabled && currentTrack) {
      return currentTrack
    }

    const queuedTrack = consumeQueue ? consumeQueuedNextTrack() : peekQueuedNextTrack()
    if (queuedTrack) {
      return queuedTrack
    }

    if (!playbackTracks.length) {
      return null
    }

    if (shuffleEnabled && !ignoreShuffle) {
      const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
      const orderedIds = shuffleOrderIdsRef.current.filter((id) => visibleById.has(id))
      const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
      const source = orderedTracks.length ? orderedTracks : playbackTracks
      const activeIndex = source.findIndex((track) => track.id === currentTrackId)
      const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % source.length : 0
      return source[nextIndex] || null
    }

    const activeIndex = playbackTracks.findIndex((track) => track.id === currentTrackId)
    const nextIndex = activeIndex >= 0 ? (activeIndex + 1) % playbackTracks.length : 0
    return playbackTracks[nextIndex] || null
  }

  const getTracksByCollectionId = useCallback(
    (collectionId) => {
      if (collectionId === 'home') {
        return []
      }

      if (collectionId === 'favorites') {
        return sortTracksByOrder(allTracks.filter((track) => track.isFavorite))
      }

      if (collectionId === 'pool' || collectionId === 'server') {
        return sortTracksByOrder(serverTracks)
      }

      if (collectionId && collectionId !== 'all') {
        const playlist = playlists.find((item) => item.id === collectionId)
        if (playlist) {
          return sortTracksByOrder(allTracks.filter((track) => playlist.trackIds.includes(track.id)))
        }

        const monthlyCollection = monthlyGeneratedCollections.find((item) => item.id === collectionId)
        if (monthlyCollection) {
          const monthlyTrackMap = new Map(allTracks.map((track) => [track.id, track]))
          return monthlyCollection.trackIds.map((trackId) => monthlyTrackMap.get(trackId)).filter(Boolean)
        }

        const genreCollection = genreCollections.find((item) => item.id === collectionId)
        if (genreCollection) {
          return sortTracksByOrder(tracks.filter((track) => genreCollection.trackIds.includes(track.id)))
        }
      }

      return sortTracksByOrder(tracks)
    },
    [allTracks, genreCollections, monthlyGeneratedCollections, playlists, serverTracks, tracks],
  )

  const visibleTracks = useMemo(() => {
    return getTracksByCollectionId(selectedCollectionId)
  }, [getTracksByCollectionId, selectedCollectionId])

  const audioOnlyHiddenCount = useMemo(
    () => tracks.filter((track) => isTrackAudioOnly(track)).length,
    [tracks],
  )

  const selectedCollectionDuration = useMemo(
    () => visibleTracks.reduce((sum, track) => sum + (track.duration || 0), 0),
    [visibleTracks],
  )

  const playbackCollectionScopeId =
    playbackCollectionId === 'pool' || playbackCollectionId === 'server'
      ? 'all'
      : playbackCollectionId ||
        (selectedCollectionId === 'pool' || selectedCollectionId === 'server'
          ? 'all'
          : selectedCollectionId)

  const playbackTracks = useMemo(
    () => getTracksByCollectionId(playbackCollectionScopeId),
    [getTracksByCollectionId, playbackCollectionScopeId],
  )

  const displayedTracks = useMemo(() => {
    const poolFiltered =
      selectedCollectionId === 'pool' && poolArtistFilter !== 'all'
        ? visibleTracks.filter(
            (track) => doesArtistMatch(track.artist || '', poolArtistFilter),
          )
        : visibleTracks

    const normalizedQuery = trackSearchQuery.trim().toLocaleLowerCase('tr-TR')
    const searched = normalizedQuery
      ? poolFiltered.filter((track) => {
          const title = String(track.title || '').toLocaleLowerCase('tr-TR')
          const artist = String(track.artist || '').toLocaleLowerCase('tr-TR')
          const album = String(track.album || '').toLocaleLowerCase('tr-TR')
          return (
            title.includes(normalizedQuery) ||
            artist.includes(normalizedQuery) ||
            album.includes(normalizedQuery)
          )
        })
      : poolFiltered

    if (selectedCollectionId !== 'pool' || !hideDownloadedPoolTracks) {
      return searched
    }

    const localLibraryKeys = new Set()
    const localLibraryPoolSourceUrls = new Set()
    tracks.forEach((item) => {
      const titleKey = normalizeCoverMatchText(item?.title || '')
      const artistKey = normalizeCoverMatchText(item?.artist || '')
      if (titleKey && artistKey) {
        localLibraryKeys.add(`${artistKey}|||${titleKey}`)
      }
      const poolSourceUrl = normalizeDriveUrl(String(item?.poolSourceAudioUrl || '').trim())
      if (poolSourceUrl) {
        localLibraryPoolSourceUrls.add(poolSourceUrl)
      }
    })

    return searched.filter((track) => {
      const poolSourceCandidate = normalizeDriveUrl(String(track?.audioUrl || track?.downloadUrl || '').trim())
      if (poolSourceCandidate && localLibraryPoolSourceUrls.has(poolSourceCandidate)) {
        return false
      }
      const titleKey = normalizeCoverMatchText(track?.title || '')
      const artistKey = normalizeCoverMatchText(track?.artist || '')
      if (!titleKey || !artistKey) {
        return true
      }
      return !localLibraryKeys.has(`${artistKey}|||${titleKey}`)
    })
  }, [
    hideDownloadedPoolTracks,
    poolArtistFilter,
    selectedCollectionId,
    trackSearchQuery,
    tracks,
    visibleTracks,
  ])

  const shouldVirtualizeTrackList = displayedTracks.length > 140
  const virtualRowHeight = displayedTracks.length >= 350 ? 88 : VIRTUAL_ROW_HEIGHT
  const virtualVisibleCount =
    virtualViewportHeight > 0 ? Math.ceil(virtualViewportHeight / virtualRowHeight) : 16
  const virtualStartIndex = shouldVirtualizeTrackList
    ? Math.max(0, Math.floor(virtualScrollTop / virtualRowHeight) - VIRTUAL_OVERSCAN)
    : 0
  const virtualEndIndex = shouldVirtualizeTrackList
    ? Math.min(
        displayedTracks.length,
        virtualStartIndex + virtualVisibleCount + VIRTUAL_OVERSCAN * 2,
      )
    : displayedTracks.length
  const virtualTopSpacer = shouldVirtualizeTrackList ? virtualStartIndex * virtualRowHeight : 0
  const virtualBottomSpacer = shouldVirtualizeTrackList
    ? Math.max(0, (displayedTracks.length - virtualEndIndex) * virtualRowHeight)
    : 0
  const renderedTracks = useMemo(
    () => displayedTracks.slice(virtualStartIndex, virtualEndIndex),
    [displayedTracks, virtualEndIndex, virtualStartIndex],
  )
  const [homeRowScrollState, setHomeRowScrollState] = useState({
    playlists: { canLeft: false, canRight: false },
    pinned: { canLeft: false, canRight: false },
    mood: { canLeft: false, canRight: false },
  })

  const updateHomeRowScrollState = useCallback(() => {
    const getState = (element) => {
      if (!(element instanceof HTMLElement)) {
        return { canLeft: false, canRight: false }
      }
      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth)
      return {
        canLeft: element.scrollLeft > 4,
        canRight: element.scrollLeft < maxScroll - 4,
      }
    }
    setHomeRowScrollState({
      playlists: getState(homePlaylistRowRef.current),
      pinned: getState(homePinnedRowRef.current),
      mood: getState(homeMoodRowRef.current),
    })
  }, [])

  const scrollHomeRowBy = useCallback(
    (row, direction) => {
      const refMap = {
        playlists: homePlaylistRowRef,
        pinned: homePinnedRowRef,
        mood: homeMoodRowRef,
      }
      const target = refMap[row]?.current
      if (!(target instanceof HTMLElement)) {
        return
      }
      const delta = Math.round(target.clientWidth * 0.82) * direction
      target.scrollBy({ left: delta, behavior: 'smooth' })
      setTimeout(updateHomeRowScrollState, 220)
    },
    [updateHomeRowScrollState],
  )

  useEffect(() => {
    if (selectedCollectionId !== 'home') {
      return undefined
    }

    updateHomeRowScrollState()
    const nodes = [homePlaylistRowRef.current, homePinnedRowRef.current, homeMoodRowRef.current]
      .filter((node) => node instanceof HTMLElement)
    const onScroll = () => updateHomeRowScrollState()
    nodes.forEach((node) => node.addEventListener('scroll', onScroll, { passive: true }))
    window.addEventListener('resize', updateHomeRowScrollState)
    return () => {
      nodes.forEach((node) => node.removeEventListener('scroll', onScroll))
      window.removeEventListener('resize', updateHomeRowScrollState)
    }
  }, [tracks.length, homePlaylistRows.length, homeMoodPlaylists.length, selectedCollectionId, updateHomeRowScrollState])
  const playlistAddFilteredTracks = useMemo(() => {
    const query = String(playlistAddSearchQuery || '').trim().toLocaleLowerCase('tr-TR')
    const base = sortTracksByOrder(tracks)
    if (!query) {
      return base
    }
    return base.filter((track) => {
      const title = String(track?.title || '').toLocaleLowerCase('tr-TR')
      const artist = String(track?.artist || '').toLocaleLowerCase('tr-TR')
      const album = String(track?.album || '').toLocaleLowerCase('tr-TR')
      return title.includes(query) || artist.includes(query) || album.includes(query)
    })
  }, [playlistAddSearchQuery, tracks])
  const isHugeTrackList = displayedTracks.length >= 350
  const homeRecentTracks = useMemo(() => {
    if (selectedCollectionId !== 'home') return []
    const source = [...allTracks]
    if (!source.length) return []
    const shuffled = source.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 9)
  }, [allTracks, selectedCollectionId])

  const homeRecentAlbums = useMemo(() => {
    if (selectedCollectionId !== 'home') return []
    const byAlbum = new Map()
    for (const track of allTracks) {
      const albumName = String(track?.album || '').trim()
      const artistName = String(track?.artist || '').trim()
      if (!albumName || !artistName) continue
      const key = `${artistName.toLocaleLowerCase('tr-TR')}|||${albumName.toLocaleLowerCase('tr-TR')}`
      if (!byAlbum.has(key)) {
        byAlbum.set(key, track)
      }
    }
    const candidates = Array.from(byAlbum.values())
    if (!candidates.length) return []
    const shuffled = [...candidates].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }, [allTracks, selectedCollectionId])

  const getLocalLibraryMatchKey = useCallback((track) => {
    const titleKey = normalizeCoverMatchText(track?.title || '')
    const artistKey = normalizeCoverMatchText(track?.artist || '')
    if (!titleKey || !artistKey) {
      return ''
    }
    return `${artistKey}|||${titleKey}`
  }, [])

  const localLibraryTrackByKey = useMemo(() => {
    const map = new Map()
    for (const track of tracks) {
      const key = getLocalLibraryMatchKey(track)
      if (!key || map.has(key)) {
        continue
      }
      map.set(key, track)
    }
    return map
  }, [getLocalLibraryMatchKey, tracks])

  const localLibraryTrackKeySet = useMemo(() => {
    const keys = new Set()
    for (const track of tracks) {
      const key = getLocalLibraryMatchKey(track)
      if (!key) {
        continue
      }
      keys.add(key)
    }
    return keys
  }, [getLocalLibraryMatchKey, tracks])

  const localLibraryPoolSourceUrlSet = useMemo(() => {
    const urls = new Set()
    for (const track of tracks) {
      const poolSourceUrl = normalizeDriveUrl(String(track?.poolSourceAudioUrl || '').trim())
      if (poolSourceUrl) {
        urls.add(poolSourceUrl)
      }
    }
    return urls
  }, [tracks])

  const isTrackInLocalLibrary = useCallback(
    (track) => {
      const poolSourceCandidate = normalizeDriveUrl(String(track?.audioUrl || track?.downloadUrl || '').trim())
      if (poolSourceCandidate && localLibraryPoolSourceUrlSet.has(poolSourceCandidate)) {
        return true
      }

      const key = getLocalLibraryMatchKey(track)
      if (!key) {
        return false
      }
      return localLibraryTrackKeySet.has(key)
    },
    [getLocalLibraryMatchKey, localLibraryPoolSourceUrlSet, localLibraryTrackKeySet],
  )

  const poolSelectedTrackIdSet = useMemo(
    () => new Set(poolSelectedTrackIds),
    [poolSelectedTrackIds],
  )

  const handleTrackListScroll = useCallback((event) => {
    if (!shouldVirtualizeTrackList) {
      return
    }
    const target = event.currentTarget
    const nextTop = target instanceof HTMLElement ? target.scrollTop : 0
    if (virtualListRafRef.current) {
      return
    }
    virtualListRafRef.current = window.requestAnimationFrame(() => {
      virtualListRafRef.current = 0
      setVirtualScrollTop((prev) => (Math.abs(prev - nextTop) > 1 ? nextTop : prev))
    })
  }, [shouldVirtualizeTrackList])

  useEffect(() => {
    const viewport = trackListViewportRef.current
    if (!(viewport instanceof HTMLElement)) {
      return
    }
    viewport.scrollTop = 0
    setVirtualScrollTop(0)
  }, [hideDownloadedPoolTracks, poolArtistFilter, selectedCollectionId, trackSearchQuery])

  useEffect(() => {
    const viewport = trackListViewportRef.current
    if (!(viewport instanceof HTMLElement)) {
      return undefined
    }
    const updateViewportHeight = () => {
      const next = viewport.clientHeight || 0
      setVirtualViewportHeight((prev) => (prev === next ? prev : next))
    }
    updateViewportHeight()
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(updateViewportHeight)
      observer.observe(viewport)
      return () => observer.disconnect()
    }
    window.addEventListener('resize', updateViewportHeight)
    return () => window.removeEventListener('resize', updateViewportHeight)
  }, [trackListLayoutVersion])

  useEffect(() => {
    return () => {
      if (virtualListRafRef.current) {
        window.cancelAnimationFrame(virtualListRafRef.current)
        virtualListRafRef.current = 0
      }
    }
  }, [])

  useEffect(() => {
    if (selectedCollectionId !== 'pool') {
      if (poolSelectedTrackIds.length) {
        setPoolSelectedTrackIds([])
      }
      poolSelectionAnchorIdRef.current = null
      return
    }

    const visibleIdSet = new Set(displayedTracks.map((track) => track.id))
    setPoolSelectedTrackIds((prev) => {
      const filtered = prev.filter((id) => visibleIdSet.has(id))
      return filtered.length === prev.length ? prev : filtered
    })

    if (poolSelectionAnchorIdRef.current && !visibleIdSet.has(poolSelectionAnchorIdRef.current)) {
      poolSelectionAnchorIdRef.current = null
    }
  }, [displayedTracks, poolSelectedTrackIds.length, selectedCollectionId])

  const selectablePoolTracks = useMemo(
    () =>
      selectedCollectionId === 'pool'
        ? displayedTracks.filter((track) => {
            if (!poolSelectedTrackIdSet.has(track.id)) {
              return false
            }
            if (!track.audioUrl) {
              return false
            }
            return !isTrackInLocalLibrary(track)
          })
        : [],
    [displayedTracks, isTrackInLocalLibrary, poolSelectedTrackIdSet, selectedCollectionId],
  )

  const activeDownloadCount = useMemo(
    () =>
      downloadJobs.filter((item) => item.status === 'starting' || item.status === 'downloading')
        .length,
    [downloadJobs],
  )

  const poolArtists = useMemo(() => {
    const counts = new Map()
    for (const track of serverTracks) {
      const artistNames = extractArtistCandidates(track.artist || '')
      const normalizedArtists = artistNames.length
        ? artistNames
        : [String(track.artist || '').trim() || 'Bilinmeyen sanatçı']

      normalizedArtists.forEach((artist) => {
        const previous = counts.get(artist) || { count: 0, addedCount: 0 }
        counts.set(artist, {
          count: previous.count + 1,
          addedCount: previous.addedCount + (isTrackInLocalLibrary(track) ? 1 : 0),
        })
      })
    }
    return Array.from(counts.entries())
      .map(([name, stats]) => ({ name, count: stats.count, addedCount: stats.addedCount }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'))
  }, [isTrackInLocalLibrary, serverTracks])

  useEffect(() => {
    if (selectedCollectionId !== 'pool') {
      setPoolArtistFilter('all')
    }
  }, [selectedCollectionId])

  useEffect(() => {
    const previousCollectionId = previousCollectionIdRef.current
    previousCollectionIdRef.current = selectedCollectionId
    if (selectedCollectionId !== 'pool' || previousCollectionId === 'pool') {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const normalizePoolScroll = () => {
      const listViewport = trackListViewportRef.current
      const poolMain = listViewport?.closest('.pool-browser-main')
      const trackColumn = listViewport?.closest('.track-column')

      if (poolMain instanceof HTMLElement) {
        poolMain.scrollTop = 0
      }
      if (trackColumn instanceof HTMLElement) {
        trackColumn.scrollTop = 0
      }
      if (listViewport instanceof HTMLElement) {
        const maxScroll = Math.max(0, listViewport.scrollHeight - listViewport.clientHeight)
        listViewport.scrollTop = Math.min(listViewport.scrollTop, maxScroll)
        if (maxScroll < 12) {
          listViewport.scrollTop = 0
        }
      }
    }

    const raf1 = window.requestAnimationFrame(() => {
      normalizePoolScroll()
      window.requestAnimationFrame(normalizePoolScroll)
    })

    return () => {
      window.cancelAnimationFrame(raf1)
    }
  }, [selectedCollectionId])

  const upcomingPlaybackTracks = useMemo(() => {
    if (repeatEnabled && currentTrack) {
      return Array.from({ length: 30 }, () => currentTrack)
    }

    const queued = sanitizeQueue(queuedNextTrackIds)
      .map((id) => allTracks.find((track) => track.id === id))
      .filter(Boolean)
    const queuedSet = new Set(queued.map((track) => track.id))

    const orderedVisible = (() => {
      if (!playbackTracks.length) {
        return []
      }

      if (shuffleEnabled) {
        const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
        const orderedIds = shuffleOrderIds.filter((id) => visibleById.has(id))
        const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
        const missingTracks = playbackTracks.filter((track) => !orderedIds.includes(track.id))
        const merged = [...orderedTracks, ...missingTracks]
        if (!currentTrackId) {
          return merged
        }
        const activeIndex = merged.findIndex((track) => track.id === currentTrackId)
        if (activeIndex < 0) {
          return merged
        }
        return [...merged.slice(activeIndex + 1), ...merged.slice(0, activeIndex + 1)]
      }

      const activeIndex = playbackTracks.findIndex((track) => track.id === currentTrackId)
      if (activeIndex < 0) {
        return playbackTracks.slice()
      }

      return [...playbackTracks.slice(activeIndex + 1), ...playbackTracks.slice(0, activeIndex + 1)]
    })()

    let fallback = orderedVisible.filter(
      (track) => track.id !== currentTrackId && !queuedSet.has(track.id),
    )

    return [...queued, ...fallback].slice(0, 30)
  }, [
    allTracks,
    currentTrack,
    currentTrackId,
    queuedNextTrackIds,
    repeatEnabled,
    playbackCollectionId,
    shuffleOrderIds,
    shuffleEnabled,
    playbackTracks,
  ])

  const previousPlaybackTracks = useMemo(() => {
    if (!currentTrack) {
      return []
    }

    if (repeatEnabled) {
      return Array.from({ length: 4 }, () => currentTrack)
    }

    if (!playbackTracks.length) {
      return []
    }

    const orderedVisible = (() => {
      if (!shuffleEnabled) {
        return playbackTracks.slice()
      }

      const visibleById = new Map(playbackTracks.map((track) => [track.id, track]))
      const orderedIds = shuffleOrderIds.filter((id) => visibleById.has(id))
      const orderedTracks = orderedIds.map((id) => visibleById.get(id)).filter(Boolean)
      const missingTracks = playbackTracks.filter((track) => !orderedIds.includes(track.id))
      return [...orderedTracks, ...missingTracks]
    })()

    const activeIndex = orderedVisible.findIndex((track) => track.id === currentTrackId)
    if (activeIndex < 0) {
      return []
    }

    const history = []
    for (let offset = 1; offset <= Math.min(4, orderedVisible.length - 1); offset += 1) {
      const index = (activeIndex - offset + orderedVisible.length) % orderedVisible.length
      const track = orderedVisible[index]
      if (track?.id && track.id !== currentTrackId) {
        history.push(track)
      }
    }
    return history
  }, [currentTrack, currentTrackId, repeatEnabled, shuffleEnabled, shuffleOrderIds, playbackTracks])

  const playbackPreviewTracks = useMemo(() => {
    const prev = previousPlaybackTracks.slice(0, 3).reverse()
    const next = upcomingPlaybackTracks.slice(0, 3)
    return [...prev, ...(currentTrack ? [currentTrack] : []), ...next]
  }, [currentTrack, previousPlaybackTracks, upcomingPlaybackTracks])

  const centerPlaybackSequence = useCallback((behavior = 'smooth') => {
    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    const activeItem = container.querySelector('.playback-sequence-item.active')
    if (!(activeItem instanceof HTMLElement)) {
      return
    }

    const targetScrollLeft =
      activeItem.offsetLeft - container.clientWidth / 2 + activeItem.clientWidth / 2

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior,
    })
  }, [])

  useEffect(() => {
    centerPlaybackSequence('smooth')
  }, [centerPlaybackSequence, currentTrackId, playbackPreviewTracks])

  useEffect(() => {
    const handleResize = () => centerPlaybackSequence('auto')
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [centerPlaybackSequence])

  const handlePlaybackSequencePointerDown = (event) => {
    if (event.button !== 0) {
      return
    }

    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    playbackSequenceDragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      moved: false,
    }
  }

  const handlePlaybackSequencePointerMove = (event) => {
    const dragState = playbackSequenceDragRef.current
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return
    }

    const container = playbackSequenceRef.current
    if (!container) {
      return
    }

    const deltaX = event.clientX - dragState.startX
    if (!dragState.moved && Math.abs(deltaX) > 4) {
      dragState.moved = true
    }

    container.scrollLeft = dragState.startScrollLeft - deltaX
  }

  const handlePlaybackSequencePointerEnd = (event) => {
    const dragState = playbackSequenceDragRef.current
    if (!dragState.active) {
      return
    }
    if (dragState.pointerId !== event.pointerId) {
      return
    }

    dragState.active = false
    dragState.pointerId = null

    window.setTimeout(() => {
      dragState.moved = false
    }, 0)
  }

  useEffect(() => {
    const forceStopDrag = () => {
      const dragState = playbackSequenceDragRef.current
      if (!dragState.active) {
        return
      }
      dragState.active = false
      dragState.pointerId = null
      dragState.moved = false
    }

    window.addEventListener('pointerup', forceStopDrag)
    window.addEventListener('pointercancel', forceStopDrag)
    window.addEventListener('blur', forceStopDrag)
    return () => {
      window.removeEventListener('pointerup', forceStopDrag)
      window.removeEventListener('pointercancel', forceStopDrag)
      window.removeEventListener('blur', forceStopDrag)
    }
  }, [])

  const updateTrack = (trackId, updates) => {
    setTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)),
    )
    setServerTracks((prev) =>
      prev.map((track) => (track.id === trackId ? { ...track, ...updates } : track)),
    )
  }

  const persistTrackCoverLocally = useCallback(async (track) => {
    const remoteUrl = getTrackPublicCoverUrl(track)
    const currentLocalCoverUrl = String(track?.coverUrl || '').trim()
    if (!track?.id || !remoteUrl || track?.coverBlob) {
      return false
    }

    if (isLocalLikeAssetUrl(currentLocalCoverUrl)) {
      return true
    }

    try {
      const safeTitle = sanitizeFileName(`${track.artist || 'artist'}-${track.title || 'cover'}`.trim() || 'cover')
      const coverFileName = `${safeTitle}.jpg`

      const result = await window.novaPlayer?.downloadRemoteCoverToLibrary?.({
        url: remoteUrl,
        fileName: coverFileName,
      })

      const localCoverUrl = String(result?.fileUrl || '').trim()
      if (!result?.ok || !localCoverUrl) {
        return false
      }

      updateTrack(track.id, {
        coverUrl: localCoverUrl,
        coverRemoteUrl: remoteUrl,
        coverName: track?.coverName || coverFileName,
      })
      return true
    } catch {
      return false
    }
  }, [])

  const persistRemoteCoverUrlLocally = useCallback(async (remoteUrl, hint = 'cover') => {
    const normalizedRemoteUrl = String(remoteUrl || '').trim()
    if (!normalizedRemoteUrl) return ''
    if (isLocalLikeAssetUrl(normalizedRemoteUrl)) return normalizedRemoteUrl

    const cachedLocal = String(coverFileCacheRef.current?.[normalizedRemoteUrl] || '').trim()
    if (cachedLocal) {
      return cachedLocal
    }

    try {
      const safeHint = sanitizeFileName(String(hint || 'cover').trim() || 'cover')
      const result = await window.novaPlayer?.downloadRemoteCoverToLibrary?.({
        url: normalizedRemoteUrl,
        fileName: `${safeHint}.jpg`,
      })
      const localCoverUrl = String(result?.fileUrl || '').trim()
      if (!result?.ok || !localCoverUrl) {
        return ''
      }
      coverFileCacheRef.current = {
        ...coverFileCacheRef.current,
        [normalizedRemoteUrl]: localCoverUrl,
      }
      saveJsonCache(COVER_FILE_CACHE_KEY, coverFileCacheRef.current)
      return localCoverUrl
    } catch {
      return ''
    }
  }, [])

  const applyBulkTrackUpdates = (updatesList) => {
    if (!Array.isArray(updatesList) || !updatesList.length) {
      return
    }
    const updatesMap = new Map(updatesList.map((item) => [item.id, item.updates]))
    setTracks((prev) =>
      prev.map((track) => (updatesMap.has(track.id) ? { ...track, ...updatesMap.get(track.id) } : track)),
    )
    setServerTracks((prev) =>
      prev.map((track) => (updatesMap.has(track.id) ? { ...track, ...updatesMap.get(track.id) } : track)),
    )
  }

  const openEditor = (track) => {
    setEditTargetId(track.id)
    setEditDraft({ title: track.title, artist: track.artist, album: track.album || 'Single' })
    setPendingCover(null)
    setCoverMenuOpen(false)
    setCoverRemovalRequested(false)
  }

  const openBulkEditor = () => {
    const drafts = sortTracksByOrder(tracks).map((track) => ({
      id: track.id,
      title: track.title || '',
      artist: track.artist || '',
      album: track.album || 'Single',
      coverPreviewUrl: track.coverUrl || track.coverRemoteUrl || '',
      coverBlob: null,
      coverName: '',
      removeCover: false,
    }))
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setBulkCoverMenuTrackId(null)
    setBulkCoverTargetTrackId(null)
    setBulkEditDrafts(drafts)
    setBulkEditInitialDrafts(drafts)
    setBulkEditOpen(true)
  }

  const closeBulkEditor = () => {
    if (bulkEditSaving) {
      return
    }
    setBulkEditOpen(false)
    setBulkEditDrafts([])
    setBulkEditInitialDrafts([])
    setBulkCoverMenuTrackId(null)
    setBulkCoverTargetTrackId(null)
  }

  const handleBulkEditChange = (trackId, field, value) => {
    setBulkEditDrafts((prev) =>
      prev.map((item) => (item.id === trackId ? { ...item, [field]: value } : item)),
    )
  }

  const undoBulkEdits = () => {
    if (bulkEditSaving) {
      return
    }
    setBulkEditDrafts(bulkEditInitialDrafts.map((item) => ({ ...item })))
    setBulkCoverMenuTrackId(null)
    setBulkCoverTargetTrackId(null)
  }

  const removeBulkDraft = (trackId) => {
    if (!trackId) {
      return
    }
    setBulkEditDrafts((prev) => {
      const next = prev.filter((item) => item.id !== trackId)
      return next.length === prev.length ? prev : next
    })
    setBulkCoverMenuTrackId((prev) => (prev === trackId ? null : prev))
    setBulkCoverTargetTrackId((prev) => (prev === trackId ? null : prev))
  }

  const openBulkCoverPicker = (trackId) => {
    if (!trackId) {
      return
    }
    setBulkCoverTargetTrackId(trackId)
    setBulkCoverMenuTrackId(null)
    bulkCoverInputRef.current?.click()
  }

  const removeBulkCover = (trackId) => {
    setBulkEditDrafts((prev) =>
      prev.map((item) =>
        item.id === trackId
          ? {
              ...item,
              coverBlob: null,
              coverName: '',
              coverPreviewUrl: '',
              removeCover: true,
            }
          : item,
      ),
    )
    setBulkCoverMenuTrackId(null)
  }

  const handleBulkCoverSelect = (event) => {
    const file = event.target.files?.[0]
    const targetTrackId = bulkCoverTargetTrackId
    if (!file || !targetTrackId) {
      event.target.value = ''
      return
    }

    const coverUrl = URL.createObjectURL(file)
    assetUrlsRef.current.push(coverUrl)
    setBulkEditDrafts((prev) =>
      prev.map((item) =>
        item.id === targetTrackId
          ? {
              ...item,
              coverBlob: file,
              coverName: file.name,
              coverPreviewUrl: coverUrl,
              removeCover: false,
            }
          : item,
      ),
    )
    setBulkCoverTargetTrackId(null)
    event.target.value = ''
  }

  const closeEditor = () => {
    setEditTargetId(null)
    setEditDraft(null)
    setPendingCover(null)
    setCoverMenuOpen(false)
    setCoverRemovalRequested(false)
  }

  const openPlaylistCreator = () => {
    setPlaylistNameDraft('')
    setPlaylistDescriptionDraft('')
    setPlaylistColorDraft(playlistColors[playlists.length % playlistColors.length])
    setPlaylistCoverDraft('')
    setPlaylistTxtImporting(false)
    setPlaylistTxtFileName('')
    setPlaylistTxtImportedTrackIds([])
    setPlaylistTxtEntriesDraft([])
    setPlaylistTxtReviewOpen(false)
    setPlaylistTxtReviewItems([])
    setPlaylistTxtPreviewingTrackId(null)
    setPlaylistTxtImportPlaylistId('')
    setCreatingPlaylist(true)
  }

  const closePlaylistCreator = () => {
    setCreatingPlaylist(false)
    setPlaylistNameDraft('')
    setPlaylistDescriptionDraft('')
    setPlaylistCoverDraft('')
    setPlaylistTxtImporting(false)
    setPlaylistTxtFileName('')
    setPlaylistTxtImportedTrackIds([])
    setPlaylistTxtEntriesDraft([])
    setPlaylistTxtReviewOpen(false)
    setPlaylistTxtReviewItems([])
    setPlaylistTxtPreviewingTrackId(null)
    setPlaylistTxtImportPlaylistId('')
  }

  const stopPlaylistTxtPreview = useCallback(() => {
    if (playlistTxtPreviewTimerRef.current) {
      clearTimeout(playlistTxtPreviewTimerRef.current)
      playlistTxtPreviewTimerRef.current = null
    }
    if (playlistTxtPreviewAudioRef.current) {
      try {
        playlistTxtPreviewAudioRef.current.pause()
      } catch {
        // ignore
      }
      playlistTxtPreviewAudioRef.current.src = ''
      playlistTxtPreviewAudioRef.current = null
    }
    setPlaylistTxtPreviewingTrackId(null)
  }, [])

  const previewPlaylistTxtTrack = useCallback((trackId) => {
    const target = tracks.find((item) => item.id === trackId)
    if (!target?.audioUrl) {
      return
    }
    stopPlaylistTxtPreview()
    const audio = new Audio(target.audioUrl)
    audio.volume = Math.max(0.05, Math.min(0.75, Number(volume) || 0.5))
    audio.currentTime = 0
    playlistTxtPreviewAudioRef.current = audio
    setPlaylistTxtPreviewingTrackId(trackId)
    audio.play().catch(() => setPlaylistTxtPreviewingTrackId(null))
    playlistTxtPreviewTimerRef.current = setTimeout(() => {
      stopPlaylistTxtPreview()
    }, 5000)
  }, [stopPlaylistTxtPreview, tracks, volume])

  const appendTrackToPlaylist = useCallback((playlistId, trackId) => {
    if (!playlistId || !trackId) return
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              trackIds: Array.from(new Set([...(playlist.trackIds || []), trackId])),
            }
          : playlist,
      ),
    )
  }, [])

  const removeTrackFromPlaylistById = useCallback((playlistId, trackId) => {
    if (!playlistId || !trackId) return
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              trackIds: (playlist.trackIds || []).filter((id) => id !== trackId),
            }
          : playlist,
      ),
    )
  }, [])

  useEffect(() => () => stopPlaylistTxtPreview(), [stopPlaylistTxtPreview])

  const openPlaylistAddModal = () => {
    if (!currentPlaylist) {
      return
    }
    setPlaylistAddSearchQuery('')
    setPlaylistAddOpen(true)
  }

  const closePlaylistAddModal = () => {
    setPlaylistAddOpen(false)
    setPlaylistAddSearchQuery('')
  }

  const openPlaylistEditor = (playlist) => {
    setEditingPlaylistId(playlist.id)
    setPlaylistEditDraft(playlist.name)
    setPlaylistEditDescriptionDraft(String(playlist.description || ''))
    setPlaylistEditColorDraft(playlist.color || playlistColors[0])
    setPlaylistEditCoverDraft(playlist.coverUrl || '')
  }

  const closePlaylistEditor = () => {
    setEditingPlaylistId(null)
    setPlaylistEditDraft('')
    setPlaylistEditDescriptionDraft('')
    setPlaylistEditCoverDraft('')
  }

  const closeMenus = () => {
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    setDockPlaylistMenuOpen(false)
    setPlaylistMenuTrackId(null)
    setPlaylistMenuPosition(null)
    setSettingsOpen(false)
    setStatsOpen(false)
    setNotificationsOpen(false)
    setDownloadsOpen(false)
    setLyricsOpen(false)
    setQueueOpen(false)
    setPlaylistAddOpen(false)
    setTopbarYoutubeResults([])
    setTopbarYoutubeError('')
  }

  const openPlaylistContextMenu = (playlistId, pointer) => {
    const horizontalPadding = 12
    const verticalPadding = 12
    const menuEstimatedHeight = 196
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const menuWidth = 220
    const left = Math.min(
      Math.max(pointer.x, horizontalPadding),
      Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
    )
    const top = Math.min(
      Math.max(pointer.y, verticalPadding),
      Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
    )

    setPlaylistContextMenuId(playlistId)
    setPlaylistContextMenuPosition({
      position: 'fixed',
      top,
      left,
      width: menuWidth,
    })
  }

  const handleCollectionSelect = useCallback((collectionId) => {
    const fallbackWindow = typeof window !== 'undefined' ? window : null
    const previousTop = fallbackWindow?.scrollY ?? 0
    const previousLeft = fallbackWindow?.scrollX ?? 0
    const activeElement = typeof document !== 'undefined' ? document.activeElement : null
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    setSelectedCollectionId(collectionId)
    setTrackSearchQuery('')

    if (!fallbackWindow) {
      return
    }

    const restore = () => {
      fallbackWindow.scrollTo({
        top: previousTop,
        left: previousLeft,
        behavior: 'auto',
      })
    }

    fallbackWindow.requestAnimationFrame(() => {
      restore()
      fallbackWindow.requestAnimationFrame(restore)
    })
  }, [])

  const reorderTracksByDrag = (draggedId, droppedOnId) => {
    if (!draggedId || !droppedOnId || draggedId === droppedOnId) {
      return
    }

    const reorderableVisibleIds = visibleTracks
      .filter((track) => track.source !== 'drive' && track.source !== 'shared')
      .map((track) => track.id)
    if (!reorderableVisibleIds.includes(draggedId) || !reorderableVisibleIds.includes(droppedOnId)) {
      return
    }

    const nextVisibleOrder = [...reorderableVisibleIds]
    const fromIndex = nextVisibleOrder.indexOf(draggedId)
    const toIndex = nextVisibleOrder.indexOf(droppedOnId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const [moved] = nextVisibleOrder.splice(fromIndex, 1)
    nextVisibleOrder.splice(toIndex, 0, moved)

    setTracks((prev) => {
      const localTracks = prev.filter((track) => track.source !== 'drive' && track.source !== 'shared')
      if (!localTracks.length) {
        return prev
      }

      const localSorted = sortTracksByOrder(localTracks)
      const movedSet = new Set(nextVisibleOrder)
      const mergedLocalIds = []
      let inserted = false

      for (const track of localSorted) {
        if (!movedSet.has(track.id)) {
          mergedLocalIds.push(track.id)
          continue
        }

        if (!inserted) {
          mergedLocalIds.push(...nextVisibleOrder)
          inserted = true
        }
      }

      if (!inserted) {
        mergedLocalIds.push(...nextVisibleOrder)
      }

      const nextOrderById = new Map(mergedLocalIds.map((id, index) => [id, index]))
      return prev.map((track) =>
        track.source === 'drive'
          ? track
          : {
              ...track,
              order: nextOrderById.get(track.id) ?? getTrackSortValue(track),
            },
      )
    })
  }

  const setAppFullscreen = useCallback((nextState) => {
    if (typeof window !== 'undefined' && window.novaPlayer?.setWindowFullscreen) {
      window.novaPlayer.setWindowFullscreen(nextState)
    }
  }, [])

  const revealFullscreenControls = useCallback(() => {
    setFullscreenControlsVisible(true)

    if (fullscreenControlsTimerRef.current) {
      window.clearTimeout(fullscreenControlsTimerRef.current)
    }

    fullscreenControlsTimerRef.current = window.setTimeout(() => {
      setFullscreenControlsVisible(false)
      fullscreenControlsTimerRef.current = null
    }, 2200)
  }, [])

  const hideFullscreenControls = useCallback(() => {
    if (fullscreenControlsTimerRef.current) {
      window.clearTimeout(fullscreenControlsTimerRef.current)
      fullscreenControlsTimerRef.current = null
    }

    setFullscreenControlsVisible(false)
  }, [])

  const openFullscreenTrack = useCallback(() => {
    if (currentTrack) {
      setFullscreenTrackOpen(true)
      setFullscreenQueueOpen(false)
      setAppFullscreen(true)
      revealFullscreenControls()
    }
  }, [currentTrack, revealFullscreenControls, setAppFullscreen])

  const closeFullscreenTrack = useCallback(() => {
    setFullscreenTrackOpen(false)
    setFullscreenQueueOpen(false)
    setLyricsOpen(false)
    setAppFullscreen(false)
    hideFullscreenControls()
  }, [hideFullscreenControls, setAppFullscreen])

  const seekBySeconds = useCallback((deltaSeconds) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const activeDuration = Number.isFinite(audio.duration) ? audio.duration : duration
    const nextTime = (audio.currentTime || 0) + deltaSeconds
    const clampedTime = Number.isFinite(activeDuration) && activeDuration > 0
      ? Math.max(0, Math.min(nextTime, activeDuration))
      : Math.max(0, nextTime)

    audio.currentTime = clampedTime
    setProgress(clampedTime)
    restoreSeekRef.current = clampedTime
  }, [duration])

  useEffect(() => {
    if (!fullscreenTrackOpen) {
      hideFullscreenControls()
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeFullscreenTrack()
      }
    }

    revealFullscreenControls()
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      hideFullscreenControls()
    }
  }, [fullscreenTrackOpen, closeFullscreenTrack, hideFullscreenControls, revealFullscreenControls])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined
    }

    const html = document.documentElement
    const body = document.body
    const className = 'fullscreen-track-open'

    if (fullscreenTrackOpen) {
      html?.classList.add(className)
      body?.classList.add(className)
    } else {
      html?.classList.remove(className)
      body?.classList.remove(className)
    }

    return () => {
      html?.classList.remove(className)
      body?.classList.remove(className)
    }
  }, [fullscreenTrackOpen])

  useEffect(() => {
    const handleArrowSeek = (event) => {
      if (!arrowSeekEnabled || event.defaultPrevented || !currentTrack) {
        return
      }

      const activeElement = document.activeElement
      const tagName = activeElement?.tagName?.toLowerCase()
      const isInteractiveTarget =
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'summary' ||
        activeElement?.getAttribute?.('role') === 'button'

      if (isKeyboardInputContext(event) || isInteractiveTarget || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        seekBySeconds(5)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seekBySeconds(-5)
      }
    }

    window.addEventListener('keydown', handleArrowSeek)
    return () => {
      window.removeEventListener('keydown', handleArrowSeek)
    }
  }, [arrowSeekEnabled, currentTrack, seekBySeconds])

  const updateAppSettings = (nextSettings) => {
    if (typeof window !== 'undefined' && window.novaPlayer?.updateAppSettings) {
      window.novaPlayer.updateAppSettings(nextSettings)
    }
  }

  const openUploadPicker = () => {
    openAddModal()
  }

  const toArrayBuffer = async (blob, fallbackUrl = '') => {
    if (blob instanceof Blob) {
      return blob.arrayBuffer()
    }

    if (fallbackUrl?.startsWith('blob:') || fallbackUrl?.startsWith('data:')) {
      try {
        const response = await fetch(fallbackUrl)
        if (response.ok) {
          return response.arrayBuffer()
        }
      } catch {
        return null
      }
    }

    return null
  }

  const showUploadNotice = (message) => {
    const text = String(message || '').trim()
    if (!text) {
      return
    }

    const nextNotice = {
      id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message: text,
      createdAt: Date.now(),
      read: false,
    }
    setNotifications((prev) => [nextNotice, ...prev].slice(0, 80))
    setHasUnreadNotifications(true)
    setDownloadsConsoleLines((prev) => [`${new Date().toLocaleTimeString()}  ${text}`, ...prev].slice(0, 120))
    return nextNotice.id
  }

  const pushDownloadConsoleLine = useCallback((text) => {
    const line = String(text || '').trim()
    if (!line) return
    setDownloadsConsoleLines((prev) => [`${new Date().toLocaleTimeString()}  ${line}`, ...prev].slice(0, 120))
  }, [])

  const upsertDownloadJob = useCallback((payload = {}) => {
    const requestId = String(payload.requestId || '').trim()
    if (!requestId) {
      return
    }

    const now = Date.now()
    setDownloadJobs((prev) => {
      const index = prev.findIndex((item) => item.requestId === requestId)
      const nextItem = {
        requestId,
        title: String(payload.title || '').trim(),
        artist: String(payload.artist || '').trim(),
        status: String(payload.status || 'downloading').trim() || 'downloading',
        receivedBytes: Number(payload.receivedBytes || 0) || 0,
        totalBytes: Number(payload.totalBytes || 0) || 0,
        filePath: String(payload.filePath || '').trim(),
        createdAt: index >= 0 ? prev[index].createdAt : now,
        updatedAt: now,
      }

      if (index >= 0) {
        const clone = [...prev]
        clone[index] = { ...clone[index], ...nextItem }
        return clone
      }

      return [nextItem, ...prev].slice(0, 140)
    })
  }, [])

  const updateNotificationsPanelPosition = useCallback(() => {
    const anchor = notificationsButtonRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(440, Math.max(280, window.innerWidth - 24))
    const minLeft = 12
    const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 12)
    const left = Math.min(maxLeft, Math.max(minLeft, rect.right - panelWidth))
    const top = Math.min(window.innerHeight - 120, rect.bottom + 8)

    setNotificationsPanelPosition({
      top,
      left,
      width: panelWidth,
    })
  }, [])

  const updateDownloadsPanelPosition = useCallback(() => {
    const anchor = downloadsButtonRef.current
    if (!anchor) {
      return
    }

    const rect = anchor.getBoundingClientRect()
    const panelWidth = Math.min(460, Math.max(300, window.innerWidth - 24))
    const minLeft = 12
    const maxLeft = Math.max(minLeft, window.innerWidth - panelWidth - 12)
    const left = Math.min(maxLeft, Math.max(minLeft, rect.right - panelWidth))
    const top = Math.min(window.innerHeight - 120, rect.bottom + 8)

    setDownloadsPanelPosition({
      top,
      left,
      width: panelWidth,
    })
  }, [])

  const toggleNotificationsPanel = () => {
    setNotificationsOpen((prev) => {
      const next = !prev
      if (next) {
        setDownloadsOpen(false)
        updateNotificationsPanelPosition()
        setHasUnreadNotifications(false)
        setNotifications((current) =>
          current.map((notice) => (notice.read ? notice : { ...notice, read: true })),
        )
      }
      return next
    })
  }

  const toggleDownloadsPanel = () => {
    setDownloadsOpen((prev) => {
      const next = !prev
      if (next) {
        setNotificationsOpen(false)
        updateDownloadsPanelPosition()
      }
      return next
    })
  }

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined
    }

    const handlePositionUpdate = () => updateNotificationsPanelPosition()
    window.addEventListener('resize', handlePositionUpdate)
    window.addEventListener('scroll', handlePositionUpdate, true)

    return () => {
      window.removeEventListener('resize', handlePositionUpdate)
      window.removeEventListener('scroll', handlePositionUpdate, true)
    }
  }, [notificationsOpen, updateNotificationsPanelPosition])

  useEffect(() => {
    if (!downloadsOpen) {
      return undefined
    }

    const handlePositionUpdate = () => updateDownloadsPanelPosition()
    window.addEventListener('resize', handlePositionUpdate)
    window.addEventListener('scroll', handlePositionUpdate, true)

    return () => {
      window.removeEventListener('resize', handlePositionUpdate)
      window.removeEventListener('scroll', handlePositionUpdate, true)
    }
  }, [downloadsOpen, updateDownloadsPanelPosition])

  useEffect(() => {
    const bridge = window?.novaPlayer
    const unsubscribe = bridge?.onLibraryDownloadProgress?.((payload) => {
      upsertDownloadJob(payload)
      const requestId = String(payload?.requestId || '').trim()
      const title = String(payload?.title || '').trim() || 'İndirme'
      const status = String(payload?.status || 'downloading').trim()
      if (!requestId) return
      const prevStatus = downloadStatusMapRef.current.get(requestId)
      if (prevStatus !== status) {
        downloadStatusMapRef.current.set(requestId, status)
        if (status === 'completed') pushDownloadConsoleLine(`Tamamlandı: ${title}`)
        else if (status === 'failed') pushDownloadConsoleLine(`Başarısız: ${title}`)
        else if (status === 'cancelled') pushDownloadConsoleLine(`İptal edildi: ${title}`)
        else if (status === 'paused') pushDownloadConsoleLine(`Durduruldu: ${title}`)
        else if (status === 'downloading' && prevStatus !== 'starting') pushDownloadConsoleLine(`Başladı: ${title}`)
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [pushDownloadConsoleLine, upsertDownloadJob])

  useEffect(() => {
    const bridge = window?.novaPlayer
    if (!bridge?.onUpdaterEvent) {
      return undefined
    }

    const notifyOnce = (key, message) => {
      const text = String(message || '').trim()
      if (!text) {
        return
      }
      if (lastUpdaterNoticeRef.current === key) {
        return
      }
      lastUpdaterNoticeRef.current = key
      showUploadNotice(text)
    }

    const handleUpdaterEvent = (payload) => {
      setUpdaterUiState((prev) => ({
        ...prev,
        supported: prev.supported || Boolean(payload?.supported),
        checking: Boolean(payload?.checking),
        updateAvailable: Boolean(payload?.updateAvailable),
        downloading: Boolean(payload?.downloading),
        downloaded: Boolean(payload?.downloaded),
        progressPercent: Number(payload?.progressPercent || 0),
        latestVersion: String(payload?.latestVersion || ''),
        error: String(payload?.error || ''),
      }))

      const eventName = String(payload?.event || '').trim()
      if (!eventName) {
        return
      }

      if (eventName === 'manual-check' || eventName === 'checking') {
        setUpdaterManualCheckUpToDate(false)
      }

      if (eventName === 'not-available') {
        if (updaterManualCheckPendingRef.current) {
          setUpdaterManualCheckUpToDate(true)
          updaterManualCheckPendingRef.current = false
        }
        return
      }

      if (eventName === 'available') {
        updaterManualCheckPendingRef.current = false
        setUpdaterManualCheckUpToDate(false)
        setUpdaterCenterModalOpen(true)
        const version = String(payload?.latestVersion || '').trim()
        notifyOnce(
          `available:${version || 'unknown'}`,
          version ? `Yeni sürüm bulundu: v${version}` : 'Yeni sürüm bulundu.',
        )
        return
      }

      if (eventName === 'downloaded') {
        updaterManualCheckPendingRef.current = false
        setUpdaterCenterModalOpen(true)
        const version = String(payload?.latestVersion || '').trim()
        notifyOnce(
          `downloaded:${version || 'unknown'}`,
          version
            ? `Güncelleme indirildi: v${version}. Yeniden başlatınca otomatik kurulur.`
            : 'Güncelleme indirildi. Yeniden başlatınca otomatik kurulur.',
        )
        return
      }

      if (eventName === 'error') {
        updaterManualCheckPendingRef.current = false
        setUpdaterManualCheckUpToDate(false)
        const errorText = String(payload?.error || '').trim()
        if (!errorText) {
          return
        }
        notifyOnce(`error:${errorText}`, `Güncelleme kontrolünde hata: ${errorText}`)
      }
    }

    const unsubscribe = bridge.onUpdaterEvent(handleUpdaterEvent)
    bridge.getUpdaterState?.().then((state) => {
      setUpdaterUiState({
        supported: Boolean(state?.supported),
        checking: Boolean(state?.checking),
        updateAvailable: Boolean(state?.updateAvailable),
        downloading: Boolean(state?.downloading),
        downloaded: Boolean(state?.downloaded),
        progressPercent: Number(state?.progressPercent || 0),
        latestVersion: String(state?.latestVersion || ''),
        error: String(state?.error || ''),
      })
      if (state?.updateAvailable || state?.downloading || state?.downloaded) {
        setUpdaterCenterModalOpen(true)
      }
      if (state?.downloaded) {
        const version = String(state?.latestVersion || '').trim()
        notifyOnce(
          `downloaded:${version || 'unknown'}`,
          version
            ? `Güncelleme indirildi: v${version}. Yeniden başlatınca otomatik kurulur.`
            : 'Güncelleme indirildi. Yeniden başlatınca otomatik kurulur.',
        )
      }
    }).catch(() => {})

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [showUploadNotice])

  const clearNotifications = () => {
    const stickyNoticeId = playlistTxtImportNoticeIdRef.current
    setNotifications((prev) =>
      stickyNoticeId ? prev.filter((notice) => notice.id === stickyNoticeId) : [],
    )
    setHasUnreadNotifications(false)
  }

  const removeNotification = (noticeId) => {
    if (noticeId && noticeId === playlistTxtImportNoticeIdRef.current) {
      return
    }
    setNotifications((prev) => {
      const filtered = prev.filter((notice) => notice.id !== noticeId)
      if (!filtered.length) {
        setHasUnreadNotifications(false)
      }
      return filtered
    })
  }

  const runDependencyAutoInstall = useCallback(async () => {
    const deps = [
      ...(Array.isArray(dependencyStatus?.missing) ? dependencyStatus.missing : []),
      ...(Array.isArray(dependencyStatus?.missingPython) ? dependencyStatus.missingPython : []),
    ]
    if (!deps.length) {
      showUploadNotice('Eksik bileşen yok.')
      return
    }
    deps.forEach((dep) => {
      const link = getDependencyDownloadLink(dep, appPlatform)
      if (link) window.novaPlayer?.openExternal?.(link)
    })
    setDependencyRestartNotice(true)
    showUploadNotice('İndirme sayfaları açıldı. Kurup uygulamayı yeniden başlat.')
  }, [appPlatform, dependencyStatus, showUploadNotice])

  const handleDependencyLinkClick = useCallback((dep) => {
    const link = getDependencyDownloadLink(dep, appPlatform) || 'https://github.com'
    window.novaPlayer?.openExternal?.(link)
    setDependencyRestartNotice(true)
  }, [appPlatform])

  const openDependencyNoticeFromConsole = useCallback(async () => {
    try {
      const status = (await window.novaPlayer?.checkDependencies?.()) || MANUAL_DEPENDENCY_STATUS
      setDependencyStatus(status)
      setDependencyNoticeOpen(true)
      pushDownloadConsoleLine('Eksik modallar menüsü açıldı.')
    } catch {
      setDependencyStatus(MANUAL_DEPENDENCY_STATUS)
      setDependencyNoticeOpen(true)
      pushDownloadConsoleLine('Eksik modallar menüsü varsayılan durumla açıldı.')
    }
  }, [pushDownloadConsoleLine])

  const restartAppForDependencies = useCallback(async () => {
    try {
      await window.novaPlayer?.restartApp?.()
    } catch {
      showUploadNotice('Yeniden başlatılamadı. Uygulamayı manuel kapatıp aç.')
    }
  }, [showUploadNotice])

  useEffect(() => {
    if (!SHOW_DEPENDENCY_NOTICE) {
      return
    }
    if (!isHydrated) {
      return
    }
    const run = async () => {
      try {
        const status = (await window.novaPlayer?.checkDependencies?.()) || MANUAL_DEPENDENCY_STATUS
        const missingBase = Array.isArray(status?.missing) ? status.missing : []
        const missingPython = Array.isArray(status?.missingPython) ? status.missingPython : []
        if (!missingBase.length && !missingPython.length) {
          setDependencyNoticeOpen(false)
          return
        }
        setDependencyStatus(status)
        setDependencyNoticeOpen(true)
      } catch {
        setDependencyStatus(MANUAL_DEPENDENCY_STATUS)
      }
    }
    run()
    return () => {
      // no-op
    }
  }, [isHydrated])

  useEffect(() => {
    if (!settingsOpen) {
      setConsoleUnlocked(false)
      setConsoleSecretInput('')
      setConsoleSecretConfirm('')
      setConsoleAuthError('')
    }
  }, [settingsOpen])

  useEffect(() => {
    if (artistProfileOpen) {
      return
    }
    setArtistProfileYtAlbums([])
    setArtistProfileYtSingles([])
    setArtistProfileYtTopSongs([])
    setArtistProfileReleaseTracksByKey({})
    setArtistProfileSelectedYtAlbumKey('')
    setArtistProfileSelectedYtSingleKey('')
    setArtistProfileReleaseLoadingKey('')
  }, [artistProfileOpen])

  useEffect(() => {
    if (albumInfoOpen) {
      return
    }
    setAlbumInfo(null)
    setAlbumInfoYtTracks([])
    setAlbumInfoYtTracksLoading(false)
    setAlbumInfoDownloadingIds(new Set())
  }, [albumInfoOpen])

  useEffect(() => {
    if (addModalOpen) {
      return
    }
    setYoutubeSearchResults([])
    setYoutubeSearchRootResults([])
    setYoutubeSearchAlbumViewTitle('')
    setYoutubeSearchError('')
  }, [addModalOpen])

  const checkFirstRunDependencies = useCallback(async () => {
    setFirstRunDependencyLoading(true)
    setFirstRunDependencyError('')
    try {
      const status = (await window.novaPlayer?.checkDependencies?.()) || MANUAL_DEPENDENCY_STATUS
      setFirstRunDependencyStatus(status)
      setDependencyStatus(status)
    } catch {
      setFirstRunDependencyStatus(MANUAL_DEPENDENCY_STATUS)
    } finally {
      setFirstRunDependencyLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    const isDone = localStorage.getItem(FIRST_RUN_ONBOARDING_KEY) === 'done'
    if (!isDone) {
      setFirstRunWizardOpen(true)
      setFirstRunWizardStep(1)
    }
  }, [isHydrated])

  useEffect(() => {
    if (!dependencyNoticeOpen) {
      dependencyAutoInstallStartedRef.current = false
      return
    }
    const missingBase = Array.isArray(dependencyStatus?.missing) ? dependencyStatus.missing : []
    const missingPython = Array.isArray(dependencyStatus?.missingPython) ? dependencyStatus.missingPython : []
    if (!missingBase.length && !missingPython.length) {
      return
    }
    if (dependencyAutoInstallStartedRef.current) {
      return
    }
    dependencyAutoInstallStartedRef.current = true
  }, [dependencyNoticeOpen, dependencyStatus])

  const handleFirstRunAutoInstall = useCallback(async () => {
    setFirstRunDependencyLoading(true)
    setFirstRunDependencyError('')
    const deps = [
      ...(Array.isArray(firstRunDependencyStatus?.missing) ? firstRunDependencyStatus.missing : []),
      ...(Array.isArray(firstRunDependencyStatus?.missingPython) ? firstRunDependencyStatus.missingPython : []),
    ]
    if (!deps.length) {
      setFirstRunDependencyLoading(false)
      showUploadNotice('Eksik bileşen yok.')
      return
    }
    deps.forEach((dep) => {
      const link = getDependencyDownloadLink(dep, appPlatform)
      if (link) window.novaPlayer?.openExternal?.(link)
    })
    setDependencyRestartNotice(true)
    showUploadNotice('İndirme sayfaları açıldı. Kurulumdan sonra devam et.')
    setFirstRunDependencyLoading(false)
  }, [appPlatform, firstRunDependencyStatus, showUploadNotice])

  const completeFirstRunWizard = useCallback(() => {
    localStorage.setItem(FIRST_RUN_ONBOARDING_KEY, 'done')
    localStorage.setItem('nova-player-dependency-notice-v2', 'seen')
    setFirstRunWizardOpen(false)
  }, [])

  const rerunFirstRunWizard = useCallback(async () => {
    localStorage.removeItem(FIRST_RUN_ONBOARDING_KEY)
    setFirstRunWizardStep(1)
    setFirstRunWizardOpen(true)
    setSettingsOpen(false)
  }, [])

  const unlockConsoleAccess = useCallback(async () => {
    setConsoleAuthError('')
    const secret = String(consoleSecretInput || '').trim()
    if (!secret) {
      setConsoleAuthError(language === 'en' ? 'Enter password.' : 'Şifre gir.')
      return
    }
    if (!consoleAccessHash || !consoleAccessSalt) {
      if (secret.length < 6) {
        setConsoleAuthError(language === 'en' ? 'Password must be at least 6 characters.' : 'Şifre en az 6 karakter olmalı.')
        return
      }
      if (secret !== String(consoleSecretConfirm || '').trim()) {
        setConsoleAuthError(language === 'en' ? 'Passwords do not match.' : 'Şifreler eşleşmiyor.')
        return
      }
      const salt = Math.random().toString(36).slice(2, 10)
      const digest = await hashConsoleSecret(`${salt}:${secret}`)
      if (!digest) {
        setConsoleAuthError(language === 'en' ? 'Password could not be created.' : 'Şifre oluşturulamadı.')
        return
      }
      setConsoleAccessSalt(salt)
      setConsoleAccessHash(digest)
      setConsoleUnlocked(true)
      setConsoleSecretInput('')
      setConsoleSecretConfirm('')
      pushDownloadConsoleLine(language === 'en' ? 'Console password created.' : 'Konsol şifresi oluşturuldu.')
      return
    }
    const digest = await hashConsoleSecret(`${consoleAccessSalt}:${secret}`)
    if (digest && digest === consoleAccessHash) {
      setConsoleUnlocked(true)
      setConsoleSecretInput('')
      setConsoleSecretConfirm('')
      pushDownloadConsoleLine(language === 'en' ? 'Console unlocked.' : 'Konsol kilidi açıldı.')
      return
    }
    setConsoleAuthError(language === 'en' ? 'Wrong password.' : 'Şifre hatalı.')
  }, [
    consoleAccessHash,
    consoleAccessSalt,
    consoleSecretConfirm,
    consoleSecretInput,
    language,
    pushDownloadConsoleLine,
  ])

  const lockConsoleAccess = useCallback(() => {
    setConsoleUnlocked(false)
    setConsoleSecretInput('')
    setConsoleSecretConfirm('')
    setConsoleAuthError('')
  }, [])

  const handleUpdaterCheckNow = async () => {
    try {
      updaterManualCheckPendingRef.current = true
      setUpdaterManualCheckUpToDate(false)
      const result = await window.novaPlayer?.checkForUpdates?.()
      if (result?.ok === false && result?.reason) {
        updaterManualCheckPendingRef.current = false
        setUpdaterManualCheckUpToDate(false)
        showUploadNotice(`Güncelleme kontrolü: ${result.reason}`)
      }
    } catch {
      updaterManualCheckPendingRef.current = false
      setUpdaterManualCheckUpToDate(false)
      showUploadNotice('Güncelleme kontrolü başlatılamadı.')
    }
  }

  const handleUpdaterInstallNow = async () => {
    try {
      const result = await window.novaPlayer?.installUpdate?.()
      if (!result?.ok) {
        showUploadNotice('Kurulum henüz hazır değil.')
        return
      }
      showUploadNotice('Güncelleme kuruluyor, uygulama kapanıp yeniden açılacak.')
    } catch {
      showUploadNotice('Güncelleme kurulumu başlatılamadı.')
    }
  }

  const openReportIssueModal = () => {
    setReportIssueDraft({
      title: '',
      subject: '',
      description: '',
    })
    setReportIssueSubmitting(false)
    setReportIssueOpen(true)
  }

  const submitReportIssue = async () => {
    const title = String(reportIssueDraft.title || '').trim()
    const subject = String(reportIssueDraft.subject || '').trim()
    const description = String(reportIssueDraft.description || '').trim()

    if (!title || !subject || !description) {
      showUploadNotice('Başlık, konu ve açıklama zorunlu.')
      return
    }

    setReportIssueSubmitting(true)

    const context = {
      appName: APP_NAME,
      appVersion: APP_VERSION,
      platform: window?.novaPlayer?.platform || navigator?.platform || 'unknown',
      currentTrackId,
      selectedCollectionId,
      playbackCollectionId,
      themeMode,
      isPlaying,
      volume,
      progress: Number(progress || 0),
      duration: Number(duration || 0),
      timestamp: Date.now(),
    }

    try {
      // Webhook-only mod: önce Electron bridge üzerinden doğrudan gönder.
      if (window.novaPlayer?.reportIssue) {
        const bridgeResult = await window.novaPlayer.reportIssue({
          title,
          subject,
          description,
          context,
        })
        if (bridgeResult?.ok) {
          showUploadNotice('Hata bildirimi Discord kanalına gönderildi.')
          setReportIssueOpen(false)
          setReportIssueSubmitting(false)
          return
        }
      }

      // Bridge yoksa / başarısızsa API relay dene.
      const response = await fetch(`${API_BASE}/api/report-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          description,
          context,
        }),
      })

      if (response.ok) {
        showUploadNotice('Hata bildirimi Discord kanalına gönderildi.')
        setReportIssueOpen(false)
        setReportIssueSubmitting(false)
        return
      }

      const apiDetail = await response.json().catch(() => ({}))
      const reason = String(apiDetail?.error || `api_http_${response.status}`)

      showUploadNotice(`Hata bildirimi gönderilemedi: ${reason}`)
      setReportIssueSubmitting(false)
    } catch {
      showUploadNotice('Hata bildirimi gönderilemedi: sunucuya bağlanılamadı.')
      setReportIssueSubmitting(false)
    }
  }

  const clearDownloadJobs = () => {
    setDownloadJobs([])
  }

  const removeDownloadJob = (requestId) => {
    setDownloadJobs((prev) => prev.filter((item) => item.requestId !== requestId))
  }

  const controlDownloadJob = useCallback(async (requestId, action) => {
    const bridge = window?.novaPlayer
    if (!bridge?.controlDownload) {
      return
    }
    try {
      await bridge.controlDownload({ requestId, action })
    } catch {
      // ignore bridge control failures
    }
  }, [])

  const persistArtistProfileYtCache = useCallback(() => {
    pruneCacheEntries(artistProfileYtCacheRef.current, MAX_ARTIST_PROFILE_YT_CACHE_ENTRIES)
    saveJsonCache(ARTIST_PROFILE_YT_CACHE_KEY, artistProfileYtCacheRef.current)
  }, [])

  const getLyricsCacheKeyForTrack = useCallback((track) => {
    const artistKey = normalizeArtistQuery(track?.artist || '').toLowerCase()
    const titleKey = cleanTrackTitleForLyrics(track?.title || '').toLowerCase()
    if (!artistKey || !titleKey) {
      return ''
    }
    return `${artistKey}|${titleKey}`
  }, [])

  const prefetchLyricsForTrack = useCallback(
    async (track) => {
      const cacheKey = getLyricsCacheKeyForTrack(track)
      if (!cacheKey) {
        return
      }
      if (Object.prototype.hasOwnProperty.call(lyricsCacheRef.current, cacheKey)) {
        const cached = String(lyricsCacheRef.current[cacheKey] || '').trim()
        if (!cached) {
          delete lyricsCacheRef.current[cacheKey]
          saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
        } else {
          return
        }
      }
      if (lyricsPrefetchInFlightRef.current.has(cacheKey)) {
        return
      }

      lyricsPrefetchInFlightRef.current.add(cacheKey)
      try {
        const text = await fetchLyricsForTrack(track)
        if (text) {
          setLruCacheValue(lyricsCacheRef.current, cacheKey, text, MAX_LYRICS_CACHE_ENTRIES)
          saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
        }
        if (text && track?.id) {
          updateTrack(track.id, { lyricsLocal: text })
        }
      } catch {
        // ignore prefetch errors
      } finally {
        lyricsPrefetchInFlightRef.current.delete(cacheKey)
      }
    },
    [getLyricsCacheKeyForTrack],
  )

  const repairTrackCoverIfMissing = useCallback(
    async (track) => {
      if (!track?.id) return
      if (coverRepairInFlightRef.current.has(track.id)) return
      coverRepairInFlightRef.current.add(track.id)
      try {
        const title = cleanFilenameTrackTitle(String(track.title || '').trim()) || ''
        const artist = sanitizeDisplayText(String(track.artist || '').trim()) || ''
        if (!title || !artist) return
        const remoteMeta = await fetchRemoteTrackMetaSmart(title, artist, {
          preferredAlbum: String(track.album || '').trim(),
          preferredDuration: Number(track.duration || 0),
        })
        const nextCover = String(remoteMeta?.coverUrl || '').trim()
        if (nextCover) {
          updateTrack(track.id, { coverUrl: nextCover, coverRemoteUrl: nextCover })
          const cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
          setLruCacheValue(coverArtCacheRef.current, cacheKey, nextCover, MAX_COVER_CACHE_ENTRIES)
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        }
      } catch {
        // ignore cover repair errors
      } finally {
        coverRepairInFlightRef.current.delete(track.id)
      }
    },
    [updateTrack],
  )

  const revealAudioOnlyTracks = useCallback(async () => {
    setRestoringLegacyData(true)
    try {
      let restoredLegacy = false
      if (window.novaPlayer?.restoreLegacyData) {
        const legacyResult = await window.novaPlayer.restoreLegacyData()
        if (legacyResult?.ok && legacyResult?.migrated) {
          restoredLegacy = true
          showUploadNotice('Eski uygulama verisi bulundu. Uygulama yeniden baslatiliyor...')
          setTimeout(() => {
            window.novaPlayer?.restartApp?.()
          }, 500)
          return
        }
      }

      if (window.novaPlayer?.resolveLocalTrackUrls) {
        const missingLocalUrlTracks = tracks
          .filter((record) =>
            String(record?.source || '') === 'local' &&
            (
              !String(record?.audioUrl || '').trim() ||
              /^file:\/\//i.test(String(record?.audioUrl || '').trim())
            ) &&
            String(record?.fileName || '').trim(),
          )
          .map((record) => ({
            id: record.id,
            fileName: String(record.fileName || '').trim(),
            audioUrl: String(record.audioUrl || '').trim(),
          }))

        if (missingLocalUrlTracks.length) {
          try {
            const repaired = await window.novaPlayer.resolveLocalTrackUrls({
              tracks: missingLocalUrlTracks,
            })
            const resolvedMap =
              repaired?.ok && repaired?.resolved && typeof repaired.resolved === 'object'
                ? repaired.resolved
                : {}
            if (Object.keys(resolvedMap).length) {
              setTracks((prev) =>
                prev.map((record) => {
                  const resolvedAudioUrl = String(resolvedMap[record?.id] || '').trim()
                  return resolvedAudioUrl ? { ...record, audioUrl: resolvedAudioUrl } : record
                }),
              )
            }
          } catch {
            // ignore local url repair failures
          }
        }
      }

      if (window.novaPlayer?.listLocalLibraryFiles) {
        try {
          const scanResult = await window.novaPlayer.listLocalLibraryFiles()
          const scannedFiles = Array.isArray(scanResult?.files) ? scanResult.files : []
          if (scanResult?.ok && scannedFiles.length) {
            const existingByFileName = new Set(
              tracks
                .map((track) => String(track?.fileName || '').trim().toLowerCase())
                .filter(Boolean),
            )
            const missingFiles = scannedFiles.filter((file) => {
              const key = String(file?.fileName || '').trim().toLowerCase()
              return key && !existingByFileName.has(key)
            })

            if (missingFiles.length) {
              const baseOrder =
                Math.max(-1, ...allTracks.map((track, index) => getTrackSortValue(track, index))) + 1
              const rebuiltTracks = missingFiles.map((file, index) => {
                const parsed = parseTrackName(String(file?.fileName || ''))
                const title = cleanFilenameTrackTitle(parsed.title || '') || 'Bilinmeyen parça'
                const artist = String(parsed.artist || 'Yerel Koleksiyon').trim() || 'Yerel Koleksiyon'
                const audioUrl = String(file?.audioUrl || '').trim()
                const sizeBytes = Number(file?.sizeBytes || 0)
                const sizeMb = sizeBytes > 0 ? `${(sizeBytes / 1024 / 1024).toFixed(1)} MB` : ''
                const createdAt = Number(file?.mtimeMs || Date.now()) || Date.now()
                return {
                  id: `manual-recovered-${String(file?.fileName || title)}-${createdAt}-${index}`,
                  title,
                  artist,
                  album: 'Single',
                  genre: '',
                  fileName: String(file?.fileName || '').trim() || `${title}.mp3`,
                  size: sizeMb,
                  duration: 0,
                  gradient: gradients[index % gradients.length],
                  audioUrl,
                  coverBlob: null,
                  coverUrl: '',
                  coverRemoteUrl: '',
                  coverTone: '',
                  coverName: '',
                  isFavorite: false,
                  createdAt,
                  order: baseOrder + index,
                  source: 'local',
                  metadataLocked: true,
                  lyricsLocal: '',
                }
              }).filter((track) => String(track.audioUrl || '').trim())

              if (rebuiltTracks.length) {
                setTracks((prev) => [...prev, ...rebuiltTracks])
              }
            }
          }
        } catch {
          // ignore local library scan failures
        }
      }

      if (!restoredLegacy) {
        setManualTrackRepairRequest((prev) => prev + 1)
        tracks.forEach((track) => {
          const missingLyrics = !String(track?.lyricsLocal || track?.lyrics || '').trim()
          if (missingLyrics) {
            prefetchLyricsForTrack(track)
          }
        })
        showUploadNotice('Veriler aranıyor. Eski klasorler, uygulama verisi ve eksik dosya yolları kontrol edildi.')
      }
    } finally {
      setRestoringLegacyData(false)
    }
  }, [allTracks, prefetchLyricsForTrack, showUploadNotice, tracks])

  const prefetchArtistCatalogForTrack = useCallback(
    async (track) => {
      if (track?.metadataLocked) {
        return
      }
      const artistName = sanitizeDisplayText(String(track?.artist || '').trim())
      const cacheKey = normalizeCoverMatchText(artistName)
      if (!artistName || !cacheKey || cacheKey === 'yerel koleksiyon' || cacheKey === 'bilinmeyen sanatci') {
        return
      }
      if (artistCatalogPrefetchInFlightRef.current.has(cacheKey)) {
        return
      }

      const cached = artistProfileYtCacheRef.current[cacheKey]
      const cacheAgeMs = Date.now() - Number(cached?.at || 0)
      const isCacheFresh = cacheAgeMs < 1000 * 60 * 60 * 24 * 7
      const hasCachedArtistData =
        Boolean(Array.isArray(cached?.albums) && cached.albums.length) ||
        Boolean(Array.isArray(cached?.singles) && cached.singles.length) ||
        Boolean(Array.isArray(cached?.topSongs) && cached.topSongs.length)
      if (isCacheFresh && hasCachedArtistData) {
        return
      }

      artistCatalogPrefetchInFlightRef.current.add(cacheKey)
      try {
        const albumResult = window?.novaPlayer?.getYtMusicArtistAlbums
          ? await window.novaPlayer.getYtMusicArtistAlbums({ artistName })
          : { ok: false, albums: [], singles: [], topSongs: [] }
        if (!albumResult?.ok) {
          return
        }

        const mapReleaseList = (rows = []) => {
          const seen = new Set()
          return rows
            .map((release) => {
              const releaseId = String(release.id || '').trim()
              const releaseTitle = String(release.title || '').trim()
              if (!releaseId || !releaseTitle) {
                return null
              }
              const dedupeKey = `${releaseId}|||${normalizeCoverMatchText(releaseTitle)}`
              if (seen.has(dedupeKey)) {
                return null
              }
              seen.add(dedupeKey)
              return {
                key: normalizeCoverMatchText(releaseTitle || releaseId) || releaseId,
                id: releaseId,
                album: releaseTitle || 'Single',
                coverUrl: String(release.coverUrl || '').trim(),
                trackCount: Number(release.trackCount || release.count || 0) || 0,
              }
            })
            .filter(Boolean)
        }

        const topSongs = (Array.isArray(albumResult.topSongs) ? albumResult.topSongs : [])
          .filter((item) => String(item?.url || '').trim())
          .map((item) => ({
            id: String(item.id || item.url || ''),
            title: cleanFilenameTrackTitle(String(item.title || '').trim()),
            artist: String(item.artist || artistName || '').trim(),
            album: String(item.album || '').trim() || 'Single',
            duration: Number(item.duration || 0) || 0,
            url: String(item.url || '').trim(),
            coverUrl: String(item.thumbnail || '').trim(),
          }))

        const albums = mapReleaseList(Array.isArray(albumResult.albums) ? albumResult.albums : [])
        const singles = mapReleaseList(Array.isArray(albumResult.singles) ? albumResult.singles : [])
        artistProfileYtCacheRef.current[cacheKey] = {
          at: Date.now(),
          albums,
          singles,
          topSongs,
          selectedAlbumKey: albums[0]?.key || '',
          selectedSingleKey: albums[0]?.key ? '' : singles[0]?.key || '',
          releaseTracksByKey: cached?.releaseTracksByKey || {},
        }
        persistArtistProfileYtCache()
      } catch {
        // ignore prefetch errors
      } finally {
        artistCatalogPrefetchInFlightRef.current.delete(cacheKey)
      }
    },
    [persistArtistProfileYtCache],
  )

  const readYtmSearchCache = useCallback((query, filter = 'all') => {
    const cacheKey = `${String(filter || 'all').trim().toLowerCase()}|||${normalizeCoverMatchText(query)}`.trim()
    if (!cacheKey) {
      return null
    }
    const cached = getLruCacheValue(ytmSearchCacheRef.current, cacheKey)
    if (!cached || typeof cached !== 'object') {
      return null
    }
    const at = Number(cached.at || 0)
    if (!at || Date.now() - at > YTM_SEARCH_CACHE_TTL_MS) {
      return null
    }
    return Array.isArray(cached.items) ? cached.items : null
  }, [])

  const writeYtmSearchCache = useCallback((query, filter = 'all', items = []) => {
    const cacheKey = `${String(filter || 'all').trim().toLowerCase()}|||${normalizeCoverMatchText(query)}`.trim()
    if (!cacheKey) {
      return
    }
    setLruCacheValue(
      ytmSearchCacheRef.current,
      cacheKey,
      { at: Date.now(), items: Array.isArray(items) ? items : [] },
      MAX_YTM_SEARCH_CACHE_ENTRIES,
    )
    saveJsonCache(YTM_SEARCH_CACHE_KEY, ytmSearchCacheRef.current)
  }, [])

  const buildPredictedYtmResults = useCallback((query, filter = 'all', limit = 12) => {
    const normalizedQuery = normalizeCoverMatchText(query)
    if (!normalizedQuery || normalizedQuery.length < 2) {
      return []
    }

    const normalizedFilter = String(filter || 'all').trim().toLowerCase()
    const cacheEntries = Object.entries(ytmSearchCacheRef.current || {})
    const scored = []
    const seen = new Set()

    for (const [cacheKey, payload] of cacheEntries) {
      const [entryFilter = 'all'] = String(cacheKey || '').split('|||')
      if (normalizedFilter !== 'all' && entryFilter !== normalizedFilter) {
        continue
      }
      if (!payload || typeof payload !== 'object') {
        continue
      }
      const entryAt = Number(payload.at || 0)
      const items = Array.isArray(payload.items) ? payload.items : []
      for (const item of items) {
        const uniqueKey = String(item?.id || item?.url || '').trim()
        if (!uniqueKey || seen.has(uniqueKey)) {
          continue
        }
        const title = normalizeCoverMatchText(item?.title || '')
        const artist = normalizeCoverMatchText(item?.artist || '')
        const album = normalizeCoverMatchText(item?.album || '')
        const combined = `${title} ${artist} ${album}`.trim()
        if (!combined.includes(normalizedQuery)) {
          continue
        }
        let score = 0
        if (title.startsWith(normalizedQuery)) score += 140
        else if (title.includes(normalizedQuery)) score += 110
        if (artist.startsWith(normalizedQuery)) score += 75
        else if (artist.includes(normalizedQuery)) score += 55
        if (album && album.includes(normalizedQuery)) score += 22
        score += Math.min(18, Math.floor((Date.now() - entryAt) / -60000 + 18))
        seen.add(uniqueKey)
        scored.push({ item, score, at: entryAt })
      }
    }

    return scored
      .sort((a, b) => (b.score - a.score) || (b.at - a.at))
      .slice(0, Math.max(1, Number(limit) || 12))
      .map((entry) => entry.item)
  }, [])

  const readYtmAlbumTracksCache = useCallback((albumId) => {
    const key = String(albumId || '').trim().toLowerCase()
    if (!key) {
      return null
    }
    const cached = getLruCacheValue(ytmAlbumTracksCacheRef.current, key)
    if (!cached || typeof cached !== 'object') {
      return null
    }
    const at = Number(cached.at || 0)
    if (!at || Date.now() - at > YTM_ALBUM_TRACKS_CACHE_TTL_MS) {
      return null
    }
    return Array.isArray(cached.items) ? cached.items : null
  }, [])

  const writeYtmAlbumTracksCache = useCallback((albumId, items = []) => {
    const key = String(albumId || '').trim().toLowerCase()
    if (!key) {
      return
    }
    setLruCacheValue(
      ytmAlbumTracksCacheRef.current,
      key,
      { at: Date.now(), items: Array.isArray(items) ? items : [] },
      MAX_YTM_ALBUM_TRACKS_CACHE_ENTRIES,
    )
    saveJsonCache(YTM_ALBUM_TRACKS_CACHE_KEY, ytmAlbumTracksCacheRef.current)
  }, [])

  const resetAppCaches = useCallback(() => {
    artistFactsCacheRef.current = {}
    coverArtCacheRef.current = {}
    albumCacheRef.current = {}
    genreCacheRef.current = {}
    coverToneCacheRef.current = {}
    lyricsCacheRef.current = {}
    artistProfileYtCacheRef.current = {}
    ytmSearchCacheRef.current = {}
    ytmAlbumTracksCacheRef.current = {}
    albumInfoModalCacheRef.current = {}
    setArtistFacts(null)

    localStorage.removeItem(ARTIST_FACTS_KEY)
    localStorage.removeItem(COVER_ART_CACHE_KEY)
    localStorage.removeItem(ALBUM_CACHE_KEY)
    localStorage.removeItem(GENRE_CACHE_KEY)
    localStorage.removeItem(COVER_TONE_CACHE_KEY)
    localStorage.removeItem(LYRICS_CACHE_KEY)
    localStorage.removeItem(ARTIST_PROFILE_YT_CACHE_KEY)
    localStorage.removeItem(YTM_SEARCH_CACHE_KEY)
    localStorage.removeItem(YTM_ALBUM_TRACKS_CACHE_KEY)
    localStorage.removeItem(ALBUM_INFO_MODAL_CACHE_KEY)
    localStorage.removeItem(COVER_FILE_CACHE_KEY)

    showUploadNotice(t('resetCacheDone', 'Önbellek temizlendi.'))
  }, [showUploadNotice, t])

  const restoreLegacyData = useCallback(async () => {
    if (!window.novaPlayer?.restoreLegacyData) {
      showUploadNotice('Bu sürümde veri geri yükleme desteklenmiyor.')
      return
    }
    setRestoringLegacyData(true)
    try {
      const result = await window.novaPlayer.restoreLegacyData()
      if (result?.ok && result?.migrated) {
        showUploadNotice('Eski veri bulundu ve geri yüklendi. Uygulama yeniden başlatılıyor...')
        setTimeout(() => {
          window.novaPlayer?.restartApp?.()
        }, 500)
      } else if (result?.ok) {
        showUploadNotice('Geri yüklenecek eski veri bulunamadı.')
      } else {
        showUploadNotice(`Veri geri yüklenemedi: ${String(result?.reason || 'Bilinmeyen hata')}`)
      }
    } catch (error) {
      showUploadNotice(`Veri geri yükleme hatası: ${String(error?.message || error || 'Hata')}`)
    } finally {
      setRestoringLegacyData(false)
    }
  }, [showUploadNotice])

  const runFactoryReset = useCallback(async () => {
    if (!window.novaPlayer?.factoryResetData) {
      showUploadNotice('Bu sürümde fabrika sıfırlama desteklenmiyor.')
      return
    }
    try {
      try {
        localStorage.clear()
      } catch {
        // ignore
      }
      try {
        indexedDB.deleteDatabase(DB_NAME)
      } catch {
        // ignore
      }
      const result = await window.novaPlayer.factoryResetData()
      if (!result?.ok) {
        const detail = [
          `silinen: ${Number(result?.removedCount || 0)}`,
          `hata: ${Number(result?.failedCount || 0)}`,
        ].join(' • ')
        showUploadNotice(`Fabrika sıfırlama tamamlanamadı (${detail}).`)
      } else {
        const detail = `silinen: ${Number(result?.removedCount || 0)}`
        showUploadNotice(`Tüm veriler siliniyor, uygulama yeniden başlatılıyor... (${detail})`)
      }
    } catch (error) {
      showUploadNotice(`Fabrika sıfırlama hatası: ${String(error?.message || error || 'Hata')}`)
    }
  }, [showUploadNotice])

  const exportLibrary = async () => {
    if (!window.novaPlayer?.exportLibrary) {
      showUploadNotice('Bu sürümde dışa aktarma desteklenmiyor.')
      return
    }

    if (!allTracks.length) {
      showUploadNotice('Dışa aktarılacak şarkı bulunamadı.')
      return
    }

    setExportingLibrary(true)
    try {
      const payloadTracks = await Promise.all(
        allTracks.map(async (track) => {
          const audioBuffer = await toArrayBuffer(track.audioBlob, track.audioUrl)
          const coverSourceUrl = track.coverUrl || track.coverRemoteUrl || ''
          const coverBuffer = await toArrayBuffer(track.coverBlob, coverSourceUrl)

          return {
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album || 'Single',
            duration: track.duration || 0,
            source: track.source || 'local',
            audio:
              audioBuffer
                ? {
                    kind: 'buffer',
                    name: track.fileName || `${track.title || 'track'}.mp3`,
                    bytes: audioBuffer,
                  }
                : track.audioUrl
                  ? {
                      kind: 'url',
                      url: track.audioUrl,
                    }
                  : null,
            cover:
              coverBuffer
                ? {
                    kind: 'buffer',
                    name: track.coverName || `${track.title || 'cover'}.jpg`,
                    bytes: coverBuffer,
                  }
                : coverSourceUrl
                  ? {
                      kind: 'url',
                      url: coverSourceUrl,
                    }
                  : null,
          }
        }),
      )

      const result = await window.novaPlayer.exportLibrary({ tracks: payloadTracks })

      if (!result?.ok) {
        if (result?.reason !== 'cancelled') {
          showUploadNotice('Dışa aktarma tamamlanamadı.')
        }
        return
      }

      showUploadNotice(
        `${result.successCount}/${result.total} şarkı ve ${result.coverCount} kapak kaydedildi.`,
      )
    } catch {
      showUploadNotice('Dışa aktarırken bir hata oluştu.')
    } finally {
      setExportingLibrary(false)
    }
  }

  const isFileDragEvent = (event) => {
    const dataTransfer = event?.dataTransfer
    const types = dataTransfer?.types
    if (!types || !Array.from(types).includes('Files')) {
      return false
    }

    const items = Array.from(dataTransfer?.items || [])
      .filter((item) => item.kind === 'file')

    if (items.length) {
      return items.some((item) => item.type?.toLowerCase().startsWith('audio/'))
    }

    const files = Array.from(dataTransfer?.files || [])
    if (files.length) {
      return files.some((file) => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name || ''))
    }

    return false
  }

  useEffect(() => {
    const handleDragEnter = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current += 1
      setIsDragActive(true)
    }

    const handleDragOver = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
      if (dragCounterRef.current === 0) {
        setIsDragActive(false)
      }
    }

    const handleDrop = (event) => {
      if (!isFileDragEvent(event)) {
        return
      }

      event.preventDefault()
      dragCounterRef.current = 0
      setIsDragActive(false)
      addFilesToLibraryRef.current?.(event.dataTransfer?.files || [])
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  const openAddModal = () => {
    setAddMode('choose')
    setAddModalOpen(true)
    setLinkAddSuccessSignature('')
    setLinkDraft({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
    })
    setYoutubeSearchQuery('')
    setYoutubeSearchResults([])
    setYoutubeSearchRootResults([])
    setYoutubeSearchAlbumViewTitle('')
    setYoutubeSearchError('')
    setYoutubeSearchLoading(false)
  }

  const closeAddModal = () => {
    setAddModalOpen(false)
    setAddMode('choose')
    setLinkAddSuccessSignature('')
    setLinkDraft({
      title: '',
      artist: '',
      audioUrl: '',
      coverUrl: '',
    })
    setYoutubeSearchQuery('')
    setYoutubeSearchResults([])
    setYoutubeSearchRootResults([])
    setYoutubeSearchAlbumViewTitle('')
    setYoutubeSearchError('')
    setYoutubeSearchLoading(false)
  }

  const searchYouTube = (track) => {
    const query = encodeURIComponent(`${track.title} ${track.artist}`)
    window.novaPlayer?.openExternal?.(`https://www.youtube.com/results?search_query=${query}`)
  }

  useEffect(() => {
    if (!addModalOpen || addMode !== 'link') {
      return
    }
    const nextSignature = getLinkDraftSignature(linkDraft)
    if (linkAddSuccessSignature && nextSignature !== linkAddSuccessSignature) {
      setLinkAddSuccessSignature('')
    }
  }, [addModalOpen, addMode, linkDraft, linkAddSuccessSignature])

  const releaseTrackResources = (track) => {
    if (track.audioUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(track.audioUrl)
    }

    if (track.coverUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(track.coverUrl)
    }

    assetUrlsRef.current = assetUrlsRef.current.filter(
      (url) => url !== track.audioUrl && url !== track.coverUrl,
    )
  }

  useEffect(() => {
    if (!isHydrated || appBackgrounded) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      saveJson(LISTEN_HISTORY_KEY, listenHistoryRef.current)
    }, 2600)

    return () => window.clearTimeout(timeout)
  }, [appBackgrounded, isHydrated, listenHistory])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = toAudioGain(volume)
    }
  }, [volume])

  useEffect(() => {
    equalizerGainsRef.current = equalizerGains
  }, [equalizerGains])

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    const context = audioContextRef.current
    if (context?.state === 'suspended') {
      context.resume().catch(() => {})
    }

    return undefined
  }, [isPlaying])
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) {
      return undefined
    }

    let cancelled = false

    const ensureGraph = async () => {
      if (!audioContextRef.current) {
        const context = new AudioContextCtor()
        const source = context.createMediaElementSource(audio)
        const filters = equalizerBands.map((band, index) => {
          const filter = context.createBiquadFilter()
          filter.type = band.type
          filter.frequency.value = band.frequency
          filter.Q.value = band.q
          filter.gain.value = equalizerGainsRef.current[index] || 0
          return filter
        })
        const outputGain = context.createGain()
        const analyser = context.createAnalyser()
        analyser.fftSize = 512
        analyser.smoothingTimeConstant = 0.82
        outputGain.gain.value = 1

        source.connect(filters[0])
        filters.forEach((filter, index) => {
          if (filters[index + 1]) {
            filter.connect(filters[index + 1])
          } else {
            filter.connect(outputGain)
          }
        })
        outputGain.connect(analyser)
        audioContextRef.current = context
        audioSourceRef.current = source
        audioGainRef.current = outputGain
        audioAnalyserRef.current = analyser
        equalizerFiltersRef.current = filters
        applyAudioChannelMode(monoAudioEnabled)
      }

      if (!cancelled && audioContextRef.current?.state === 'suspended') {
        try {
          await audioContextRef.current.resume()
        } catch {
          // ignore resume failures
        }
      }
    }

    ensureGraph().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [applyAudioChannelMode, monoAudioEnabled])

  useEffect(() => {
    equalizerFiltersRef.current.forEach((filter, index) => {
      if (filter) {
        filter.gain.value = equalizerGainsRef.current[index] || 0
      }
    })
  }, [equalizerGains])

  useEffect(() => {
    applyAudioChannelMode(monoAudioEnabled)
  }, [applyAudioChannelMode, monoAudioEnabled])

  useEffect(() => {
    if (!fullscreenTrackOpen || !effectiveFullscreenEffectsEnabled || !isPlaying || appBackgrounded) {
      setFullscreenAudioLevel(0)
      if (fullscreenAudioRafRef.current) {
        window.cancelAnimationFrame(fullscreenAudioRafRef.current)
        fullscreenAudioRafRef.current = null
      }
      return undefined
    }

    const analyser = audioAnalyserRef.current
    if (!analyser) {
      return undefined
    }

    const data = new Uint8Array(analyser.fftSize)
    let smoothLevel = 0

    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let index = 0; index < data.length; index += 1) {
        const sample = (data[index] - 128) / 128
        sum += sample * sample
      }

      const rms = Math.sqrt(sum / data.length)
      const targetLevel = Math.min(1, rms * 6.8)
      smoothLevel = smoothLevel * 0.82 + targetLevel * 0.18
      setFullscreenAudioLevel((prev) => (Math.abs(prev - smoothLevel) > 0.008 ? smoothLevel : prev))
      fullscreenAudioRafRef.current = window.requestAnimationFrame(tick)
    }

    fullscreenAudioRafRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (fullscreenAudioRafRef.current) {
        window.cancelAnimationFrame(fullscreenAudioRafRef.current)
        fullscreenAudioRafRef.current = null
      }
    }
  }, [appBackgrounded, effectiveFullscreenEffectsEnabled, fullscreenTrackOpen, currentTrackId, isPlaying])

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return undefined
    }

    let cancelled = false
    const loadOutputs = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) {
          setAudioOutputs(devices.filter((device) => device.kind === 'audiooutput'))
        }
      } catch {
        if (!cancelled) {
          setAudioOutputs([])
        }
      }
    }

    loadOutputs()

    return () => {
      cancelled = true
    }
  }, [])

  const applyAudioOutputToPlayer = useCallback(
    async (deviceId, { silent = false } = {}) => {
      const audio = audioRef.current
      if (!audio || !canSelectAudioOutput || typeof audio.setSinkId !== 'function') {
        return false
      }

      const targetId = String(deviceId || 'default')
      if (
        audioOutputApplyRef.current.applying &&
        audioOutputApplyRef.current.deviceId === targetId
      ) {
        return true
      }

      audioOutputApplyRef.current = { deviceId: targetId, applying: true }
      try {
        await audio.setSinkId(targetId)
        audioOutputApplyRef.current = { deviceId: targetId, applying: false }
        return true
      } catch {
        audioOutputApplyRef.current = { deviceId: targetId, applying: false }
        if (!silent) {
          showUploadNotice('Ses çıkışı değiştirilemedi.')
        }
        return false
      }
    },
    [canSelectAudioOutput, showUploadNotice],
  )

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }
    applyAudioOutputToPlayer(selectedAudioOutputId, { silent: true })
    return undefined
  }, [applyAudioOutputToPlayer, isHydrated, selectedAudioOutputId, currentTrackId])

  useEffect(() => {
    favoriteTrackIdsRef.current = favoriteTrackIds
  }, [favoriteTrackIds])

  useEffect(() => {
    pinnedTrackIdsRef.current = pinnedTrackIds
  }, [pinnedTrackIds])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    playStatsRef.current = playStats
  }, [playStats])

  useEffect(() => {
    listenHistoryRef.current = listenHistory
  }, [listenHistory])

  useEffect(() => {
    queuedNextTrackIdsRef.current = queuedNextTrackIds
  }, [queuedNextTrackIds])

  useEffect(() => {
    shuffleOrderIdsRef.current = shuffleOrderIds
  }, [shuffleOrderIds])

  useEffect(() => {
    if (!shuffleEnabled) {
      if (shuffleOrderIdsRef.current.length) {
        applyShuffleOrderIds([])
      }
      return
    }

    const playbackIds = playbackTracks.map((track) => track.id)
    if (!playbackIds.length) {
      if (shuffleOrderIdsRef.current.length) {
        applyShuffleOrderIds([])
      }
      return
    }

    const playbackSet = new Set(playbackIds)
    const previousOrder = shuffleOrderIdsRef.current.filter((id) => playbackSet.has(id))
    const missingIds = playbackIds.filter((id) => !previousOrder.includes(id))

    if (!previousOrder.length) {
      const seeded = deterministicShuffleTracks(
        playbackTracks,
        `${playbackCollectionScopeId}|${shuffleSeedRef.current}|shuffle-order`,
      ).map((track) => track.id)
      applyShuffleOrderIds(seeded)
      return
    }

    if (!missingIds.length && previousOrder.length === playbackIds.length) {
      return
    }

    const missingTracks = playbackTracks.filter((track) => missingIds.includes(track.id))
    const appended = deterministicShuffleTracks(
      missingTracks,
      `${playbackCollectionScopeId}|${shuffleSeedRef.current}|shuffle-append`,
    ).map((track) => track.id)
    applyShuffleOrderIds([...previousOrder, ...appended])
  }, [playbackCollectionScopeId, playbackTracks, shuffleEnabled])

  useEffect(() => {
    persistStateRef.current = {
      selectedCollectionId,
      playbackCollectionId,
      currentTrackId,
      progress,
      volume,
      isPlaying,
      equalizerGains,
    }
  }, [currentTrackId, isPlaying, playbackCollectionId, progress, selectedCollectionId, volume, equalizerGains])

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
        try {
          const [storedTracksRaw, prefs, storedPlaylists] = await Promise.all([
            getStoredTracks(),
            Promise.resolve(loadUiPrefs()),
            Promise.resolve(loadJson(PLAYLISTS_KEY, [])),
        ])
        let storedTracks = Array.isArray(storedTracksRaw) ? storedTracksRaw : []
        if (window.novaPlayer?.resolveLocalTrackUrls) {
          const missingLocalUrlTracks = storedTracks
            .filter((record) =>
              String(record?.source || '') === 'local' &&
              !record?.audioBlob &&
              (
                !String(record?.audioUrl || '').trim() ||
                /^file:\/\//i.test(String(record?.audioUrl || '').trim())
              ) &&
              String(record?.fileName || '').trim(),
            )
            .map((record) => ({
              id: record.id,
              fileName: String(record.fileName || '').trim(),
              audioUrl: String(record.audioUrl || '').trim(),
            }))

          if (missingLocalUrlTracks.length) {
            try {
              const repaired = await window.novaPlayer.resolveLocalTrackUrls({
                tracks: missingLocalUrlTracks,
              })
              const resolvedMap =
                repaired?.ok && repaired?.resolved && typeof repaired.resolved === 'object'
                  ? repaired.resolved
                  : {}
              if (Object.keys(resolvedMap).length) {
                storedTracks = storedTracks.map((record) => {
                  const resolvedAudioUrl = String(resolvedMap[record?.id] || '').trim()
                  if (!resolvedAudioUrl) {
                    return record
                  }
                  return {
                    ...record,
                    audioUrl: resolvedAudioUrl,
                  }
                })
              }
            } catch {
              // keep existing records if resolver fails
            }
          }
        }

        // Katalog eksik/bozuksa library-audio ile karşılaştırıp eksikleri otomatik tamamla.
        if (window.novaPlayer?.listLocalLibraryFiles) {
          try {
            const scanResult = await window.novaPlayer.listLocalLibraryFiles()
            const scannedFiles = Array.isArray(scanResult?.files) ? scanResult.files : []
            if (scanResult?.ok && scannedFiles.length) {
              const existingByFileName = new Set(
                (Array.isArray(storedTracks) ? storedTracks : [])
                  .map((track) => String(track?.fileName || '').trim().toLowerCase())
                  .filter(Boolean),
              )
              const needsFullRebuild = !storedTracks.length
              const missingFiles = needsFullRebuild
                ? scannedFiles
                : scannedFiles.filter((file) => {
                    const key = String(file?.fileName || '').trim().toLowerCase()
                    return key && !existingByFileName.has(key)
                  })

              const baseOrder =
                Math.max(
                  -1,
                  ...(Array.isArray(storedTracks) ? storedTracks : []).map((track, index) =>
                    getTrackSortValue(track, index),
                  ),
                ) + 1

              const rebuiltTracks = missingFiles.map((file, index) => {
                const parsed = parseTrackName(String(file?.fileName || ''))
                const title = cleanFilenameTrackTitle(parsed.title || '') || 'Bilinmeyen parça'
                const artist = String(parsed.artist || 'Yerel Koleksiyon').trim() || 'Yerel Koleksiyon'
                const audioUrl = String(file?.audioUrl || '').trim()
                const sizeBytes = Number(file?.sizeBytes || 0)
                const sizeMb = sizeBytes > 0 ? `${(sizeBytes / 1024 / 1024).toFixed(1)} MB` : ''
                const createdAt = Number(file?.mtimeMs || Date.now()) || Date.now()
                return {
                  id: `recovered-${String(file?.fileName || title)}-${createdAt}-${index}`,
                  title,
                  artist,
                  album: 'Single',
                  genre: '',
                  fileName: String(file?.fileName || '').trim() || `${title}.mp3`,
                  size: sizeMb,
                  duration: 0,
                  gradient: gradients[index % gradients.length],
                  audioUrl,
                  coverBlob: null,
                  coverUrl: '',
                  coverRemoteUrl: '',
                  coverTone: '',
                  coverName: '',
                  isFavorite: false,
                  createdAt,
                  order: baseOrder + index,
                  source: 'local',
                  metadataLocked: true,
                }
              }).filter((track) => String(track.audioUrl || '').trim())

              if (rebuiltTracks.length || needsFullRebuild) {
                const mergedTracks = needsFullRebuild
                  ? rebuiltTracks
                  : [...storedTracks, ...rebuiltTracks]
                if (mergedTracks.length) {
                  await putStoredTracks(mergedTracks.map(serializeTrack))
                  storedTracks = mergedTracks
                }
                if (rebuiltTracks.length) {
                  showUploadNotice(`${rebuiltTracks.length} yerel şarkı geri yüklendi.`)
                }
              }
            }
          } catch {
            // sessiz fallback: mevcut akış devam eder
          }
        }
        if (cancelled) {
          return
        }

          const restoredTracks = storedTracks.map((record) => ({
            ...materializeTrack(record, assetUrlsRef),
            title: cleanFilenameTrackTitle(record.title || '') || record.title || 'Bilinmeyen parça',
            album: (record.album || '').trim() || 'Single',
            genre: normalizeGenreName(record.genre || ''),
            source: record.source || (record.audioBlob ? 'local' : 'link'),
          }))
          lastPersistedTracksSignatureRef.current = JSON.stringify(restoredTracks.map(serializeTrack))
          setTracks(
            applyPinnedFlags(
              applyFavoriteFlags(restoredTracks, favoriteTrackIdsRef.current),
              pinnedTrackIdsRef.current,
            ),
          )
        setPlaylists(
          storedPlaylists.map((playlist, index) => ({
            ...playlist,
            description: String(playlist.description || ''),
            color: playlist.color || playlistColors[index % playlistColors.length],
            coverUrl: playlist.coverUrl || '',
          })),
        )
        setSelectedCollectionId('home')
        setPlaybackCollectionId(
          prefs.playbackCollectionId === 'pool' ||
          prefs.playbackCollectionId === 'server' ||
          prefs.playbackCollectionId === 'home'
            ? 'all'
            : prefs.playbackCollectionId ||
              (prefs.selectedCollectionId === 'home' ? 'all' : prefs.selectedCollectionId) ||
              'all',
        )
        setLanguage(UI_LANGUAGES.includes(prefs.language) ? prefs.language : 'tr')
        setSharedManifestUrl(prefs.sharedManifestUrl || DEFAULT_SHARED_MANIFEST_URL)
        setPoolGithubOwner(String(prefs.poolGithubOwner || '').trim())
        setPoolGithubRepo(String(prefs.poolGithubRepo || '').trim())
        setPoolGithubBranch(String(prefs.poolGithubBranch || '').trim() || 'main')
        setPoolGithubPath(String(prefs.poolGithubPath || '').trim() || 'tracks.json')
        setPoolGithubToken(String(prefs.poolGithubToken || '').trim())
        const resolvedThemeMode = ['dark', 'gray', 'light', 'transparent', 'custom'].includes(prefs.themeMode)
          ? prefs.themeMode
          : 'dark'
        const defaultPalette = getDefaultBackgroundPalette(resolvedThemeMode)
        setThemeMode(resolvedThemeMode)
        setCustomThemeColor(normalizeHexColor(prefs.customThemeColor, '#3b82f6'))
        setBackgroundStyle(prefs.backgroundStyle === 'solid' ? 'solid' : 'gradient')
        setCoverBasedBackgroundEnabled(Boolean(prefs.coverBasedBackgroundEnabled))
        setBackgroundColor1(normalizeHexColor(prefs.backgroundColor1, defaultPalette.color1))
        setBackgroundColor2(normalizeHexColor(prefs.backgroundColor2, defaultPalette.color2))
        setCloseBehavior(prefs.closeBehavior || 'tray')
        setLaunchOnStartupEnabled(prefs.launchOnStartupEnabled === true)
        setHardwareAccelerationEnabled(prefs.hardwareAccelerationEnabled !== false)
        setPreventSleepWhilePlayingEnabled(prefs.preventSleepWhilePlayingEnabled !== false)
        setFullscreenEffectsEnabled(prefs.fullscreenEffectsEnabled !== false)
        setReduceAnimationsEnabled(Boolean(prefs.reduceAnimationsEnabled))
        setLowPowerModeEnabled(prefs.lowPowerModeEnabled !== false)
        setCompactListEnabled(Boolean(prefs.compactListEnabled))
        setShowScrollbars(Boolean(prefs.showScrollbars))
        setSpaceKeyPlaybackEnabled(prefs.spaceKeyPlaybackEnabled !== false)
        setArrowSeekEnabled(prefs.arrowSeekEnabled !== false)
        setResetShortcutEnabled(prefs.resetShortcutEnabled !== false)
        setSidebarPlayerExpanded(prefs.sidebarPlayerExpanded !== false)
        setSidebarPlayerSide(prefs.sidebarPlayerSide === 'left' ? 'left' : 'right')
        const restoredShuffleEnabled = Boolean(prefs.shuffleEnabled)
        const restoredRepeatEnabled = Boolean(prefs.repeatEnabled) && !restoredShuffleEnabled
        setShuffleEnabled(restoredShuffleEnabled)
        setRepeatEnabled(restoredRepeatEnabled)
        setCurrentTrackId(
          restoredTracks.find((track) => track.id === prefs.currentTrackId)?.id || restoredTracks[0]?.id || null,
        )
        setVolume(typeof prefs.volume === 'number' ? prefs.volume : 0.85)
        setMonoAudioEnabled(Boolean(prefs.monoAudioEnabled))
        setEqualizerGains(Array.isArray(prefs.equalizerGains) ? prefs.equalizerGains.slice(0, equalizerBands.length).map((value) => Number(value) || 0).concat(Array(Math.max(0, equalizerBands.length - (prefs.equalizerGains || []).length)).fill(0)).slice(0, equalizerBands.length) : Array(equalizerBands.length).fill(0))
        setProgress(typeof prefs.progress === 'number' ? prefs.progress : 0)
        // Always start paused on app launch, even if last session was playing.
        setIsPlaying(false)
        const hasSavedTrack = restoredTracks.some((track) => track.id === prefs.currentTrackId)
        restoreTrackIdRef.current = hasSavedTrack ? prefs.currentTrackId : null
        restoreSeekRef.current =
          hasSavedTrack && typeof prefs.progress === 'number' ? prefs.progress : 0
      } catch {
        if (!cancelled) {
          setTracks([])
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
      assetUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const baseUiPrefs = useMemo(
    () => ({
      selectedCollectionId,
      playbackCollectionId,
      language,
      sharedManifestUrl,
      poolGithubOwner,
      poolGithubRepo,
      poolGithubBranch,
      poolGithubPath,
      poolGithubToken,
      currentTrackId,
      volume,
      monoAudioEnabled,
      hardwareAccelerationEnabled,
      fullscreenEffectsEnabled,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
      isPlaying,
      equalizerGains,
      audioOutputId: selectedAudioOutputId,
      themeMode,
      customThemeColor,
      backgroundStyle,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      closeBehavior,
      launchOnStartupEnabled,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      resetShortcutEnabled,
      mediaToggleShortcut,
      sidebarPlayerExpanded,
      sidebarPlayerSide,
      shuffleEnabled,
      repeatEnabled,
      consoleAccessHash,
      consoleAccessSalt,
    }),
    [
      selectedCollectionId,
      playbackCollectionId,
      language,
      sharedManifestUrl,
      poolGithubOwner,
      poolGithubRepo,
      poolGithubBranch,
      poolGithubPath,
      poolGithubToken,
      currentTrackId,
      volume,
      monoAudioEnabled,
      hardwareAccelerationEnabled,
      fullscreenEffectsEnabled,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
      isPlaying,
      equalizerGains,
      selectedAudioOutputId,
      themeMode,
      customThemeColor,
      backgroundStyle,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      closeBehavior,
      launchOnStartupEnabled,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      resetShortcutEnabled,
      resetShortcut,
      mediaToggleShortcut,
      sidebarPlayerExpanded,
      sidebarPlayerSide,
      shuffleEnabled,
      repeatEnabled,
      consoleAccessHash,
      consoleAccessSalt,
    ],
  )

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const serializedTracks = tracks.map(serializeTrack)
    const trackSignature = JSON.stringify(serializedTracks)
    if (trackSignature === lastPersistedTracksSignatureRef.current) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      putStoredTracks(serializedTracks)
        .then(() => {
          lastPersistedTracksSignatureRef.current = trackSignature
        })
        .catch(() => {})
    }, 1800)

    return () => window.clearTimeout(timeout)
  }, [tracks, isHydrated])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    let cancelled = false
    const candidates = tracks.filter((track) => {
      const remoteUrl = getTrackPublicCoverUrl(track)
      if (!track?.id || !remoteUrl || track?.coverBlob) {
        return false
      }
      if (isLocalLikeAssetUrl(String(track?.coverUrl || '').trim())) {
        return false
      }
      if (coverLocalizeInFlightRef.current.has(track.id)) {
        return false
      }
      return true
    })

    if (!candidates.length) {
      return undefined
    }

    const runQueue = async () => {
      for (const track of candidates) {
        if (cancelled) break
        coverLocalizeInFlightRef.current.add(track.id)
        try {
          await persistTrackCoverLocally(track)
        } finally {
          coverLocalizeInFlightRef.current.delete(track.id)
        }
        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isHydrated, persistTrackCoverLocally, tracks])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    let cancelled = false
    const candidates = tracks
      .filter((track) => {
        if (!track?.id || !track?.title || !track?.artist) return false
        if (getTrackPublicCoverUrl(track)) return false
        if (coverRemoteBackfillInFlightRef.current.has(track.id)) return false
        return true
      })
      .slice(0, appBackgrounded ? 2 : 4)

    if (!candidates.length) {
      return undefined
    }

    const runQueue = async () => {
      for (const track of candidates) {
        if (cancelled) break
        coverRemoteBackfillInFlightRef.current.add(track.id)
        try {
          const cacheKey = `${normalizeArtistQuery(track.artist)}|${cleanFilenameTrackTitle(track.title) || track.title}`.toLowerCase()
          const cachedCover = String(getLruCacheValue(coverArtCacheRef.current, cacheKey) || '').trim()
          if (cachedCover && /^https:\/\//i.test(cachedCover)) {
            updateTrack(track.id, { coverRemoteUrl: cachedCover })
            continue
          }

          const remoteMeta = await fetchRemoteTrackMetaSmart(track.title, track.artist, {
            preferredAlbum: track.album || '',
            preferredDuration: Number(track.duration || 0),
          })
          const remoteCover = String(remoteMeta?.coverUrl || '').trim()
          if (cancelled || !/^https:\/\//i.test(remoteCover)) {
            continue
          }

          setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCover, MAX_COVER_CACHE_ENTRIES)
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
          updateTrack(track.id, { coverRemoteUrl: remoteCover })
        } catch {
          // Remote artwork backfill is best-effort and should never block playback.
        } finally {
          coverRemoteBackfillInFlightRef.current.delete(track.id)
        }
        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appBackgrounded, isHydrated, tracks])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const next = JSON.stringify(playlists)
    if (next === lastSavedPlaylistsRef.current) {
      return
    }

    lastSavedPlaylistsRef.current = next
    saveJson(PLAYLISTS_KEY, playlists)
  }, [isHydrated, playlists])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const next = JSON.stringify(favoriteTrackIds)
    if (next === lastSavedFavoritesRef.current) {
      return
    }

    lastSavedFavoritesRef.current = next
    saveJson(FAVORITES_KEY, favoriteTrackIds)
  }, [isHydrated, favoriteTrackIds])

  useEffect(() => {
    if (!isHydrated) return
    saveJson('nova-player-spotify-auth-status', spotifyAuthStatus)
  }, [isHydrated, spotifyAuthStatus])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    const next = JSON.stringify(pinnedTrackIds)
    if (next === lastSavedPinnedRef.current) {
      return
    }

    lastSavedPinnedRef.current = next
    saveJson(PINNED_TRACKS_KEY, pinnedTrackIds)
  }, [isHydrated, pinnedTrackIds])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      const serializedPrefs = JSON.stringify(baseUiPrefs)
      if (serializedPrefs === lastSavedUiPrefsRef.current) {
        return
      }

      lastSavedUiPrefsRef.current = serializedPrefs
      saveUiPrefs(baseUiPrefs)
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [baseUiPrefs, isHydrated])

  useEffect(() => {
    monthlyRecapOpenRef.current = monthlyRecapOpen
  }, [monthlyRecapOpen])

  useEffect(() => {
    if (!isHydrated || !currentTrackId || !isPlaying || monthlyRecapOpen) {
      return undefined
    }

    const interval = window.setInterval(() => {
      const snapshot = persistStateRef.current
      const nextPrefs = {
        selectedCollectionId: snapshot.selectedCollectionId,
        playbackCollectionId: snapshot.playbackCollectionId,
        language,
        sharedManifestUrl,
        poolGithubOwner,
        poolGithubRepo,
        poolGithubBranch,
        poolGithubPath,
        poolGithubToken,
        currentTrackId: snapshot.currentTrackId,
        progress: snapshot.progress,
        volume: snapshot.volume,
        monoAudioEnabled,
        hardwareAccelerationEnabled,
        fullscreenEffectsEnabled,
        reduceAnimationsEnabled,
        lowPowerModeEnabled,
        compactListEnabled,
        showScrollbars,
        isPlaying: snapshot.isPlaying,
        equalizerGains: snapshot.equalizerGains,
        audioOutputId: selectedAudioOutputId,
        themeMode,
        customThemeColor,
        backgroundStyle,
        coverBasedBackgroundEnabled,
        backgroundColor1,
        backgroundColor2,
        closeBehavior,
        launchOnStartupEnabled,
        spaceKeyPlaybackEnabled,
        arrowSeekEnabled,
        resetShortcutEnabled,
        mediaToggleShortcut,
        sidebarPlayerExpanded,
        sidebarPlayerSide,
        shuffleEnabled,
        repeatEnabled,
        consoleAccessHash,
        consoleAccessSalt,
      }
      const serializedPrefs = JSON.stringify(nextPrefs)
      if (serializedPrefs === lastSavedUiPrefsRef.current) {
        return
      }
      lastSavedUiPrefsRef.current = serializedPrefs
      saveUiPrefs(nextPrefs)
    }, appBackgrounded ? (isLowCoreDevice ? 360000 : 240000) : (runtimeLowPowerEnabled ? (isLowCoreDevice ? 60000 : 45000) : 20000))

    return () => window.clearInterval(interval)
  }, [
    appBackgrounded,
    closeBehavior,
    launchOnStartupEnabled,
    currentTrackId,
    isHydrated,
    isPlaying,
    monoAudioEnabled,
    hardwareAccelerationEnabled,
    fullscreenEffectsEnabled,
    reduceAnimationsEnabled,
    lowPowerModeEnabled,
    compactListEnabled,
    showScrollbars,
    arrowSeekEnabled,
    repeatEnabled,
    mediaToggleShortcut,
    selectedAudioOutputId,
    spaceKeyPlaybackEnabled,
    resetShortcutEnabled,
    sidebarPlayerExpanded,
    sidebarPlayerSide,
    backgroundStyle,
    coverBasedBackgroundEnabled,
    backgroundColor1,
    backgroundColor2,
    language,
    sharedManifestUrl,
    poolGithubOwner,
    poolGithubRepo,
    poolGithubBranch,
    poolGithubPath,
    poolGithubToken,
    consoleAccessHash,
    consoleAccessSalt,
    shuffleEnabled,
    themeMode,
    customThemeColor,
    runtimeLowPowerEnabled,
    isLowCoreDevice,
  ])

  useEffect(() => {
    if (!isHydrated || !currentTrackId || !isPlaying) {
      return undefined
    }

    let lastTickAt = Date.now()
    const tickInterval = appBackgrounded
      ? (isLowCoreDevice ? 90000 : 60000)
      : (runtimeLowPowerEnabled ? (isLowCoreDevice ? 2800 : 2000) : 1200)
    const interval = window.setInterval(() => {
      if (monthlyRecapOpenRef.current) {
        return
      }
      const now = Date.now()
      const elapsedSeconds = Math.max(1, Math.floor((now - lastTickAt) / 1000))
      lastTickAt = now
      const monthKey = new Date(now).toISOString().slice(0, 7)

      setPlayStats((prev) => {
        const previousTrackSeconds = Number(prev.trackSeconds?.[currentTrackId] || 0)
        const previousPlayCount = Number(prev.trackPlayCount?.[currentTrackId] || 0)
        const previousMonthlyTrackSeconds = Number(prev.monthlyTrackSeconds?.[monthKey]?.[currentTrackId] || 0)
        const trackSeconds = {
          ...(prev.trackSeconds || {}),
          [currentTrackId]: previousTrackSeconds + elapsedSeconds,
        }
        const trackPlayCount = {
          ...(prev.trackPlayCount || {}),
          [currentTrackId]: previousPlayCount > 0 ? previousPlayCount : 1,
        }
        const monthlyTrackSeconds = {
          ...(prev.monthlyTrackSeconds || {}),
          [monthKey]: {
            ...(prev.monthlyTrackSeconds?.[monthKey] || {}),
            [currentTrackId]: previousMonthlyTrackSeconds + elapsedSeconds,
          },
        }
        return {
          totalSeconds: Number(prev.totalSeconds || 0) + elapsedSeconds,
          trackSeconds,
          trackPlayCount,
          monthlyTrackSeconds,
        }
      })

    }, tickInterval)

    return () => window.clearInterval(interval)
  }, [appBackgrounded, currentTrackId, isHydrated, isPlaying, monthlyRecapOpen, runtimeLowPowerEnabled, isLowCoreDevice])

  useEffect(() => {
    if (!isHydrated || !isPlaying || !currentTrackId || monthlyRecapOpen) return
    const now = Date.now()
    const last = listenStartLockRef.current
    if (last.trackId === currentTrackId && now - last.at < 6000) return
    listenStartLockRef.current = { trackId: currentTrackId, at: now }

    const track = currentTrack
    setListenHistory((prev) => {
      const next = [
        {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          trackId: currentTrackId,
          title: String(track?.title || 'Bilinmeyen şarkı'),
          at: now,
        },
        ...(Array.isArray(prev) ? prev : []),
      ]
      return next.slice(0, 800)
    })
  }, [currentTrack, currentTrackId, isHydrated, isPlaying, monthlyRecapOpen])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      saveJson(PLAY_STATS_KEY, playStatsRef.current)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [isHydrated, playStats])

  useEffect(() => {
    if (!monthlyRecapOpen) {
      setMonthlyRecapStep(0)
      const snapshot = monthlyRecapPlaybackSnapshotRef.current
      if (snapshot?.active) {
        const previousTrack = allTracks.find((track) => track.id === snapshot.trackId)
        if (previousTrack) {
          switchTrackRef.current?.(previousTrack, Boolean(snapshot.wasPlaying), {
            withFade: false,
            restartIfSame: true,
            enforceCooldown: false,
          })
          window.setTimeout(() => {
            const audio = audioRef.current
            if (!audio) return
            try {
              if (Number.isFinite(snapshot.progress) && snapshot.progress >= 0) {
                audio.currentTime = snapshot.progress
              }
              if (snapshot.wasPlaying) {
                const playPromise = audio.play?.()
                if (playPromise?.catch) playPromise.catch(() => {})
                setIsPlaying(true)
              } else {
                audio.pause?.()
                setIsPlaying(false)
              }
            } catch {
              // ignore restore errors
            }
          }, 160)
        }
      }
      monthlyRecapPlaybackSnapshotRef.current = null
      setMonthlyRecapSnapshot(null)
      return
    }

    if (!monthlyRecapPlaybackSnapshotRef.current?.active) {
      monthlyRecapPlaybackSnapshotRef.current = {
        active: true,
        trackId: currentTrackId || null,
        progress: Number(progress || 0),
        wasPlaying: Boolean(isPlayingRef.current),
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause?.()
        } catch {
          // ignore
        }
      }
      setIsPlaying(false)
    }
  }, [allTracks, currentTrackId, monthlyRecapOpen, progress])

  useEffect(() => {
    if (!monthlyRecapOpen || !monthlyRecapSnapshot) {
      setMonthlyRecapDelayedMessage('')
      return
    }

    setMonthlyRecapDelayedMessage('')
    const timeoutId = window.setTimeout(() => {
      if (monthlyRecapStep === 0) {
        const totalHours = Number(monthlyRecapSnapshot.totalSeconds || 0) / 3600
        setMonthlyRecapDelayedMessage(totalHours >= 6 ? 'Bu harika bir sayı!' : 'Harika gidiyorsun, ritmi koru!')
        return
      }
      if (monthlyRecapStep === 1) {
        setMonthlyRecapDelayedMessage('Bu parça ay boyunca gerçekten seninleydi.')
        return
      }
      if (monthlyRecapStep === 2) {
        setMonthlyRecapDelayedMessage('Sanatçı tercihin çok net, güzel bir zevk!')
        return
      }
      setMonthlyRecapDelayedMessage('Özet tamam! İstersen bu listeyi hemen çalmaya başlayalım.')
    }, 1300)

    return () => window.clearTimeout(timeoutId)
  }, [monthlyRecapOpen, monthlyRecapSnapshot, monthlyRecapStep])

  useEffect(() => {
    if (!monthlyRecapOpen || !monthlyRecapSnapshot?.topTracks?.length) {
      return
    }
    const preview = monthlyRecapSnapshot.topTracks[Math.min(monthlyRecapStep, monthlyRecapSnapshot.topTracks.length - 1)]
    if (!preview?.track) {
      return
    }
    switchTrackRef.current?.(preview.track, true, {
      withFade: false,
      restartIfSame: true,
      enforceCooldown: false,
    })
  }, [monthlyRecapOpen, monthlyRecapSnapshot, monthlyRecapStep])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    const handleTimeUpdate = () => {
      if (currentTrackId !== persistStateRef.current.currentTrackId) {
        return
      }
      if (isPlayingRef.current) {
        return
      }

      const currentTime = audio.currentTime
      setProgress(currentTime)
    }
    const handleLoadedMetadata = () => {
      const nextDuration = audio.duration || 0
      setDuration(nextDuration)

      if (currentTrack?.id && Number.isFinite(nextDuration) && nextDuration > 0) {
        const roundedDuration = Number(nextDuration.toFixed(2))
        if (Math.abs(Number(currentTrack.duration || 0) - roundedDuration) > 0.25) {
          updateTrack(currentTrack.id, { duration: roundedDuration })
        }
      }

      if (restoreTrackIdRef.current && currentTrack?.id === restoreTrackIdRef.current) {
        const nextTime = Math.min(restoreSeekRef.current || 0, nextDuration || 0)
        if (Number.isFinite(nextTime) && nextTime >= 0) {
          audio.currentTime = nextTime
          setProgress(nextTime)
        }

        restoreTrackIdRef.current = null
        restoreSeekRef.current = null
      }

      if (isPlayingRef.current) {
        audio.play().catch(() => {})
      }
    }
    const handleEnded = () => {
      if (currentTrackId !== persistStateRef.current.currentTrackId) {
        return
      }

      if (!currentTrack) {
        setIsPlaying(false)
        return
      }

      if (monthlyRecapOpenRef.current) {
        audio.currentTime = 0
        setProgress(0)
        setDuration(currentTrack.duration || 0)
        restoreSeekRef.current = 0
        const playPromise = audio.play?.()
        if (playPromise?.catch) {
          playPromise.catch(() => {})
        }
        setIsPlaying(true)
        return
      }

      if (repeatEnabled) {
        audio.currentTime = 0
        setProgress(0)
        setDuration(currentTrack.duration || 0)
        restoreSeekRef.current = 0
        audio.play().catch(() => {})
        setIsPlaying(true)
        return
      }

      const nextTrack = getNextTrack({ consumeQueue: true })
      if (!nextTrack) {
        setIsPlaying(false)
        return
      }

      switchTrackRef.current?.(nextTrack, true)
    }

    const handleError = () => {
      setIsPlaying(false)
      if (currentTrack?.source === 'link') {
      showUploadNotice('Bu link oynatılamadı. Drive için doğrudan medya veya indirilebilir dosya bağlantısı gerekir.')
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [
    currentTrack,
    currentTrackId,
    getNextTrack,
    monthlyRecapOpen,
    repeatEnabled,
  ])

  useEffect(() => {
    if (!isPlaying || !currentTrackId) {
      return undefined
    }

    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    // requestAnimationFrame yerine interval kullanarak CPU yükünü düşür.
    const paintInterval = appBackgrounded
      ? 30000
      : isHugeTrackList
        ? (runtimeLowPowerEnabled ? (isLowCoreDevice ? 1600 : 1200) : 820)
        : (runtimeLowPowerEnabled ? (isLowCoreDevice ? 620 : 420) : 240)

    const timerId = window.setInterval(() => {
      if (audio.paused || audio.ended || currentTrackId !== persistStateRef.current.currentTrackId) {
        return
      }
      const nextTime = audio.currentTime || 0
      if (appBackgrounded) {
        persistStateRef.current.progress = nextTime
        return
      }
      setProgress((prev) => (Math.abs(prev - nextTime) >= 0.12 ? nextTime : prev))
    }, paintInterval)

    return () => {
      window.clearInterval(timerId)
    }
  }, [appBackgrounded, currentTrackId, isHugeTrackList, isPlaying, runtimeLowPowerEnabled, isLowCoreDevice])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return undefined
    }

    if (!currentTrack) {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      loadedAudioStateRef.current = { trackId: null, audioUrl: '' }
      return undefined
    }

    const nextTrackId = String(currentTrack.id || '')
    const nextAudioUrl = String(currentTrack.audioUrl || '').trim()
    if (!nextAudioUrl) {
      return undefined
    }

    const prevLoaded = loadedAudioStateRef.current
    const sameTrack = prevLoaded.trackId === nextTrackId
    const sameUrl = prevLoaded.audioUrl === nextAudioUrl
    if (!sameTrack || !sameUrl) {
      audio.src = nextAudioUrl
      audio.load()
      loadedAudioStateRef.current = { trackId: nextTrackId, audioUrl: nextAudioUrl }
    }

    return undefined
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return undefined
    }

    if (isPlaying) {
      const shouldFadeIn = Date.now() < trackSwitchFadeUntilRef.current
      const targetGain = toAudioGain(volume)
      if (shouldFadeIn) {
        audio.volume = Math.max(0, Math.min(1, targetGain * 0.2))
      } else {
        audio.volume = targetGain
      }
      audio.play().then(() => {
        if (shouldFadeIn) {
          window.setTimeout(() => {
            if (audioRef.current === audio) {
              audio.volume = targetGain
            }
          }, TRACK_SWITCH_FADE_MS)
        }
      }).catch(() => {
        setIsPlaying(false)
        if (currentTrack?.source === 'link') {
          showUploadNotice('Bu link oynatılamadı. Drive için doğrudan medya veya indirilebilir dosya bağlantısı gerekir.')
        }
      })
    } else {
      audio.pause()
    }

    return undefined
  }, [currentTrack, isPlaying, volume, showUploadNotice])

  useEffect(() => {
    if (!window.novaPlayer?.setPresence) {
      return undefined
    }

    if (!currentTrackPresenceId) {
      window.novaPlayer.setPresence({ track: null })
      return undefined
    }

    window.novaPlayer.setPresence({
      track: {
        title: currentTrackPresenceTitle,
        artist: currentTrackPresenceArtist,
        duration: duration,
        collection: activeCollectionLabel,
        album: currentTrack?.album || '',
        coverUrl: getTrackDiscordCoverUrl(currentTrack),
        audioUrl: currentTrack?.audioUrl || '',
      },
      isPlaying,
      progress: progressBucket * presenceProgressStepSeconds,
      startTimestamp: Date.now() - progressBucket * presenceProgressStepSeconds * 1000,
    })

    return undefined
  }, [currentTrackPresenceId, currentTrackPresenceTitle, currentTrackPresenceArtist, isPlaying, progressBucket, presenceProgressStepSeconds, duration, activeCollectionLabel, currentTrack])

  const refreshPoolTracksNow = useCallback(async ({ silent = false } = {}) => {
    const remoteSources = [
      { url: DRIVE_MANIFEST_URL, tag: 'drive' },
      { url: sharedManifestUrl, tag: 'shared' },
    ].filter((item) => String(item.url || '').trim())

    if (!remoteSources.length) {
      setServerTracks([])
      return
    }

    setPoolRefreshing(true)
    try {
      const collected = []
      const seenIds = new Set()

      for (const source of remoteSources) {
        try {
          const remote = window?.novaPlayer?.fetchRemoteJson
            ? await window.novaPlayer.fetchRemoteJson({ url: source.url })
            : null
          const json = remote?.ok ? remote.json : null
          if (!json) {
            continue
          }
          const trackList = Array.isArray(json)
            ? json
            : Array.isArray(json?.tracks)
              ? json.tracks
              : Array.isArray(json?.items)
                ? json.items
                : []

          for (const rawTrack of trackList) {
            const normalizedTrack = normalizeDriveTrack(rawTrack, source.tag, source.url)
            if (!normalizedTrack?.id || seenIds.has(normalizedTrack.id)) {
              continue
            }
            seenIds.add(normalizedTrack.id)
            collected.push(normalizedTrack)
          }
        } catch {
          // ignore this source and continue with others
        }
      }

      const previousById = new Map(serverTracks.map((track) => [track.id, track]))
      const merged = collected.map((track) => {
        const previous = previousById.get(track.id)
        if (!previous) {
          return track
        }

        const next = { ...track }
        const prevArtist = String(previous.artist || '').trim()
        const prevAlbum = String(previous.album || '').trim()
        const prevCover = String(previous.coverRemoteUrl || previous.coverUrl || '').trim()

        if ((!next.artist || next.artist === 'Yerel Koleksiyon') && prevArtist && prevArtist !== 'Yerel Koleksiyon') {
          next.artist = prevArtist
        }
        if (
          (!next.album || String(next.album).trim().toLowerCase() === 'single') &&
          prevAlbum &&
          prevAlbum.toLowerCase() !== 'single'
        ) {
          next.album = prevAlbum
        }
        if (!String(next.coverRemoteUrl || next.coverUrl || '').trim() && prevCover) {
          next.coverRemoteUrl = prevCover
          next.coverUrl = next.coverUrl || prevCover
        }
        if ((!next.duration || next.duration <= 0) && Number(previous.duration || 0) > 0) {
          next.duration = previous.duration
        }
        if (!next.coverTone && previous.coverTone) {
          next.coverTone = previous.coverTone
        }

        return next
      })

      setServerTracks(
        applyPinnedFlags(applyFavoriteFlags(merged, favoriteTrackIds), pinnedTrackIdsRef.current),
      )
      const nextIdSet = new Set(merged.map((track) => track.id))
      // Allow fresh metadata retries after each pool refresh.
      serverMetaAttemptedAtRef.current = {}
      serverMetaInFlightRef.current = new Set()
      if (!silent) {
        showUploadNotice('Müzik havuzu yenilendi.')
      }
    } catch {
      if (!silent) {
        showUploadNotice('Müzik havuzu yenilenemedi.')
      }
    } finally {
      setPoolRefreshing(false)
    }
  }, [favoriteTrackIds, serverTracks, sharedManifestUrl, showUploadNotice])

  useEffect(() => {
    if (!isHydrated || initialPoolRefreshDoneRef.current) {
      return
    }
    initialPoolRefreshDoneRef.current = true
    refreshPoolTracksNow({ silent: true })
  }, [isHydrated, refreshPoolTracksNow])

  useEffect(() => {
    setServerTracks((prev) =>
      applyPinnedFlags(applyFavoriteFlags(prev, favoriteTrackIds), pinnedTrackIdsRef.current),
    )
  }, [favoriteTrackIds])

  useEffect(() => {
    setTracks((prev) => applyPinnedFlags(prev, pinnedTrackIds))
    setServerTracks((prev) => applyPinnedFlags(prev, pinnedTrackIds))
  }, [pinnedTrackIds])

  useEffect(() => {
    if (!isHydrated) {
      return
    }
    if (!allTracks.length) {
      return
    }
    const allIds = new Set(allTracks.map((track) => track.id))
    setPinnedTrackIds((prev) => {
      const filtered = prev.filter((id) => allIds.has(id))
      return filtered.length === prev.length ? prev : filtered
    })
  }, [allTracks, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    const validTrackIds = new Set(allTracks.map((track) => track.id))

    setPlayStats((prev) => {
      const nextTrackSeconds = Object.fromEntries(
        Object.entries(prev?.trackSeconds || {}).filter(([trackId]) => validTrackIds.has(trackId)),
      )
      const nextTrackPlayCount = Object.fromEntries(
        Object.entries(prev?.trackPlayCount || {}).filter(([trackId]) => validTrackIds.has(trackId)),
      )
      const nextMonthly = Object.fromEntries(
        Object.entries(prev?.monthlyTrackSeconds || {}).map(([monthKey, monthMap]) => [
          monthKey,
          Object.fromEntries(
            Object.entries(monthMap || {}).filter(([trackId]) => validTrackIds.has(trackId)),
          ),
        ]),
      )

      const unchanged =
        JSON.stringify(nextTrackSeconds) === JSON.stringify(prev?.trackSeconds || {}) &&
        JSON.stringify(nextTrackPlayCount) === JSON.stringify(prev?.trackPlayCount || {}) &&
        JSON.stringify(nextMonthly) === JSON.stringify(prev?.monthlyTrackSeconds || {})

      if (unchanged) return prev
      return {
        ...prev,
        trackSeconds: nextTrackSeconds,
        trackPlayCount: nextTrackPlayCount,
        monthlyTrackSeconds: nextMonthly,
      }
    })

    setListenHistory((prev) =>
      (Array.isArray(prev) ? prev : []).filter((item) => validTrackIds.has(item?.trackId)),
    )
  }, [allTracks, isHydrated])

  useEffect(() => {
    if (!serverTracks.length) {
      return undefined
    }

    let cancelled = false
    const now = Date.now()
    const ATTEMPT_COOLDOWN_MS = 2 * 60 * 1000
    const MAX_PARALLEL = appBackgrounded ? 1 : 2
    const candidates = serverTracks.filter((track) => {
      const missingArtist = !String(track.artist || '').trim() || track.artist === 'Yerel Koleksiyon'
      const missingAlbum =
        !String(track.album || '').trim() || String(track.album || '').trim().toLowerCase() === 'single'
      const missingCover = !String(track.coverUrl || track.coverRemoteUrl || '').trim()
      if (!(missingArtist || missingAlbum || missingCover)) {
        return false
      }

      if (serverMetaInFlightRef.current.has(track.id)) {
        return false
      }

      const lastAttemptAt = Number(serverMetaAttemptedAtRef.current[track.id] || 0)
      if (lastAttemptAt && now - lastAttemptAt < ATTEMPT_COOLDOWN_MS) {
        return false
      }

      return true
    })

    if (!candidates.length) {
      return undefined
    }

    const enrichTrack = async (track) => {
      serverMetaInFlightRef.current.add(track.id)
      serverMetaAttemptedAtRef.current[track.id] = Date.now()
      try {
        let nextTitle = cleanFilenameTrackTitle(String(track.title || '').trim())
        let nextArtist = String(track.artist || '').trim()
        let nextAlbum = String(track.album || '').trim()
        let nextCover = String(track.coverRemoteUrl || track.coverUrl || '').trim()
        let inferredIdentity = null

        if ((!nextArtist || nextArtist === 'Yerel Koleksiyon') && nextTitle) {
          try {
            inferredIdentity = await inferTrackIdentityFromTitle(nextTitle)
            if (inferredIdentity?.artist) {
              nextArtist = inferredIdentity.artist
            }
            if (inferredIdentity?.title) {
              nextTitle = cleanFilenameTrackTitle(inferredIdentity.title) || nextTitle
            }
            if (!nextAlbum && inferredIdentity?.album) {
              nextAlbum = inferredIdentity.album
            }
            if (!nextCover && inferredIdentity?.coverUrl) {
              nextCover = inferredIdentity.coverUrl
            }
          } catch {
            inferredIdentity = null
          }
        }

        if (nextTitle && nextArtist && nextArtist !== 'Yerel Koleksiyon') {
          let cacheKey = `${normalizeArtistQuery(nextArtist)}|${nextTitle}`.toLowerCase()
          const cachedCover = String(getLruCacheValue(coverArtCacheRef.current, cacheKey) || '').trim()
          const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()

          if (!nextCover && cachedCover) {
            nextCover = cachedCover
          }
          if ((!nextAlbum || nextAlbum.toLowerCase() === 'single') && cachedAlbum) {
            nextAlbum = cachedAlbum
          }

          if (!nextCover || !nextAlbum || nextAlbum.toLowerCase() === 'single') {
            try {
              const remoteMeta = await fetchRemoteTrackMetaSmart(nextTitle, nextArtist, {
                preferredAlbum: nextAlbum || inferredIdentity?.album || '',
                preferredDuration: Number(track.duration || 0),
              })
              if (remoteMeta?.swapped) {
                const swappedTitle = cleanFilenameTrackTitle(nextArtist) || nextTitle
                const swappedArtist = sanitizeDisplayText(nextTitle) || nextArtist
                nextTitle = swappedTitle
                nextArtist = swappedArtist
                cacheKey = `${normalizeArtistQuery(nextArtist)}|${nextTitle}`.toLowerCase()
              }
              let resolvedCover = remoteMeta?.coverUrl || ''
              let resolvedAlbum = String(remoteMeta?.album || '').trim()
              if (!resolvedCover || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') {
                try {
                  const fallbackIdentity = await inferTrackIdentityFromTitle(nextTitle)
                  const fallbackArtistMatches = areArtistsCompatible(
                    nextArtist,
                    String(fallbackIdentity?.artist || ''),
                  )
                  if (fallbackArtistMatches) {
                    if (!resolvedCover && fallbackIdentity?.coverUrl) {
                      resolvedCover = fallbackIdentity.coverUrl
                    }
                    if (
                      (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                      fallbackIdentity?.album
                    ) {
                      resolvedAlbum = String(fallbackIdentity.album).trim()
                    }
                  }
                } catch {
                  // ignore fallback lookup errors
                }
              }
              if (resolvedCover) {
                nextCover = nextCover || resolvedCover
              }
              if (resolvedAlbum) {
                nextAlbum = resolvedAlbum
              }
              if (!nextCover && nextArtist) {
                const insightFallback = await fillCoverFromAlbumInsight({
                  title: nextTitle,
                  artist: nextArtist,
                  album: nextAlbum,
                  coverUrl: nextCover,
                })
                if (insightFallback.coverUrl) {
                  nextCover = insightFallback.coverUrl
                }
                if ((!nextAlbum || nextAlbum.toLowerCase() === 'single') && insightFallback.album) {
                  nextAlbum = insightFallback.album
                }
              }
              setLruCacheValue(coverArtCacheRef.current, cacheKey, nextCover || '', MAX_COVER_CACHE_ENTRIES)
              setLruCacheValue(albumCacheRef.current, cacheKey, nextAlbum || '', MAX_ALBUM_CACHE_ENTRIES)
            } catch {
              // ignore
            }
          }
        }

        const updates = {}
        if (nextTitle && nextTitle !== track.title) {
          updates.title = nextTitle
        }
        if (nextArtist && nextArtist !== track.artist) {
          updates.artist = nextArtist
        }
        if (nextAlbum && nextAlbum !== track.album) {
          updates.album = nextAlbum
        }
        if (nextCover) {
          if (nextCover !== track.coverRemoteUrl) {
            updates.coverRemoteUrl = nextCover
          }
          if (!track.coverUrl) {
            updates.coverUrl = nextCover
          }
        }

        return Object.keys(updates).length ? { id: track.id, updates } : null
      } finally {
        serverMetaInFlightRef.current.delete(track.id)
      }
    }

    const runQueue = async () => {
      const pending = [...candidates]
      const allUpdates = []

      while (pending.length && !cancelled) {
        const chunk = pending.splice(0, MAX_PARALLEL)
        const results = await Promise.all(chunk.map((track) => enrichTrack(track)))
        results.forEach((result) => {
          if (result) {
            allUpdates.push(result)
          }
        })
      }

      if (cancelled) {
        return
      }

      if (allUpdates.length) {
        const updatesById = new Map(allUpdates.map((item) => [item.id, item.updates]))
        setServerTracks((prev) =>
          prev.map((item) => {
            const updates = updatesById.get(item.id)
            return updates ? { ...item, ...updates } : item
          }),
        )
      }

      saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
      saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appBackgrounded, serverTracks])

  useEffect(() => {
    const artistCandidates = extractArtistCandidates(currentTrack?.artist || '')
    if (!artistCandidates.length) {
      setArtistFacts(null)
      setArtistFactsLoading(false)
      return undefined
    }

    setArtistFacts(null)
    const cachedFacts = artistCandidates
      .map((name) => getLruCacheValue(artistFactsCacheRef.current, name))
      .find((facts) => Boolean(facts))
    if (cachedFacts) {
      setArtistFacts(cachedFacts)
      setArtistFactsLoading(false)
      return undefined
    }

    let cancelled = false
    setArtistFactsLoading(true)

    const loadArtistFacts = async () => {
      try {
        let facts = null
        for (const artistName of artistCandidates) {
          if (cancelled) {
            return
          }

          const cached = getLruCacheValue(artistFactsCacheRef.current, artistName)
          if (cached) {
            facts = cached
            break
          }

          const fetched = await fetchArtistFacts(artistName)
          setLruCacheValue(artistFactsCacheRef.current, artistName, fetched, MAX_ARTIST_FACTS_CACHE_ENTRIES)
          if (fetched) {
            facts = fetched
            break
          }
        }

        if (cancelled) {
          return
        }

        saveArtistFactsCache(artistFactsCacheRef.current)
        setArtistFacts(facts)
      } catch {
        if (!cancelled) {
          artistCandidates.forEach((artistName) => {
            if (!Object.prototype.hasOwnProperty.call(artistFactsCacheRef.current, artistName)) {
              setLruCacheValue(artistFactsCacheRef.current, artistName, null, MAX_ARTIST_FACTS_CACHE_ENTRIES)
            }
          })
          saveArtistFactsCache(artistFactsCacheRef.current)
          setArtistFacts(null)
        }
      } finally {
        if (!cancelled) {
          setArtistFactsLoading(false)
        }
      }
    }

    loadArtistFacts()

    return () => {
      cancelled = true
    }
  }, [currentTrack?.artist, currentTrack?.id])

  useEffect(() => {
    if (!lyricsOpen && !sidebarPlayerActive) {
      return undefined
    }

    if (!currentTrack?.id) {
      setLyricsText('')
      setLyricsError(LYRICS_TEMP_DISABLED ? LYRICS_TEMP_DISABLED_NOTICE : 'Önce bir şarkı seç.')
      setLyricsLoading(false)
      return undefined
    }

    if (LYRICS_TEMP_DISABLED) {
      setLyricsText('')
      setLyricsError(LYRICS_TEMP_DISABLED_NOTICE)
      setLyricsLoading(false)
      return undefined
    }

    const cacheKey = getLyricsCacheKeyForTrack(currentTrack)
    const localLyrics = normalizeLyricsText(currentTrack.lyricsLocal || currentTrack.lyrics || '')
    if (cacheKey && localLyrics) {
      setLruCacheValue(lyricsCacheRef.current, cacheKey, localLyrics, MAX_LYRICS_CACHE_ENTRIES)
      saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
      setLyricsText(localLyrics)
      setLyricsError('')
      setLyricsLoading(false)
      return undefined
    }
    if (!cacheKey) {
      setLyricsText('')
      setLyricsError('Sözler bulunamadı.')
      setLyricsLoading(false)
      return undefined
    }
    if (Object.prototype.hasOwnProperty.call(lyricsCacheRef.current, cacheKey)) {
      const cached = getLruCacheValue(lyricsCacheRef.current, cacheKey) || ''
      if (String(cached).trim()) {
        setLyricsText(cached)
        setLyricsError('')
        setLyricsLoading(false)
        return undefined
      }
      delete lyricsCacheRef.current[cacheKey]
      saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
    }

    let cancelled = false
    let settled = false
    setLyricsLoading(true)
    setLyricsError('')
    setLyricsText('')

    const timeout = window.setTimeout(() => {
      if (cancelled || settled) {
        return
      }

      settled = true
      setLyricsLoading(false)
      setLyricsText('')
      setLyricsError(t('lyricsNotFound', 'Sözler bulunamadı.'))
    }, LYRICS_SEARCH_TIMEOUT_MS)

    const loadLyrics = async () => {
      try {
        const text = await fetchLyricsForTrack(currentTrack)
        if (cancelled || settled) {
          return
        }

        settled = true
        window.clearTimeout(timeout)

        if (text) {
          setLruCacheValue(lyricsCacheRef.current, cacheKey, text, MAX_LYRICS_CACHE_ENTRIES)
          saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
          updateTrack(currentTrack.id, { lyricsLocal: text })
          setLyricsText(text)
          setLyricsError('')
        } else {
          setLyricsText('')
          setLyricsError(t('lyricsNotFound', 'Sözler bulunamadı.'))
        }
      } catch {
        if (!cancelled && !settled) {
          settled = true
          window.clearTimeout(timeout)
          setLyricsError(t('lyricsNotFound', 'Sözler bulunamadı.'))
          setLyricsText('')
        }
      } finally {
        if (!cancelled && settled) {
          setLyricsLoading(false)
        }
      }
    }

    loadLyrics()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [currentTrack, getLyricsCacheKeyForTrack, lyricsOpen, sidebarPlayerActive, t, updateTrack])

  useEffect(() => {
    return undefined
  }, [])

  useEffect(() => {
    if (!currentTrack?.id) {
      return
    }
    if (appBackgrounded) {
      return
    }
    // Arka plandan dönüşte sağ player kapağını zorla yeniden mount ederek
    // şarkı değiştirmeden kapak yüklenmesini garantile.
    setPlayerCoverRefreshKey((prev) => prev + 1)
  }, [appBackgrounded, currentTrack?.id])

  useEffect(() => {
    return undefined
  }, [])

  useEffect(() => {
    if (activeLyricIndex < 0 || !parsedLyrics.hasTiming) {
      return
    }
    const alignActiveLine = () => {
      if (typeof document === 'undefined') {
        return
      }
      const containers = [
        ...document.querySelectorAll('.lyrics-panel-body'),
        ...document.querySelectorAll('.player-lyrics-text'),
      ]
      containers.forEach((container) => {
        if (!(container instanceof HTMLElement)) {
          return
        }
        if (!container.getClientRects().length) {
          return
        }
        if (container.scrollHeight <= container.clientHeight + 4) {
          return
        }
        const activeNode = container.querySelector('.lyrics-line.is-active')
        if (!(activeNode instanceof HTMLElement)) {
          return
        }
        const containerRect = container.getBoundingClientRect()
        const activeRect = activeNode.getBoundingClientRect()
        const activeCenter =
          (activeRect.top - containerRect.top) + container.scrollTop + activeRect.height / 2
        const targetTop = activeCenter - container.clientHeight / 2
        const maxTop = Math.max(0, container.scrollHeight - container.clientHeight)
        const nextTop = Math.max(0, Math.min(maxTop, targetTop))
        container.scrollTop = nextTop
      })
    }
    const frame = window.requestAnimationFrame(alignActiveLine)
    return () => window.cancelAnimationFrame(frame)
  }, [activeLyricIndex, parsedLyrics.hasTiming, lyricsViewActive])

  useEffect(() => {
    if (selectedCollectionId === 'server') {
      setSelectedCollectionId('all')
      return
    }

    if (selectedCollectionId.startsWith('genre:')) {
      const exists = genreCollections.some((collection) => collection.id === selectedCollectionId)
      if (!exists) {
        setSelectedCollectionId('all')
      }
    }
  }, [genreCollections, selectedCollectionId])

  useEffect(() => {
    if (!selectedCollectionId.startsWith('monthly:')) {
      return
    }
    const exists = monthlyGeneratedCollections.some((collection) => collection.id === selectedCollectionId)
    if (!exists) {
      setSelectedCollectionId('all')
    }
  }, [monthlyGeneratedCollections, selectedCollectionId])

  useEffect(() => {
    if (!coverBasedBackgroundEnabled || reduceAnimationsEnabled || lowPowerModeEnabled || !currentTrackId) {
      setCoverTransitionWashVisible(false)
      return undefined
    }

    setCoverTransitionWashVisible(true)
    const timeout = window.setTimeout(() => {
      setCoverTransitionWashVisible(false)
    }, 620)
    return () => window.clearTimeout(timeout)
  }, [coverBasedBackgroundEnabled, currentTrackId, lowPowerModeEnabled, reduceAnimationsEnabled])

  const handleLyricsFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !currentTrack?.id) {
      event.target.value = ''
      return
    }

    try {
      const text = normalizeLyricsText(await file.text())
      const cacheKey = `${normalizeArtistQuery(currentTrack.artist || '').toLowerCase()}|${cleanTrackTitleForLyrics(
        currentTrack.title || '',
      ).toLowerCase()}`
      setLruCacheValue(lyricsCacheRef.current, cacheKey, text || '', MAX_LYRICS_CACHE_ENTRIES)
      saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
      setLyricsText(text || '')
      setLyricsError(text ? '' : 'Sözler bulunamadı.')
      setLyricsLoading(false)
    } catch {
      setLyricsError('Sözler bulunamadı.')
      setLyricsText('')
    } finally {
      event.target.value = ''
    }
  }

  useEffect(() => {
    saveUiPrefs({
      ...loadUiPrefs(),
      themeMode,
      closeBehavior,
      spaceKeyPlaybackEnabled,
      arrowSeekEnabled,
      mediaToggleShortcut,
      monoAudioEnabled,
      language,
      sharedManifestUrl,
      backgroundStyle,
      customThemeColor,
      coverBasedBackgroundEnabled,
      backgroundColor1,
      backgroundColor2,
      hardwareAccelerationEnabled,
      launchOnStartupEnabled,
      preventSleepWhilePlayingEnabled,
      fullscreenEffectsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
      playlistRailCollapsed,
    })
    updateAppSettings({
      themeMode,
      closeBehavior,
      launchOnStartupEnabled,
      hardwareAccelerationEnabled,
      preventSleepWhilePlayingEnabled,
      resetShortcutEnabled,
      resetShortcut,
      mediaToggleShortcut,
      reduceAnimationsEnabled,
      lowPowerModeEnabled,
      compactListEnabled,
      showScrollbars,
    })
  }, [arrowSeekEnabled, backgroundColor1, backgroundColor2, backgroundStyle, closeBehavior, compactListEnabled, coverBasedBackgroundEnabled, customThemeColor, fullscreenEffectsEnabled, hardwareAccelerationEnabled, language, launchOnStartupEnabled, lowPowerModeEnabled, mediaToggleShortcut, monoAudioEnabled, playlistRailCollapsed, preventSleepWhilePlayingEnabled, reduceAnimationsEnabled, resetShortcutEnabled, resetShortcut, sharedManifestUrl, showScrollbars, spaceKeyPlaybackEnabled, themeMode])

  useEffect(() => {
    if (!isHydrated || !manualTrackRepairRequest) {
      return undefined
    }

    if (lastManualTrackRepairRequestRef.current === manualTrackRepairRequest) {
      return undefined
    }
    lastManualTrackRepairRequestRef.current = manualTrackRepairRequest

    let cancelled = false
    const tracksNeedingRemoteMeta = tracks.filter(
      (track) =>
        (
          !track.metadataLocked ||
          (!track.coverUrl && !track.coverRemoteUrl)
        ) &&
        (
          (!track.coverUrl && !track.coverRemoteUrl) ||
          !String(track.album || '').trim() ||
          String(track.album || '').trim().toLowerCase() === 'single' ||
          !normalizeGenreName(track.genre || '')
        ) &&
        track.title,
    )

    const runQueue = async () => {
      for (const track of tracksNeedingRemoteMeta) {
        if (cancelled) {
          break
        }

        let resolvedTitle = String(track.title || '').trim()
        let resolvedArtist = String(track.artist || '').trim()
        let inferredIdentity = null
        if (!resolvedArtist || resolvedArtist === 'Yerel Koleksiyon') {
          try {
            inferredIdentity = await inferTrackIdentityFromTitle(resolvedTitle)
            if (inferredIdentity?.artist) {
              resolvedArtist = String(inferredIdentity.artist).trim()
            }
            if (inferredIdentity?.title) {
              resolvedTitle = cleanFilenameTrackTitle(inferredIdentity.title) || resolvedTitle
            }
          } catch {
            inferredIdentity = null
          }
        }

        const cacheKey = `${normalizeArtistQuery(resolvedArtist || track.artist || '')}|${resolvedTitle || track.title}`.toLowerCase()
        const needsCover = !track.coverUrl && !track.coverRemoteUrl
        const normalizedAlbum = String(track.album || '').trim()
        const needsAlbum = !normalizedAlbum || normalizedAlbum.toLowerCase() === 'single'
        const normalizedGenre = normalizeGenreName(track.genre || '')
        const needsGenre = !normalizedGenre
        const cachedCover = getLruCacheValue(coverArtCacheRef.current, cacheKey)
        const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()
        const cachedGenre = normalizeGenreName(getLruCacheValue(genreCacheRef.current, cacheKey) || '')
        const hasUsableCachedCover = Boolean(cachedCover)
        const hasUsableCachedAlbum = Boolean(cachedAlbum && cachedAlbum.toLowerCase() !== 'single')
        const hasUsableCachedGenre = Boolean(cachedGenre)
        const cachedUpdates = {}

        if (needsCover && cachedCover) {
          cachedUpdates.coverRemoteUrl = cachedCover
          if (!track.coverUrl) {
            cachedUpdates.coverUrl = cachedCover
          }
        }
        if (needsAlbum && cachedAlbum && cachedAlbum.toLowerCase() !== 'single') {
          cachedUpdates.album = cachedAlbum
        }
        if (needsGenre && cachedGenre) {
          cachedUpdates.genre = cachedGenre
        }
        if (Object.keys(cachedUpdates).length) {
          updateTrack(track.id, cachedUpdates)
        }

        if (
          (!needsCover || hasUsableCachedCover) &&
          (!needsAlbum || hasUsableCachedAlbum) &&
          (!needsGenre || hasUsableCachedGenre)
        ) {
          await new Promise((resolve) => scheduleIdle(resolve))
          continue
        }

        try {
          let remoteMeta = { coverUrl: '', album: '', genre: '' }
          if (resolvedTitle && resolvedArtist) {
            remoteMeta = await fetchRemoteTrackMetaSmart(resolvedTitle, resolvedArtist, {
              preferredDuration: Number(track.duration || 0),
            })
          }
          if ((!remoteMeta?.coverUrl || !remoteMeta?.album) && inferredIdentity) {
            remoteMeta = {
              ...remoteMeta,
              coverUrl: remoteMeta?.coverUrl || String(inferredIdentity.coverUrl || '').trim(),
              album: remoteMeta?.album || String(inferredIdentity.album || '').trim(),
            }
          }
          if (cancelled) {
            break
          }

          let remoteAlbum = String(remoteMeta?.album || '').trim()
          let remoteCover = remoteMeta?.coverUrl || ''
          let remoteGenre = normalizeGenreName(remoteMeta?.genre || '')
          if (!remoteCover || !remoteAlbum || remoteAlbum.toLowerCase() === 'single') {
            try {
                const fallbackIdentity = await inferTrackIdentityFromTitle(resolvedTitle || track.title)
                const fallbackArtistMatches = areArtistsCompatible(
                  resolvedArtist || track.artist,
                  String(fallbackIdentity?.artist || ''),
                )
              if (fallbackArtistMatches) {
                if (!remoteCover && fallbackIdentity?.coverUrl) {
                  remoteCover = fallbackIdentity.coverUrl
                }
                if ((!remoteAlbum || remoteAlbum.toLowerCase() === 'single') && fallbackIdentity?.album) {
                  remoteAlbum = String(fallbackIdentity.album).trim()
                }
              }
            } catch {
              // ignore fallback lookup errors
            }
          }
          setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCover, MAX_COVER_CACHE_ENTRIES)
          setLruCacheValue(albumCacheRef.current, cacheKey, remoteAlbum, MAX_ALBUM_CACHE_ENTRIES)
          setLruCacheValue(genreCacheRef.current, cacheKey, remoteGenre, MAX_GENRE_CACHE_ENTRIES)
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
          saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
          saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)

          const updates = {}
          if (needsCover && remoteCover) {
            updates.coverRemoteUrl = remoteCover
            if (!track.coverUrl) {
              updates.coverUrl = remoteCover
            }
          }
          if (needsAlbum && remoteAlbum && remoteAlbum.toLowerCase() !== 'single') {
            updates.album = remoteAlbum
          }
          if (needsGenre && remoteGenre) {
            updates.genre = remoteGenre
          }
          if (Object.keys(updates).length) {
            updateTrack(track.id, updates)
          }
        } catch {
          if (!cancelled) {
            setLruCacheValue(coverArtCacheRef.current, cacheKey, '', MAX_COVER_CACHE_ENTRIES)
            setLruCacheValue(albumCacheRef.current, cacheKey, '', MAX_ALBUM_CACHE_ENTRIES)
            setLruCacheValue(genreCacheRef.current, cacheKey, '', MAX_GENRE_CACHE_ENTRIES)
            saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
            saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
            saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
          }
        }

        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [isHydrated, manualTrackRepairRequest, tracks])

  useEffect(() => {
    if (!isHydrated) {
      return undefined
    }

    let cancelled = false
    const tracksNeedingTone = tracks.filter(
      (track) =>
        !track.coverTone && (track.coverUrl || track.coverRemoteUrl) && track.id,
    )

    const runQueue = async () => {
      for (const track of tracksNeedingTone) {
        if (cancelled) {
          break
        }

        const source = track.coverUrl || track.coverRemoteUrl
        const cacheKey = source || track.id

        if (Object.prototype.hasOwnProperty.call(coverToneCacheRef.current, cacheKey)) {
          const cachedTone = coverToneCacheRef.current[cacheKey]
          if (cachedTone && !cancelled) {
            updateTrack(track.id, { coverTone: cachedTone })
          }
          await new Promise((resolve) => scheduleIdle(resolve))
          continue
        }

        try {
          const tone = await extractDominantColor(source)
          if (cancelled) {
            break
          }

          coverToneCacheRef.current[cacheKey] = tone || ''
          saveJsonCache(COVER_TONE_CACHE_KEY, coverToneCacheRef.current)
          if (tone) {
            updateTrack(track.id, { coverTone: tone })
          }
        } catch {
          if (!cancelled) {
            coverToneCacheRef.current[cacheKey] = ''
            saveJsonCache(COVER_TONE_CACHE_KEY, coverToneCacheRef.current)
          }
        }

        await new Promise((resolve) => scheduleIdle(resolve))
      }
    }

    runQueue().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [appBackgrounded, isHydrated, tracks])

  useEffect(() => {
    setDockPlaylistMenuOpen(false)
  }, [currentTrackId])

  useEffect(() => {
    let cancelled = false
    const source = String(currentTrack?.coverUrl || currentTrack?.coverRemoteUrl || '').trim()

    if (!source) {
      setActiveCoverTone('')
      return undefined
    }

    const cachedTone = coverToneCacheRef.current[source]
    if (cachedTone) {
      setActiveCoverTone(cachedTone)
      return undefined
    }

    extractDominantColor(source)
      .then((tone) => {
        if (cancelled) return
        const nextTone = String(tone || '').trim()
        if (!nextTone) return
        setActiveCoverTone(nextTone)
        coverToneCacheRef.current[source] = nextTone
        saveJsonCache(COVER_TONE_CACHE_KEY, coverToneCacheRef.current)
        if (currentTrack?.id && !currentTrack?.coverTone) {
          updateTrack(currentTrack.id, { coverTone: nextTone })
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [currentTrack?.id, currentTrack?.coverUrl, currentTrack?.coverRemoteUrl, currentTrack?.coverTone])

  useEffect(() => {
    if (!isCustomPlaylistSelected) {
      setPlaylistAddOpen(false)
    }
  }, [isCustomPlaylistSelected])

  async function addFilesToLibrary(incomingFiles) {
    const files = Array.from(incomingFiles || []).filter((file) =>
      file?.type?.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(file?.name || ''),
    )
    if (!files.length) {
      showUploadNotice('Ses dosyası bulunamadı.')
      return
    }

    const existingSignatures = new Set(allTracks.map(getTrackSignature))
    const createdTracks = []
    const nextTrackOrder =
      Math.max(-1, ...allTracks.map((track, index) => getTrackSortValue(track, index))) + 1
    let duplicateName = ''

    for (const [index, file] of files.entries()) {
      const audioUrl = URL.createObjectURL(file)
      const metadata = await readTrackMetadata(file)
      const parsedName = parseTrackName(file.name)
        let title = cleanFilenameTrackTitle(metadata?.title || parsedName.title) || 'Bilinmeyen parça'
      let artist = metadata?.artist || parsedName.artist
      let album = (metadata?.album || '').trim()

      let inferredIdentity = null
      const needsArtistInference =
        !metadata?.artist?.trim() &&
        (!artist || artist === 'Yerel Koleksiyon') &&
        Boolean(title)

      if (needsArtistInference) {
        try {
          inferredIdentity = await inferTrackIdentityFromTitle(title)
          if (inferredIdentity?.artist) {
            artist = inferredIdentity.artist
          }
          if (inferredIdentity?.title) {
            title = cleanFilenameTrackTitle(inferredIdentity.title) || title
          }
          if (!album && inferredIdentity?.album) {
            album = inferredIdentity.album
          }
        } catch {
          inferredIdentity = null
        }
      }

      const lyricsProbePromise = withTimeout(
        fetchLyricsForTrack({
          id: `lyrics-probe-local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          artist,
          album: String(album || '').trim() || 'Single',
          audioUrl,
        }),
        ENRICHMENT_TIMEOUT_MS,
        '',
      )

      const durationValue = await readDuration(audioUrl)
      const signature = getTrackSignature({
        title,
        artist,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        duration: durationValue,
      })

      if (existingSignatures.has(signature)) {
        URL.revokeObjectURL(audioUrl)
        if (!duplicateName) {
          duplicateName = `${artist} - ${title}`.trim()
        }
        continue
      }

      existingSignatures.add(signature)
      let remoteCoverUrl = ''
      let resolvedGenre = normalizeGenreName(metadata?.genre || '')
      if (title && artist && artist !== 'Yerel Koleksiyon') {
        let cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
        let remoteMeta = await withTimeout(
          (async () => {
            let nextMeta = await fetchRemoteTrackMetaSmart(title, artist, {
              preferredAlbum: album || inferredIdentity?.album || '',
              preferredDuration: Number(durationValue || 0),
            })
            if (nextMeta?.swapped) {
              const swappedTitle = cleanFilenameTrackTitle(artist) || title
              const swappedArtist = sanitizeDisplayText(title) || artist
              title = swappedTitle
              artist = swappedArtist
              cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
            }
            if (
              (!nextMeta?.coverUrl || !nextMeta?.album || String(nextMeta.album).trim().toLowerCase() === 'single') &&
              title
            ) {
              try {
                const fallbackIdentity = await inferTrackIdentityFromTitle(title)
                const fallbackArtistMatches = areArtistsCompatible(
                  artist,
                  String(fallbackIdentity?.artist || ''),
                )
                if (fallbackArtistMatches) {
                  nextMeta = {
                    ...nextMeta,
                    coverUrl: nextMeta?.coverUrl || fallbackIdentity?.coverUrl || '',
                    album: String(nextMeta?.album || '').trim() || String(fallbackIdentity?.album || '').trim(),
                  }
                }
              } catch {
                // ignore fallback lookup errors
              }
            }
            if (!nextMeta?.coverUrl) {
              const insightFallback = await fillCoverFromAlbumInsight({
                title,
                artist,
                album: String(nextMeta?.album || album || inferredIdentity?.album || '').trim(),
                coverUrl: String(nextMeta?.coverUrl || inferredIdentity?.coverUrl || '').trim(),
              })
              nextMeta = {
                ...nextMeta,
                coverUrl: String(insightFallback.coverUrl || nextMeta?.coverUrl || '').trim(),
                album: String(insightFallback.album || nextMeta?.album || '').trim(),
              }
            }
            return nextMeta
          })(),
          ENRICHMENT_TIMEOUT_MS,
          { coverUrl: '', album: String(album || inferredIdentity?.album || '').trim(), genre: '' },
        )
        remoteCoverUrl = remoteMeta?.coverUrl || inferredIdentity?.coverUrl || ''
        resolvedGenre = normalizeGenreName(remoteMeta?.genre || resolvedGenre)
        if (!album && remoteMeta?.album) {
          album = String(remoteMeta.album).trim()
        }
        if (!album && inferredIdentity?.album) {
          album = String(inferredIdentity.album).trim()
        }
        setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
        setLruCacheValue(
          albumCacheRef.current,
          cacheKey,
          String(remoteMeta.album || inferredIdentity?.album || '').trim(),
          MAX_ALBUM_CACHE_ENTRIES,
        )
        setLruCacheValue(
          genreCacheRef.current,
          cacheKey,
          normalizeGenreName(remoteMeta?.genre || resolvedGenre || ''),
          MAX_GENRE_CACHE_ENTRIES,
        )
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
      }
      if (!album) {
        album = 'Single'
      }

      let lyricsText = ''
      try {
        lyricsText = normalizeLyricsText(await lyricsProbePromise)
      } catch {
        lyricsText = ''
      }
      const lyricsCacheKey = getLyricsCacheKeyForTrack({
        title,
        artist,
      })
      if (lyricsText && lyricsCacheKey) {
        setLruCacheValue(lyricsCacheRef.current, lyricsCacheKey, lyricsText, MAX_LYRICS_CACHE_ENTRIES)
        saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
      }

      assetUrlsRef.current.push(audioUrl)

      createdTracks.push({
        id: `${file.name}-${file.lastModified}-${index}`,
        title,
        artist,
        album,
        genre: resolvedGenre || '',
        fileName: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        duration: durationValue,
        gradient: gradients[(tracks.length + index) % gradients.length],
        audioBlob: file,
        audioUrl,
        coverBlob: null,
        coverUrl: remoteCoverUrl,
        coverRemoteUrl: remoteCoverUrl,
        coverTone: '',
        coverName: '',
        isFavorite: false,
        createdAt: Date.now(),
        order: nextTrackOrder + index,
        source: 'local',
        metadataLocked: true,
        lyricsLocal: lyricsText,
      })
    }

    if (createdTracks.length) {
      setTracks((prev) => [...prev, ...createdTracks])
    }

    if (duplicateName) {
      showUploadNotice(`${duplicateName} zaten ekli.`)
    }

    closeAddModal()
  }

  addFilesToLibraryRef.current = addFilesToLibrary

  const handleUpload = async (event) => {
    await addFilesToLibrary(event.target.files || [])
    event.target.value = ''
  }

  const handleYouTubeSearch = async () => {
    const query = String(youtubeSearchQuery || '').trim()
    if (!query) {
      setYoutubeSearchError('Önce arama yaz.')
      setYoutubeSearchResults([])
      setYoutubeSearchRootResults([])
      setYoutubeSearchAlbumViewTitle('')
      return
    }

    if (!window.novaPlayer?.searchYtMusic && !window.novaPlayer?.searchYoutube) {
      setYoutubeSearchError('Bu sürümde arama desteği yok.')
      return
    }

    setYoutubeSearchLoading(true)
    setYoutubeSearchError('')
    setYoutubeSearchAlbumViewTitle('')
    const requestId = ++youtubeSearchRequestRef.current
    const cachedItems = readYtmSearchCache(query, 'all')
    if (cachedItems) {
      setYoutubeSearchResults(Array.isArray(cachedItems) ? cachedItems.slice(0, MAX_IN_MEMORY_SEARCH_RESULTS) : [])
      setYoutubeSearchRootResults(cachedItems)
      setYoutubeSearchLoading(false)
      return
    }
    if (isYouTubeLikeUrl(query)) {
      const videoId = extractYouTubeVideoId(query)
      const normalizedUrl = query.startsWith('http') ? query : `https://${query}`
      const fallbackThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
      const directItem = {
        id: videoId || normalizedUrl,
        type: 'song',
        title: 'Bağlantıdan şarkı',
        artist: 'YouTube / YouTube Music',
        thumbnail: fallbackThumb,
        url: normalizedUrl,
      }
      setYoutubeSearchResults([directItem])
      setYoutubeSearchRootResults([directItem])
      setYoutubeSearchLoading(false)
      return
    }
    try {
      const inFlightKey = `all|||${normalizeCoverMatchText(query)}`
      let inFlight = ytmSearchInFlightRef.current.get(inFlightKey)
      if (!inFlight) {
        inFlight = window.novaPlayer?.searchYtMusic
          ? window.novaPlayer.searchYtMusic({ query, limit: 12 })
          : window.novaPlayer.searchYoutube({ query, limit: 12 })
        ytmSearchInFlightRef.current.set(inFlightKey, inFlight)
      }
      const result = await inFlight
      ytmSearchInFlightRef.current.delete(inFlightKey)
      if (requestId !== youtubeSearchRequestRef.current) {
        return
      }
      if (!result?.ok) {
        setYoutubeSearchResults([])
        setYoutubeSearchError(String(result?.error || 'Arama yapılamadı.'))
        return
      }
      const items = Array.isArray(result.items) ? result.items : []
      setYoutubeSearchResults(Array.isArray(items) ? items.slice(0, MAX_IN_MEMORY_SEARCH_RESULTS) : [])
      setYoutubeSearchRootResults(items)
      writeYtmSearchCache(query, 'all', items)
      if (!items.length) {
        setYoutubeSearchError('Sonuç bulunamadı.')
      }
    } catch {
      ytmSearchInFlightRef.current.delete(`all|||${normalizeCoverMatchText(query)}`)
      if (requestId !== youtubeSearchRequestRef.current) {
        return
      }
      setYoutubeSearchResults([])
      setYoutubeSearchError('Arama sırasında hata oluştu.')
    } finally {
      if (requestId === youtubeSearchRequestRef.current) {
        setYoutubeSearchLoading(false)
      }
    }
  }

  const handleRetryLyricsSearch = useCallback(async () => {
    if (!currentTrack?.id) {
      return
    }
    const cacheKey = getLyricsCacheKeyForTrack(currentTrack)
    if (cacheKey && Object.prototype.hasOwnProperty.call(lyricsCacheRef.current, cacheKey)) {
      delete lyricsCacheRef.current[cacheKey]
      saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
    }
    setLyricsLoading(true)
    setLyricsError('')
    try {
      const text = await fetchLyricsForTrack(currentTrack)
      const normalized = normalizeLyricsText(text || '')
      if (cacheKey) {
        if (normalized) {
          setLruCacheValue(lyricsCacheRef.current, cacheKey, normalized, MAX_LYRICS_CACHE_ENTRIES)
          saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
        }
      }
      if (normalized) {
        updateTrack(currentTrack.id, { lyricsLocal: normalized })
        setLyricsText(normalized)
        setLyricsError('')
      } else {
        setLyricsText('')
        setLyricsError(t('lyricsNotFound', 'Sözler bulunamadı.'))
      }
    } catch {
      setLyricsText('')
      setLyricsError(t('lyricsNotFound', 'Sözler bulunamadı.'))
    } finally {
      setLyricsLoading(false)
    }
  }, [currentTrack, getLyricsCacheKeyForTrack, t, updateTrack])

  const handleUpdaterDownloadNow = async () => {
    try {
      const result = await window.novaPlayer?.downloadUpdate?.()
      if (!result?.ok) {
        showUploadNotice(`Güncelleme indirilemedi: ${result?.reason || 'hazır değil'}`)
        return
      }
      showUploadNotice('Güncelleme indiriliyor...')
    } catch {
      showUploadNotice('Güncelleme indirilemedi.')
    }
  }

  const handleTopbarYouTubeSearch = async () => {
    const query = String(topbarYoutubeQuery || '').trim()
    const normalizedQuery = normalizeCoverMatchText(query)
    const normalizedFilter = String(topbarYoutubeFilter || 'all').trim().toLowerCase()
    topbarYoutubeAutoSearchKeyRef.current = normalizedQuery
      ? `${normalizedFilter}|||${normalizedQuery}`
      : ''
    if (!query) {
      setTopbarYoutubeError('Önce arama yaz.')
      setTopbarYoutubeResults([])
      setTopbarYoutubeRootResults([])
      setTopbarYoutubeAlbumViewTitle('')
      return
    }
    if (!window.novaPlayer?.searchYtMusic && !window.novaPlayer?.searchYoutube) {
      setTopbarYoutubeError('Bu sürümde arama desteği yok.')
      return
    }
    setTopbarYoutubeLoading(true)
    setTopbarYoutubeError('')
    setTopbarYoutubeAlbumViewTitle('')
    setTopbarYoutubeAddingIds(new Set())
    const requestId = ++topbarYoutubeSearchRequestRef.current
    const cachedItems = readYtmSearchCache(query, topbarYoutubeFilter)
    if (cachedItems) {
      const limitedCached = Array.isArray(cachedItems) ? cachedItems.slice(0, MAX_IN_MEMORY_SEARCH_RESULTS) : []
      setTopbarYoutubeResults(limitedCached)
      setTopbarYoutubeRootResults(limitedCached)
      setTopbarYoutubeLoading(false)
      return
    }
    if (isYouTubeLikeUrl(query)) {
      const videoId = extractYouTubeVideoId(query)
      const normalizedUrl = query.startsWith('http') ? query : `https://${query}`
      const fallbackThumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''
      const directItem = {
        id: videoId || normalizedUrl,
        type: 'song',
        title: 'Bağlantıdan şarkı',
        artist: 'YouTube / YouTube Music',
        thumbnail: fallbackThumb,
        url: normalizedUrl,
      }
      setTopbarYoutubeResults([directItem])
      setTopbarYoutubeRootResults([directItem])
      setTopbarYoutubeLoading(false)
      return
    }
    try {
      const inFlightKey = `${normalizedFilter}|||${normalizeCoverMatchText(query)}`
      let inFlight = ytmSearchInFlightRef.current.get(inFlightKey)
      if (!inFlight) {
        inFlight = window.novaPlayer?.searchYtMusic
          ? window.novaPlayer.searchYtMusic({ query, limit: 12, filter: topbarYoutubeFilter })
          : window.novaPlayer.searchYoutube({ query, limit: 8 })
        ytmSearchInFlightRef.current.set(inFlightKey, inFlight)
      }
      const result = await inFlight
      ytmSearchInFlightRef.current.delete(inFlightKey)
      if (requestId !== topbarYoutubeSearchRequestRef.current) {
        return
      }
      if (!result?.ok) {
        setTopbarYoutubeResults([])
        setTopbarYoutubeError(String(result?.error || 'Arama yapılamadı.'))
        return
      }
      const items = Array.isArray(result.items) ? result.items : []
      const limited = Array.isArray(items) ? items.slice(0, MAX_IN_MEMORY_SEARCH_RESULTS) : []
      setTopbarYoutubeResults(limited)
      setTopbarYoutubeRootResults(limited)
      writeYtmSearchCache(query, topbarYoutubeFilter, items)
      if (!items.length) {
        setTopbarYoutubeError('Sonuç bulunamadı.')
      }
    } catch {
      ytmSearchInFlightRef.current.delete(
        `${String(topbarYoutubeFilter || 'all').trim().toLowerCase()}|||${normalizeCoverMatchText(query)}`,
      )
      if (requestId !== topbarYoutubeSearchRequestRef.current) {
        return
      }
      setTopbarYoutubeResults([])
      setTopbarYoutubeError('Arama sırasında hata oluştu.')
    } finally {
      if (requestId === topbarYoutubeSearchRequestRef.current) {
        setTopbarYoutubeLoading(false)
      }
    }
  }

  useEffect(() => {
    const query = String(topbarYoutubeQuery || '').trim()
    const normalizedQuery = normalizeCoverMatchText(query)
    if (!normalizedQuery || normalizedQuery.length < 2 || topbarYoutubeAlbumViewTitle) {
      topbarYoutubeAutoSearchKeyRef.current = ''
      return undefined
    }

    const autoKey = `${String(topbarYoutubeFilter || 'all').trim().toLowerCase()}|||${normalizedQuery}`
    if (topbarYoutubeAutoSearchKeyRef.current === autoKey) {
      return undefined
    }

    const cached = readYtmSearchCache(query, topbarYoutubeFilter)
    if (cached && cached.length) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      if (topbarYoutubeAutoSearchKeyRef.current === autoKey) {
        return
      }
      topbarYoutubeAutoSearchKeyRef.current = autoKey
      handleTopbarYouTubeSearch()
    }, 260)

    return () => window.clearTimeout(timer)
  }, [
    handleTopbarYouTubeSearch,
    readYtmSearchCache,
    topbarYoutubeAlbumViewTitle,
    topbarYoutubeFilter,
    topbarYoutubeQuery,
  ])

  const loadYtMusicAlbumTracks = useCallback(async (item) => {
    const albumId = String(item?.albumId || item?.id || '').trim()
    if (!albumId || !window?.novaPlayer?.getYtMusicAlbumTracks) {
      return []
    }
    const cached = readYtmAlbumTracksCache(albumId)
    if (cached) {
      return cached
    }
    try {
      let inFlight = ytmAlbumTracksInFlightRef.current.get(albumId)
      if (!inFlight) {
        inFlight = window.novaPlayer.getYtMusicAlbumTracks({
          albumId,
          artistName: String(item?.artist || '').trim(),
        })
        ytmAlbumTracksInFlightRef.current.set(albumId, inFlight)
      }
      const result = await inFlight
      ytmAlbumTracksInFlightRef.current.delete(albumId)
      if (!result?.ok || !Array.isArray(result.tracks)) {
        return []
      }
      const mapped = result.tracks.map((track) => ({
        ...track,
        type: 'song',
        thumbnail: track.thumbnail || item.thumbnail || '',
      }))
      writeYtmAlbumTracksCache(albumId, mapped)
      return mapped
    } catch {
      ytmAlbumTracksInFlightRef.current.delete(albumId)
      return []
    }
  }, [readYtmAlbumTracksCache, writeYtmAlbumTracksCache])

  const refreshYoutubeAuthStatus = useCallback(async () => {
    if (!window?.novaPlayer?.getYoutubeAuthStatus) return
    try {
      const status = await window.novaPlayer.getYoutubeAuthStatus()
      if (status?.ok) {
        setYoutubeAuthStatus({
          connected: Boolean(status.connected),
          channelTitle: String(status.channelTitle || '').trim(),
          channelId: String(status.channelId || '').trim(),
        })
      }
    } catch {
      setYoutubeAuthStatus({ connected: false, channelTitle: '', channelId: '' })
    }
  }, [])

  useEffect(() => {
    refreshYoutubeAuthStatus()
  }, [refreshYoutubeAuthStatus])

  const connectYoutubeAccount = useCallback(async () => {
    if (!window?.novaPlayer?.connectYoutubeAccount) return
    setYoutubeAuthLoading(true)
    try {
      console.info('[YouTube OAuth] connect button clicked')
      console.info('[YouTube OAuth] input lengths:', {
        clientIdLength: String(googleClientId || '').length,
        clientSecretLength: String(googleClientSecret || '').length,
        clientIdPreview: String(googleClientId || '').slice(0, 12),
      })
      showUploadNotice('Google giriş sayfası tarayıcıda açılıyor...')
      const result = await window.novaPlayer.connectYoutubeAccount({
        clientId: String(googleClientId || ''),
        clientSecret: String(googleClientSecret || ''),
      })
      console.info('[YouTube OAuth] connect result json:', JSON.stringify(result || {}))
      if (!result?.ok || result?.connected !== true) {
        const rawError = String(result?.error || 'Bilinmeyen hata')
        if (rawError.includes('redirect-uri-mismatch')) {
          showUploadNotice('Google bağlanamadı: OAuth Redirect URI yanlış. Google Cloud tarafına http://127.0.0.1:53682/oauth2callback ekle.')
        } else if (rawError.includes('invalid-client')) {
          showUploadNotice('Google bağlanamadı: Client ID/Secret yanlış veya OAuth istemci tipi Desktop App değil.')
        } else if (rawError.includes('google-client-missing')) {
          showUploadNotice(`Google bağlanamadı: Client bilgisi eksik (${rawError.replace('google-client-missing:', '') || 'clientId/clientSecret'}).`)
        } else if (rawError.includes('oauth-cancelled')) {
          showUploadNotice('Google girişi iptal edildi.')
        } else if (rawError.includes('oauth-timeout')) {
          showUploadNotice('Google bağlanamadı: süre doldu. Girişten sonra callback penceresinin açılmasına izin ver.')
        } else {
          showUploadNotice(`Google bağlanamadı: ${rawError}`)
        }
        return
      }
      await refreshYoutubeAuthStatus()
      showUploadNotice('Google hesabı bağlandı.')
    } catch (error) {
      console.error('[YouTube OAuth] connect failed:', error)
      showUploadNotice(`Google bağlanamadı: ${String(error?.message || error || 'Hata')}`)
    } finally {
      setYoutubeAuthLoading(false)
    }
  }, [googleClientId, googleClientSecret, refreshYoutubeAuthStatus])

  const disconnectYoutubeAccount = useCallback(async () => {
    if (!window?.novaPlayer?.disconnectYoutubeAccount) return
    setYoutubeAuthLoading(true)
    try {
      await window.novaPlayer.disconnectYoutubeAccount()
      setYoutubeAuthStatus({ connected: false, channelTitle: '', channelId: '' })
      setYoutubePlaylists([])
      showUploadNotice('Google hesabı bağlantısı kaldırıldı.')
    } finally {
      setYoutubeAuthLoading(false)
    }
  }, [])

  const refreshSpotifyAuthStatus = useCallback(async () => {
    if (!window?.novaPlayer?.getSpotifyAuthStatus) return
    try {
      const status = await window.novaPlayer.getSpotifyAuthStatus()
      if (status?.ok) {
        setSpotifyAuthStatus({
          connected: Boolean(status.connected),
          accountLabel: String(status.accountLabel || '').trim(),
        })
      }
    } catch {
      setSpotifyAuthStatus({ connected: false, accountLabel: '' })
    }
  }, [])

  useEffect(() => {
    refreshSpotifyAuthStatus()
  }, [refreshSpotifyAuthStatus])

  const connectSpotifyAccount = useCallback(async () => {
    if (!window?.novaPlayer?.connectSpotifyAccount) return
    setSpotifyAuthLoading(true)
    try {
      showUploadNotice('Spotify giriş sayfası tarayıcıda açılıyor...')
      const result = await window.novaPlayer.connectSpotifyAccount({
        clientId: String(spotifyClientId || ''),
        clientSecret: String(spotifyClientSecret || ''),
      })
      if (!result?.ok || !result?.connected) {
        const rawError = String(result?.error || '').trim()
        if (rawError.includes('spotify-scope-missing')) {
          showUploadNotice('Spotify izinleri eksik. Lütfen bağlantıyı kaldırıp hesabını tekrar bağla.')
        } else {
          showUploadNotice(`Spotify bağlanamadı: ${rawError || 'Bilinmeyen hata'}`)
        }
        return
      }
      await refreshSpotifyAuthStatus()
      showUploadNotice('Spotify hesabı bağlandı.')
    } catch (error) {
      showUploadNotice(`Spotify bağlanamadı: ${String(error?.message || error || 'Hata')}`)
    } finally {
      setSpotifyAuthLoading(false)
    }
  }, [refreshSpotifyAuthStatus, showUploadNotice, spotifyClientId, spotifyClientSecret])

  const disconnectSpotifyAccount = useCallback(async () => {
    if (!window?.novaPlayer?.disconnectSpotifyAccount) return
    setSpotifyAuthLoading(true)
    try {
      await window.novaPlayer.disconnectSpotifyAccount()
      setSpotifyAuthStatus({ connected: false, accountLabel: '' })
      setSpotifyPlaylists([])
      showUploadNotice('Spotify hesabı bağlantısı kaldırıldı.')
    } finally {
      setSpotifyAuthLoading(false)
    }
  }, [showUploadNotice])

  const isTrackAlreadyInLibraryByMeta = useCallback((title = '', artist = '') => {
    const normTitle = normalizeCoverMatchText(title)
    const normArtist = normalizeCoverMatchText(artist)
    if (!normTitle) return false
    return tracks.some((track) => {
      const tTitle = normalizeCoverMatchText(track.title || '')
      const tArtist = normalizeCoverMatchText(track.artist || '')
      if (tTitle !== normTitle) return false
      if (!normArtist) return true
      return tArtist === normArtist || tArtist.includes(normArtist) || normArtist.includes(tArtist)
    })
  }, [tracks])

  const findTrackIdInLibraryByMeta = useCallback((title = '', artist = '') => {
    const normTitle = normalizeCoverMatchText(title)
    const normArtist = normalizeCoverMatchText(artist)
    if (!normTitle) return ''
    const found = tracks.find((track) => {
      const tTitle = normalizeCoverMatchText(track.title || '')
      const tArtist = normalizeCoverMatchText(track.artist || '')
      if (tTitle !== normTitle) return false
      if (!normArtist) return true
      return tArtist === normArtist || tArtist.includes(normArtist) || normArtist.includes(tArtist)
    })
    return String(found?.id || '').trim()
  }, [tracks])

  const createImportedPlaylist = useCallback((name, description, trackIds) => {
    const trimmedName = String(name || '').trim()
    const trimmedDescription = String(description || '').trim()
    const normalizedTrackIds = Array.from(new Set((Array.isArray(trackIds) ? trackIds : []).filter(Boolean)))
    if (!trimmedName || !normalizedTrackIds.length) return null

    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: trimmedName,
      description: trimmedDescription,
      trackIds: normalizedTrackIds,
      color: playlistColorDraft,
      coverUrl: '',
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    setSelectedCollectionId(newPlaylist.id)
    return newPlaylist
  }, [playlistColorDraft])

  const importSpotifyPlaylist = useCallback(async (playlist) => {
    const playlistId = String(playlist?.playlistId || '').trim()
    if (!playlistId || !window?.novaPlayer?.getSpotifyPlaylistTracks) return
    setSpotifyImportingPlaylistId(playlistId)
    try {
      const result = await window.novaPlayer.getSpotifyPlaylistTracks({ playlistId })
      if (!result?.ok || !Array.isArray(result.tracks)) {
        const rawError = String(result?.error || '').trim()
        if (rawError.includes('spotify-scope-missing')) {
          showUploadNotice('Spotify izinleri eksik. Bağlantıyı kaldırıp hesabını yeniden bağla.')
        } else {
          showUploadNotice(`Spotify playlist alınamadı: ${rawError || 'Bilinmeyen hata'}`)
        }
        return
      }
      const targetTrackIds = []
      const tracksToImport = result.tracks.filter((track) => {
        const existingId = findTrackIdInLibraryByMeta(String(track.title || ''), String(track.artist || ''))
        if (existingId) {
          targetTrackIds.push(existingId)
          return false
        }
        return true
      })
      let added = 0
      for (const track of tracksToImport) {
        const trackTitle = String(track.title || '').trim()
        const trackArtist = String(track.artist || '').trim()
        const trackAlbum = String(track.album || '').trim()
        const query = `${trackArtist} ${trackTitle} ${trackAlbum}`.trim()
        let ytmUrl = ''
        try {
          const search = await window?.novaPlayer?.searchYtMusic?.({ query, filter: 'songs', limit: 8 })
          const songs = Array.isArray(search?.results)
            ? search.results.filter((item) => String(item?.type || 'song') === 'song' && item?.url)
            : []

          const wantedTitle = normalizeCoverMatchText(trackTitle)
          const wantedArtist = normalizeCoverMatchText(trackArtist)
          const wantedAlbum = normalizeCoverMatchText(trackAlbum)

          const scoreSong = (item) => {
            const itemTitle = normalizeCoverMatchText(item?.title || '')
            const itemArtist = normalizeCoverMatchText(item?.artist || '')
            const itemAlbum = normalizeCoverMatchText(item?.album || '')
            let score = 0
            if (itemTitle && wantedTitle) {
              if (itemTitle === wantedTitle) score += 6
              else if (itemTitle.includes(wantedTitle) || wantedTitle.includes(itemTitle)) score += 3
            }
            if (itemArtist && wantedArtist) {
              if (itemArtist === wantedArtist) score += 5
              else if (itemArtist.includes(wantedArtist) || wantedArtist.includes(itemArtist)) score += 2
            }
            if (itemAlbum && wantedAlbum) {
              if (itemAlbum === wantedAlbum) score += 4
              else if (itemAlbum.includes(wantedAlbum) || wantedAlbum.includes(itemAlbum)) score += 1
            }
            return score
          }

          const ranked = songs
            .map((item) => ({ item, score: scoreSong(item) }))
            .sort((a, b) => b.score - a.score)
          const bestSong = ranked[0]?.item || songs[0] || null
          ytmUrl = String(bestSong?.url || '').trim()
        } catch {
          ytmUrl = ''
        }
        if (!ytmUrl) continue
        const created = await handleLinkAdd(
          {
            audioUrl: ytmUrl,
            title: trackTitle,
            artist: trackArtist,
            album: trackAlbum,
            coverUrl: String(track.coverUrl || ''),
          },
          { keepModalOpen: true, suppressNotice: true },
        )
        if (Array.isArray(created) && created.length) {
          added += created.length
          for (const createdTrack of created) {
            const createdId = String(createdTrack?.id || '').trim()
            if (createdId) targetTrackIds.push(createdId)
          }
        }
      }
      const uniqueTrackIds = Array.from(new Set(targetTrackIds.filter(Boolean)))
      if (uniqueTrackIds.length) {
        createImportedPlaylist(
          String(playlist?.title || 'Spotify playlist').trim() || 'Spotify playlist',
          String(playlist?.description || '').trim(),
          uniqueTrackIds,
        )
      }
      showUploadNotice(`${playlist?.title || 'Spotify playlist'} içinden ${added} şarkı eklendi.`)
    } catch (error) {
      showUploadNotice(`Spotify içe aktarma hatası: ${String(error?.message || error || 'Hata')}`)
    } finally {
      setSpotifyImportingPlaylistId('')
    }
  }, [createImportedPlaylist, findTrackIdInLibraryByMeta, showUploadNotice])

  const importSpotifyPlaylists = useCallback(async () => {
    if (!window?.novaPlayer?.getSpotifyPlaylists) return
    setSpotifyImportOpen(true)
    setSpotifyPlaylistsLoading(true)
    try {
      if (!spotifyAuthStatus.connected) {
        showUploadNotice('Önce Spotify hesabını bağla.')
        setSpotifyPlaylists([])
        return
      }
      const result = await window.novaPlayer.getSpotifyPlaylists()
      if (!result?.ok) {
        const rawError = String(result?.error || '').trim()
        if (rawError.includes('spotify-scope-missing')) {
          showUploadNotice('Spotify izinleri eksik. Bağlantıyı kaldırıp hesabını yeniden bağla.')
        } else {
          showUploadNotice(`Spotify playlistleri alınamadı: ${rawError || 'Bilinmeyen hata'}`)
        }
        setSpotifyPlaylists([])
        return
      }
      setSpotifyPlaylists(Array.isArray(result.playlists) ? result.playlists : [])
    } catch (error) {
      showUploadNotice(`Spotify playlistleri alınamadı: ${String(error?.message || error || 'Hata')}`)
      setSpotifyPlaylists([])
    } finally {
      setSpotifyPlaylistsLoading(false)
    }
  }, [showUploadNotice, spotifyAuthStatus.connected])

  const openYoutubePlaylistImport = useCallback(async () => {
    if (!window?.novaPlayer?.getYoutubePlaylists) return
    setYoutubeImportOpen(true)
    setYoutubePlaylistsLoading(true)
    try {
      const result = await window.novaPlayer.getYoutubePlaylists()
      if (!result?.ok) {
        showUploadNotice(`Playlistler alınamadı: ${String(result?.error || 'Bilinmeyen hata')}`)
        setYoutubePlaylists([])
        return
      }
      setYoutubePlaylists(Array.isArray(result.playlists) ? result.playlists : [])
    } catch (error) {
      showUploadNotice(`Playlistler alınamadı: ${String(error?.message || error || 'Hata')}`)
      setYoutubePlaylists([])
    } finally {
      setYoutubePlaylistsLoading(false)
    }
  }, [])

  const importYoutubePlaylist = useCallback(async (playlist) => {
    const playlistId = String(playlist?.playlistId || '').trim()
    if (!playlistId || !window?.novaPlayer?.getYoutubePlaylistTracks) return
    setYoutubeImportingPlaylistId(playlistId)
    try {
      const result = await window.novaPlayer.getYoutubePlaylistTracks({ playlistId })
      if (!result?.ok || !Array.isArray(result.tracks)) {
        showUploadNotice(`Playlist alınamadı: ${String(result?.error || 'Bilinmeyen hata')}`)
        return
      }
      const targetTrackIds = []
      const tracksToImport = result.tracks.filter((track) => {
        if (!track?.url) return false
        const existingId = findTrackIdInLibraryByMeta(String(track.title || ''), String(track.artist || ''))
        if (existingId) {
          targetTrackIds.push(existingId)
          return false
        }
        return true
      })
      let added = 0
      for (const track of tracksToImport) {
        const created = await handleLinkAdd(
          {
            audioUrl: String(track.url || ''),
            title: String(track.title || ''),
            artist: String(track.artist || ''),
            coverUrl: String(track.coverUrl || ''),
          },
          { keepModalOpen: true, suppressNotice: true },
        )
        if (Array.isArray(created) && created.length) {
          added += created.length
          for (const createdTrack of created) {
            const createdId = String(createdTrack?.id || '').trim()
            if (createdId) targetTrackIds.push(createdId)
          }
        }
      }
      const uniqueTrackIds = Array.from(new Set(targetTrackIds.filter(Boolean)))
      if (uniqueTrackIds.length) {
        createImportedPlaylist(
          String(playlist?.title || 'YouTube playlist').trim() || 'YouTube playlist',
          String(playlist?.description || '').trim(),
          uniqueTrackIds,
        )
      }
      showUploadNotice(`${playlist?.title || 'Playlist'} içinden ${added} şarkı eklendi.`)
    } catch (error) {
      showUploadNotice(`Playlist içe aktarılamadı: ${String(error?.message || error || 'Hata')}`)
    } finally {
      setYoutubeImportingPlaylistId('')
    }
  }, [createImportedPlaylist, findTrackIdInLibraryByMeta, showUploadNotice])

  const handleTopbarArtistSearch = () => {
    const query = String(topbarYoutubeQuery || '').trim()
    if (!query) {
      setTopbarYoutubeError('Önce sanatçı adı yaz.')
      return
    }
    openArtistProfile(query)
  }

  const handleTopbarYouTubeDirectAdd = async (pickedItem = null) => {
    const item = pickedItem || topbarYoutubeResults[0]
    if (!item?.url) {
      showUploadNotice('Önce YouTube sonucu seç veya ara.')
      return
    }
    const itemId = String(item.id || item.url || '')
    if (itemId && topbarYoutubeAddedIds.has(itemId)) {
      return
    }
    setTopbarYoutubeAddingIds((prev) => {
      const next = new Set(prev)
      if (itemId) next.add(itemId)
      return next
    })
    const created = await handleLinkAdd(
      {
        audioUrl: String(item.url || ''),
        title: String(item.title || ''),
        artist: String(item.artist || ''),
        coverUrl: String(item.coverUrl || item.thumbnail || '').trim(),
      },
      { keepModalOpen: false, suppressNotice: false },
    )
    setTopbarYoutubeAddingIds((prev) => {
      const next = new Set(prev)
      if (itemId) next.delete(itemId)
      return next
    })
    if (Array.isArray(created) && created.length) {
      setTopbarYoutubeAddedIds((prev) => {
        const next = new Set(prev)
        if (itemId) {
          next.add(itemId)
        }
        return next
      })
    }
  }

  const handleLinkAdd = async (overrides = null, options = null) => {
    const keepModalOpen =
      typeof options?.keepModalOpen === 'boolean' ? options.keepModalOpen : addMode === 'link'
    const suppressNotice = Boolean(options?.suppressNotice)
    const overrideTitle = cleanFilenameTrackTitle(String(overrides?.title || '')) || ''
    const overrideArtist = sanitizeDisplayText(String(overrides?.artist || '')).trim()
    const overrideCoverUrl = normalizeDriveUrl(String(overrides?.coverUrl || ''))
    const overrideUrl = normalizeDriveUrl(String(overrides?.audioUrl || ''))
    const draftTitle = overrideTitle || cleanFilenameTrackTitle(linkDraft.title) || ''
    const draftArtist = overrideArtist || sanitizeDisplayText(linkDraft.artist).trim()
    const audioUrl = overrideUrl || normalizeDriveUrl(linkDraft.audioUrl)
    const coverUrlInput = overrideCoverUrl || normalizeDriveUrl(linkDraft.coverUrl)

    if (!audioUrl) {
      if (!suppressNotice) showUploadNotice('Link gerekli.')
      return []
    }

    const shouldDownloadToLibrary =
      !/drive\.google\.com|drive\.usercontent\.google\.com/i.test(audioUrl) &&
      !isLikelyDirectAudioUrl(audioUrl)
    const createTrackFromResolvedSource = async ({
      resolvedAudioUrl = '',
      resolvedFileName = '',
      resolvedSizeLabel = '',
      resolvedSource = 'link',
      titleOverride = '',
      artistOverride = '',
      albumOverride = '',
      coverOverride = '',
      skipRemoteMeta = false,
      orderOffset = 0,
    }) => {
      const fallbackName = getFileNameFromUrl(resolvedFileName || resolvedAudioUrl)
      const parsedName = parseTrackName(fallbackName || '')
      let title =
        cleanFilenameTrackTitle(titleOverride || draftTitle || parsedName.title || '') || 'Bilinmeyen parça'
      let artist =
        sanitizeDisplayText(artistOverride || draftArtist || parsedName.artist || '').trim() ||
        'Yerel Koleksiyon'
      let album = sanitizeDisplayText(String(albumOverride || '').trim()) || ''
      let durationValue = 0
      try {
        durationValue = await readDuration(resolvedAudioUrl)
      } catch {
        durationValue = 0
      }
      let inferredIdentity = null
      const needsArtistInference =
        (!artist || artist === 'Yerel Koleksiyon') &&
        Boolean(title)

      if (needsArtistInference) {
        try {
          inferredIdentity = await inferTrackIdentityFromTitle(title)
          if (inferredIdentity?.artist) {
            artist = inferredIdentity.artist
          }
          if (inferredIdentity?.title) {
            title = cleanFilenameTrackTitle(inferredIdentity.title) || title
          }
          if (!album && inferredIdentity?.album) {
            album = inferredIdentity.album
          }
        } catch {
          inferredIdentity = null
        }
      }

      const lyricsProbePromise = withTimeout(
        fetchLyricsForTrack({
          id: `lyrics-probe-link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          artist,
          album: String(album || '').trim() || 'Single',
          audioUrl: resolvedAudioUrl,
        }),
        ENRICHMENT_TIMEOUT_MS,
        '',
      )

      let remoteCoverUrl = coverUrlInput || String(coverOverride || '').trim()
      let resolvedGenre = ''
      if (!skipRemoteMeta && title && artist && artist !== 'Yerel Koleksiyon') {
        let cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
        let remoteMeta = await withTimeout(
          (async () => {
            let nextMeta = await fetchRemoteTrackMetaSmart(title, artist, {
              preferredAlbum: album || inferredIdentity?.album || '',
              preferredDuration: Number(durationValue || 0),
            })
            if (nextMeta?.swapped) {
              const swappedTitle = cleanFilenameTrackTitle(artist) || title
              const swappedArtist = sanitizeDisplayText(title) || artist
              title = swappedTitle
              artist = swappedArtist
              cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
            }
            if (
              (!nextMeta?.coverUrl || !nextMeta?.album || String(nextMeta.album).trim().toLowerCase() === 'single') &&
              title
            ) {
              try {
                const fallbackIdentity = await inferTrackIdentityFromTitle(title)
                const fallbackArtistMatches = areArtistsCompatible(
                  artist,
                  String(fallbackIdentity?.artist || ''),
                )
                if (fallbackArtistMatches) {
                  nextMeta = {
                    ...nextMeta,
                    coverUrl: nextMeta?.coverUrl || fallbackIdentity?.coverUrl || '',
                    album: String(nextMeta?.album || '').trim() || String(fallbackIdentity?.album || '').trim(),
                  }
                }
              } catch {
                // ignore fallback lookup errors
              }
            }
            if (!nextMeta?.coverUrl) {
              const insightFallback = await fillCoverFromAlbumInsight({
                title,
                artist,
                album: String(nextMeta?.album || album || inferredIdentity?.album || '').trim(),
                coverUrl: String(nextMeta?.coverUrl || inferredIdentity?.coverUrl || '').trim(),
              })
              nextMeta = {
                ...nextMeta,
                coverUrl: String(insightFallback.coverUrl || nextMeta?.coverUrl || '').trim(),
                album: String(insightFallback.album || nextMeta?.album || '').trim(),
              }
            }
            return nextMeta
          })(),
          ENRICHMENT_TIMEOUT_MS,
          { coverUrl: '', album: String(album || inferredIdentity?.album || '').trim(), genre: '' },
        )
        remoteCoverUrl =
          coverUrlInput ||
          remoteCoverUrl ||
          remoteMeta?.coverUrl ||
          inferredIdentity?.coverUrl ||
          ''
        resolvedGenre = normalizeGenreName(remoteMeta?.genre || '')
        if (!album && remoteMeta?.album) {
          album = String(remoteMeta.album).trim()
        }
        if (!album && inferredIdentity?.album) {
          album = String(inferredIdentity.album).trim()
        }
        setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
        setLruCacheValue(
          albumCacheRef.current,
          cacheKey,
          String(remoteMeta.album || inferredIdentity?.album || '').trim(),
          MAX_ALBUM_CACHE_ENTRIES,
        )
        setLruCacheValue(
          genreCacheRef.current,
          cacheKey,
          normalizeGenreName(remoteMeta?.genre || resolvedGenre || ''),
          MAX_GENRE_CACHE_ENTRIES,
        )
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
      }

      // Sözler bulunmasa bile parça eklensin; sözler arka planda tekrar aranır.
      let lyricsText = ''
      try {
        lyricsText = normalizeLyricsText(await lyricsProbePromise)
      } catch {
        lyricsText = ''
      }
      const lyricsCacheKey = getLyricsCacheKeyForTrack({
        title,
        artist,
      })
      if (lyricsText && lyricsCacheKey) {
        setLruCacheValue(lyricsCacheRef.current, lyricsCacheKey, lyricsText, MAX_LYRICS_CACHE_ENTRIES)
        saveJsonCache(LYRICS_CACHE_KEY, lyricsCacheRef.current)
      }

      return {
        id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${orderOffset}`,
        title,
        artist,
        album: String(album || '').trim() || 'Single',
        genre: resolvedGenre,
        fileName: resolvedFileName || '',
        size: resolvedSizeLabel || '',
        duration: durationValue,
        gradient: gradients[(tracks.length + orderOffset) % gradients.length],
        audioUrl: resolvedAudioUrl,
        coverBlob: null,
        coverUrl: remoteCoverUrl,
        coverRemoteUrl: remoteCoverUrl,
        coverTone: '',
        coverName: coverUrlInput ? 'Bağlantı kapağı' : '',
        isFavorite: false,
        createdAt: Date.now(),
        order: Math.max(-1, ...allTracks.map((track, index) => getTrackSortValue(track, index))) + 1 + orderOffset,
        source: resolvedSource,
        metadataLocked: true,
        lyricsLocal: lyricsText,
      }
    }

    const createdTracks = []
    const existingSignatures = new Set(allTracks.map(getTrackSignature))

    if (shouldDownloadToLibrary) {
      if (!window.novaPlayer?.downloadLinkToLibrary) {
        if (!suppressNotice) showUploadNotice('Bu sürümde link indirici desteği yok.')
        return []
      }

      const requestId = `link-download-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      if (!suppressNotice) showUploadNotice('Link indiriliyor, lütfen bekle...')
      const downloadResult = await window.novaPlayer.downloadLinkToLibrary({
        requestId,
        url: audioUrl,
        title: draftTitle,
        artist: draftArtist,
        fileName: `${draftArtist || 'Artist'} - ${draftTitle || 'Track'}.mp3`,
      })

      if (!downloadResult?.ok) {
        const reason = String(downloadResult?.reason || '')
        const rawError = String(downloadResult?.error || '').trim()
        if (reason === 'yt-dlp-binary-missing') {
          if (!suppressNotice) showUploadNotice('Dahili indirici dosyaları bulunamadı. Uygulamayı yeniden kurmayı dene.')
        } else if (reason === 'yt-dlp-unavailable-or-failed') {
          if (!suppressNotice) showUploadNotice(
            rawError
              ? `Link indirilemedi: ${rawError}`
              : 'Link indirilemedi. Dahili indirici başlatılamadı.',
          )
        } else {
          if (!suppressNotice) showUploadNotice(rawError ? `Link indirilemedi: ${rawError}` : 'Link indirilemedi.')
        }
        return []
      }

      const downloadedTracks = Array.isArray(downloadResult.tracks) && downloadResult.tracks.length
        ? downloadResult.tracks
        : [
            {
              fileUrl: String(downloadResult.fileUrl || ''),
              filePath: String(downloadResult.filePath || ''),
              fileName: String(downloadResult.fileName || ''),
              size: Number(downloadResult.size || 0),
            },
          ]

      for (const [index, item] of downloadedTracks.entries()) {
        let resolvedAudioUrl = String(item?.fileUrl || '').trim()
        if (!resolvedAudioUrl && window.novaPlayer?.resolveLocalTrackUrls) {
          try {
            const localPath = String(item?.filePath || '').trim()
            const localFileName =
              String(item?.fileName || '').trim() ||
              (localPath ? localPath.split(/[\\/]/).pop() || '' : '')
            if (localFileName) {
              const bridge = await window.novaPlayer.resolveLocalTrackUrls({
                tracks: [
                  {
                    id: `resolve-${Date.now()}-${index}`,
                    fileName: localFileName,
                    audioUrl: localPath.startsWith('file://') ? localPath : '',
                  },
                ],
              })
              const resolvedMap = bridge?.ok && bridge?.resolved ? bridge.resolved : null
              if (resolvedMap && typeof resolvedMap === 'object') {
                const candidate = Object.values(resolvedMap)[0]
                if (typeof candidate === 'string' && candidate.trim()) {
                  resolvedAudioUrl = candidate.trim()
                }
              }
            }
          } catch {
            // ignore local url resolution failures; handled by fallback below
          }
        }
        if (!resolvedAudioUrl) {
          continue
        }
        const sizeInBytes = Number(item?.size || 0)
        let nextTrack = null
        try {
          nextTrack = await createTrackFromResolvedSource({
            resolvedAudioUrl,
            resolvedFileName: String(item?.fileName || '').trim(),
            resolvedSizeLabel: sizeInBytes > 0 ? `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB` : '',
            resolvedSource: 'local',
            titleOverride: String(draftTitle || item?.title || '').trim(),
            artistOverride: String(draftArtist || item?.artist || '').trim(),
            albumOverride: String(item?.album || '').trim(),
            coverOverride: String(item?.coverUrl || '').trim(),
            skipRemoteMeta: false,
            orderOffset: index,
          })
        } catch {
          const fallbackName = String(item?.fileName || '').trim() || getFileNameFromUrl(resolvedAudioUrl)
          const parsed = parseTrackName(fallbackName)
          nextTrack = {
            id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
            title: cleanFilenameTrackTitle(String(draftTitle || parsed.title || 'Bilinmeyen parça')) || 'Bilinmeyen parça',
            artist: sanitizeDisplayText(String(draftArtist || parsed.artist || 'Yerel Koleksiyon')).trim() || 'Yerel Koleksiyon',
            album: 'Single',
            genre: '',
            fileName: fallbackName,
            size: sizeInBytes > 0 ? `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB` : '',
            duration: 0,
            gradient: gradients[(tracks.length + index) % gradients.length],
            audioUrl: resolvedAudioUrl,
            coverBlob: null,
            coverUrl: '',
            coverRemoteUrl: '',
            coverTone: '',
            coverName: '',
            isFavorite: false,
            createdAt: Date.now(),
            order: Math.max(-1, ...allTracks.map((track, trackIndex) => getTrackSortValue(track, trackIndex))) + 1 + index,
            source: 'local',
            metadataLocked: true,
            lyricsLocal: '',
          }
        }
        if (!nextTrack) {
          continue
        }
        const signature = getTrackSignature(nextTrack)
        if (existingSignatures.has(signature)) {
          continue
        }
        existingSignatures.add(signature)
        createdTracks.push(nextTrack)
      }
    } else {
      const nextTrack = await createTrackFromResolvedSource({
        resolvedAudioUrl: audioUrl,
        resolvedFileName: getFileNameFromUrl(audioUrl),
        resolvedSizeLabel: '',
        resolvedSource: 'link',
        orderOffset: 0,
      })
      if (!nextTrack) {
        if (!suppressNotice) showUploadNotice('Parça eklenemedi.')
        return []
      }
      const signature = getTrackSignature(nextTrack)
      if (existingSignatures.has(signature)) {
        if (!suppressNotice) showUploadNotice(`${nextTrack.artist} - ${nextTrack.title} zaten ekli.`)
        return []
      }
      createdTracks.push(nextTrack)
    }

    if (!createdTracks.length) {
      if (!suppressNotice) {
        showUploadNotice(
          shouldDownloadToLibrary
            ? 'İndirme tamamlandı ancak parça adresi çözülemediği için listeye eklenemedi.'
            : 'Eklenecek yeni parça bulunamadı.',
        )
      }
      return []
    }

    setTracks((prev) => [...prev, ...createdTracks])
    if (!keepModalOpen) {
      closeAddModal()
    }
    if (!suppressNotice) {
      showUploadNotice(
        createdTracks.length > 1
          ? `${createdTracks.length} parça eklendi.`
          : 'Bağlantı eklendi.',
      )
    }
    if (!suppressNotice && addMode === 'link') {
      setLinkAddSuccessSignature(getLinkDraftSignature(linkDraft))
    }
    return createdTracks
  }

  const createTrackShareLink = useCallback((track) => {
    if (!track) return ''
    const params = new URLSearchParams()
    const id = String(track.id || '').trim()
    const title = cleanFilenameTrackTitle(String(track.title || '').trim())
    const artist = sanitizeDisplayText(String(track.artist || '').trim())
    const audioUrl = String(track.audioUrl || '').trim()
    if (id) params.set('id', id)
    if (title) params.set('title', title)
    if (artist) params.set('artist', artist)
    if (audioUrl && !audioUrl.startsWith('file://')) {
      params.set('url', audioUrl)
    }
    return `glitchmusic://play?${params.toString()}`
  }, [])

  const copyTrackShareLink = useCallback(async (track) => {
    const link = createTrackShareLink(track)
    if (!link) {
      showUploadNotice('Paylaşım linki oluşturulamadı.')
      return
    }
    try {
      if (window?.novaPlayer?.copyText) {
        const result = await window.novaPlayer.copyText({ text: link })
        if (!result?.ok) {
          throw new Error(String(result?.reason || 'copy-failed'))
        }
      } else if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        throw new Error('clipboard-unavailable')
      }
      showUploadNotice('Paylaşım linki kopyalandı. Discorda yapıştırabilirsin.')
    } catch {
      showUploadNotice('Link kopyalanamadı.')
    }
  }, [createTrackShareLink, showUploadNotice])

  const handleIncomingDeepLink = useCallback(async (payload) => {
    if (!payload || String(payload.action || '').toLowerCase() !== 'play') {
      return
    }
    const incomingId = String(payload.id || '').trim()
    const incomingTitle = cleanFilenameTrackTitle(String(payload.title || '').trim())
    const incomingArtist = sanitizeDisplayText(String(payload.artist || '').trim())
    const incomingUrl = String(payload.audioUrl || '').trim()

    let targetTrack = null
    if (incomingId) {
      targetTrack = allTracks.find((track) => String(track.id || '').trim() === incomingId) || null
    }
    if (!targetTrack && incomingUrl) {
      targetTrack =
        allTracks.find((track) => String(track.audioUrl || '').trim() === incomingUrl) || null
    }
    if (!targetTrack && incomingTitle) {
      targetTrack =
        allTracks.find((track) => {
          const titleMatch = normalizeCoverMatchText(track.title || '') === normalizeCoverMatchText(incomingTitle)
          if (!titleMatch) return false
          if (!incomingArtist) return true
          return doesArtistMatch(track.artist || '', incomingArtist)
        }) || null
    }

    if (targetTrack) {
      switchTrackRef.current?.(targetTrack, true, { restartIfSame: true, enforceCooldown: false })
      setIsPlaying(true)
      return
    }

    if (incomingUrl) {
      const created = await handleLinkAdd(
        {
          audioUrl: incomingUrl,
          title: incomingTitle,
          artist: incomingArtist,
        },
        { keepModalOpen: true, suppressNotice: true },
      )
      const first = Array.isArray(created) ? created[0] : null
      if (first?.id) {
        switchTrackRef.current?.(first, true, { restartIfSame: true, enforceCooldown: false })
        setIsPlaying(true)
      }
    }
  }, [allTracks, handleLinkAdd, setIsPlaying])

  const handleIncomingDeepLinkRef = useRef(handleIncomingDeepLink)
  useEffect(() => {
    handleIncomingDeepLinkRef.current = handleIncomingDeepLink
  }, [handleIncomingDeepLink])

  useEffect(() => {
    let detach = null
    const init = async () => {
      if (window?.novaPlayer?.getPendingDeepLink) {
        const payload = await window.novaPlayer.getPendingDeepLink()
        if (payload) {
          handleIncomingDeepLinkRef.current?.(payload)
        }
      }
      if (window?.novaPlayer?.onDeepLink) {
        detach = window.novaPlayer.onDeepLink((payload) => {
          handleIncomingDeepLinkRef.current?.(payload)
        })
      }
    }
    init()
    return () => {
      if (typeof detach === 'function') detach()
    }
  }, [])

  const handlePoolUpload = async () => {
    const title = cleanFilenameTrackTitle(poolDraft.title) || ''
    const artist = poolDraft.artist.trim()
    const audioFile = poolDraft.audioFile
    const coverFile = poolDraft.coverFile

    if (!title || !artist || !audioFile) {
      showUploadNotice('Başlık, sanatçı ve şarkı dosyası gerekli.')
      return
    }

    try {
      const duration = await readDuration(URL.createObjectURL(audioFile))

      const formData = new FormData()
      formData.append('audio', audioFile)
      formData.append('title', title)
      formData.append('artist', artist)
      formData.append('duration', duration)
      if (coverFile) {
        formData.append('cover', coverFile)
      }

      const response = await fetch(`${API_BASE}/api/tracks`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        showUploadNotice('Havuza yükleme başarısız oldu.')
        return
      }

      const data = await response.json()
      if (data.track) {
        const track = data.track
        const normalizedTrack = normalizeDriveTrack(track, 'pool', '')
        setServerTracks((prev) => [normalizedTrack, ...prev])
        closeAddModal()
        showUploadNotice(`${artist} - ${title} başarıyla havuza yüklendi.`)
      }
    } catch (error) {
      showUploadNotice('Havuza yükleme sırasında hata oluştu.')
    }
  }

  const poolAdminManifestJson = useMemo(
    () =>
      JSON.stringify(
        {
          tracks: poolAdminTracks
            .map((track) => {
              const title = cleanFilenameTrackTitle(String(track.title || '').trim())
              const artist = sanitizeDisplayText(String(track.artist || '').trim())
              const downloadUrl = normalizeDriveUrl(String(track.downloadUrl || '').trim())
              const coverUrl = normalizeDriveUrl(String(track.coverUrl || '').trim())
              if (!downloadUrl) {
                return null
              }

              const hasMetadata = Boolean(title || artist || coverUrl)
              if (!hasMetadata) {
                return downloadUrl
              }

              return {
                ...(title ? { title } : {}),
                ...(artist ? { artist } : {}),
                downloadUrl,
                ...(coverUrl ? { coverUrl } : {}),
              }
            })
            .filter(Boolean),
        },
        null,
        2,
      ),
    [poolAdminTracks],
  )

  const poolAdminArtistSuggestions = useMemo(() => {
    const suggestions = new Set()

    for (const track of [...tracks, ...serverTracks, ...poolAdminTracks]) {
      const normalizedArtists = extractArtistCandidates(String(track?.artist || ''))
      if (normalizedArtists.length) {
        normalizedArtists.forEach((artist) => suggestions.add(artist))
      } else {
        const artist = sanitizeDisplayText(String(track?.artist || '').trim())
        if (artist) {
          suggestions.add(artist)
        }
      }
    }

    return Array.from(suggestions).sort((a, b) => a.localeCompare(b, 'tr-TR'))
  }, [poolAdminTracks, serverTracks, tracks])

  const filteredPoolAdminTracks = useMemo(() => {
    const query = sanitizeDisplayText(String(poolAdminSearchQuery || '').toLowerCase().trim())
    if (!query) {
      return poolAdminTracks
    }

    return poolAdminTracks.filter((track) => {
      const artist = sanitizeDisplayText(String(track.artist || '').toLowerCase())
      const title = sanitizeDisplayText(String(track.title || '').toLowerCase())
      const link = String(track.downloadUrl || '').toLowerCase()
      return artist.includes(query) || title.includes(query) || link.includes(query)
    })
  }, [poolAdminSearchQuery, poolAdminTracks])

  const loadPoolAdminTracksFromGithub = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = Date.now()
      poolAdminLoadRequestRef.current = requestId
      setPoolAdminLoading(true)
      if (!silent) {
        setPoolAdminNotice("GitHub'dan tracks.json yükleniyor...")
      }

      const owner = String(poolGithubOwner || '').trim()
      const repo = String(poolGithubRepo || '').trim()
      const branch = String(poolGithubBranch || '').trim() || 'main'
      const path = String(poolGithubPath || '').trim().replace(/^\/+/, '') || 'tracks.json'
      const token = String(poolGithubToken || '').trim()

      try {
        let payload = null

        if (owner && repo && path) {
          const encodedPath = path
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/')
          const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
          const headers = {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          }
          if (token) {
            headers.Authorization = `Bearer ${token}`
          }

          const response = await fetch(endpoint, { headers })
          if (!response.ok) {
            const errorText = await response.text().catch(() => '')
            throw new Error(`GitHub verisi okunamadı (${response.status})${errorText ? `: ${errorText}` : ''}`)
          }
          const json = await response.json()
          const content = typeof json?.content === 'string' ? json.content : ''
          if (!content) {
            throw new Error('GitHub dosya içeriği boş.')
          }
          payload = JSON.parse(decodeUtf8FromBase64(content))
        } else {
          const fallbackUrl = String(sharedManifestUrl || '').trim()
          if (!fallbackUrl) {
            throw new Error('GitHub owner/repo/path eksik ve yedek manifest URL yok.')
          }
          const response = await fetch(normalizeDriveUrl(fallbackUrl), { cache: 'no-store' })
          if (!response.ok) {
            throw new Error(`Manifest alınamadı (${response.status}).`)
          }
          payload = await response.json()
        }

        const parsed = parsePoolManifestTracks(payload)
        if (poolAdminLoadRequestRef.current !== requestId) {
          return
        }
        setPoolAdminTracks(parsed.map((track) => createPoolEditorTrack(track)))
        if (!silent) {
          setPoolAdminNotice(`GitHub'dan ${parsed.length} şarkı yüklendi.`)
        }
      } catch (error) {
        if (poolAdminLoadRequestRef.current !== requestId) {
          return
        }
        const message = error instanceof Error ? error.message : "GitHub'dan veri alınamadı."
        setPoolAdminNotice(message || "GitHub'dan veri alınamadı.")
      } finally {
        if (poolAdminLoadRequestRef.current === requestId) {
          setPoolAdminLoading(false)
        }
      }
    },
    [poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken, sharedManifestUrl],
  )

  const openPoolAdminPanel = useCallback(() => {
    setPoolAdminOpen(true)
    setPoolAdminUnlocked(false)
    setPoolAdminPasswordInput('')
    setPoolAdminAuthError('')
    setPoolAdminNotice('')
    setPoolAdminSearchQuery('')
    setPoolAdminTracks([])
    loadPoolAdminTracksFromGithub({ silent: true })
  }, [loadPoolAdminTracksFromGithub])

  const closePoolAdminPanel = useCallback(() => {
    setPoolAdminOpen(false)
    setPoolAdminUnlocked(false)
    setPoolAdminPasswordInput('')
    setPoolAdminAuthError('')
    setPoolAdminNotice('')
    setPoolAdminSearchQuery('')
  }, [])

  const unlockPoolAdminPanel = useCallback(() => {
    const normalizedPassword = String(poolAdminPasswordInput || '').trim()
    if (!normalizedPassword) {
      setPoolAdminAuthError('Şifre boş olamaz.')
      return
    }

    if (normalizedPassword === POOL_ADMIN_PASSWORD) {
      setPoolAdminUnlocked(true)
      setPoolAdminAuthError('')
      return
    }
    setPoolAdminAuthError('Şifre yanlış.')
  }, [poolAdminPasswordInput])

  useEffect(() => {
    if (!poolAdminOpen || poolAdminUnlocked) {
      return
    }
    const timer = window.setTimeout(() => {
      poolAdminPasswordInputRef.current?.focus()
      poolAdminPasswordInputRef.current?.select()
    }, 40)
    return () => window.clearTimeout(timer)
  }, [poolAdminOpen, poolAdminUnlocked])

  useEffect(() => {
    if (!poolAdminOpen || !poolAdminUnlocked) {
      return
    }
    const timer = window.setTimeout(() => {
      const grid = poolAdminGridRef.current
      if (!grid) {
        return
      }
      grid.scrollTop = grid.scrollHeight
    }, 40)
    return () => window.clearTimeout(timer)
  }, [poolAdminOpen, poolAdminUnlocked])

  const addPoolAdminTrack = useCallback(() => {
    setPoolAdminTracks((prev) => [...prev, createPoolEditorTrack({})])
  }, [])

  const updatePoolAdminTrack = useCallback((id, field, value) => {
    setPoolAdminTracks((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }, [])

  const removePoolAdminTrack = useCallback((id) => {
    setPoolAdminTracks((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const downloadPoolManifestJson = useCallback(() => {
    try {
      const blob = new Blob([`${poolAdminManifestJson}\n`], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'tracks.json'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setPoolAdminNotice('tracks.json indirildi.')
    } catch {
      setPoolAdminNotice('Dosya indirme başarısız oldu.')
    }
  }, [poolAdminManifestJson])

  const publishPoolManifestToGithub = useCallback(async () => {
    const owner = String(poolGithubOwner || '').trim()
    const repo = String(poolGithubRepo || '').trim()
    const branch = String(poolGithubBranch || '').trim() || 'main'
    const path = String(poolGithubPath || '').trim().replace(/^\/+/, '') || 'tracks.json'
    const token = String(poolGithubToken || '').trim()

    if (!owner || !repo || !path || !token) {
      setPoolAdminNotice('GitHub kaydı için owner, repo, branch, path ve token gerekli.')
      return
    }

    const localTracks = poolAdminTracks.map((track) => normalizePoolManifestTrack(track)).filter(Boolean)

    setPoolGithubSaving(true)
    try {
      const encodedPath = path
        .split('/')
        .filter(Boolean)
        .map((item) => encodeURIComponent(item))
        .join('/')
      const endpoint = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`

      const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      }

      const readGithubError = async (response) => {
        let detail = ''
        try {
          const json = await response.json()
          detail = String(json?.message || '').trim()
        } catch {
          // ignore body parse issues
        }
        return detail
      }

      let success = false

      for (let attempt = 0; attempt < 3; attempt += 1) {
        let sha = ''

        const currentFileResponse = await fetch(`${endpoint}?ref=${encodeURIComponent(branch)}`, { headers })
        if (currentFileResponse.ok) {
          const currentFile = await currentFileResponse.json()
          sha = String(currentFile?.sha || '')
        } else if (currentFileResponse.status !== 404) {
          const detail = await readGithubError(currentFileResponse)
          throw new Error(
            `GitHub GET hatası (${currentFileResponse.status})${detail ? `: ${detail}` : ''}`,
          )
        }
        const payload = {
          message: `Update tracks.json from GLITCH Music admin panel (${localTracks.length} track)`,
          branch,
          content: encodeUtf8ToBase64(
            `${JSON.stringify({ tracks: localTracks }, null, 2)}\n`,
          ),
          ...(sha ? { sha } : {}),
        }

        const updateResponse = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (updateResponse.ok) {
          success = true
          break
        }

        const detail = await readGithubError(updateResponse)
        const isRetryableConflict =
          updateResponse.status === 409 ||
          (updateResponse.status === 422 && /sha|update is not a fast forward/i.test(detail))
        if (isRetryableConflict && attempt < 2) {
          continue
        }

        throw new Error(
          `GitHub PUT hatası (${updateResponse.status})${detail ? `: ${detail}` : ''}`,
        )
      }

      if (!success) {
        throw new Error('GitHub kaydı sırasında çakışma oluştu. Tekrar dene.')
      }
      setPoolAdminNotice(`tracks.json güncellendi. Toplam ${localTracks.length} şarkı kaydedildi.`)
    } catch (error) {
      const message = String(error?.message || '').trim()
      const fallback = 'GitHub kaydı başarısız oldu. Token yetkisini ve repo bilgisini kontrol et.'
      setPoolAdminNotice(message || fallback)
    } finally {
      setPoolGithubSaving(false)
    }
  }, [poolAdminTracks, poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken])

  const persistPoolGithubPrefs = useCallback(
    (patch = {}) => {
      const currentPrefs = loadUiPrefs()
      const nextPrefs = {
        ...currentPrefs,
        poolGithubOwner:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubOwner')
            ? patch.poolGithubOwner
            : poolGithubOwner,
        poolGithubRepo:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubRepo')
            ? patch.poolGithubRepo
            : poolGithubRepo,
        poolGithubBranch:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubBranch')
            ? patch.poolGithubBranch
            : poolGithubBranch,
        poolGithubPath:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubPath')
            ? patch.poolGithubPath
            : poolGithubPath,
        poolGithubToken:
          Object.prototype.hasOwnProperty.call(patch, 'poolGithubToken')
            ? patch.poolGithubToken
            : poolGithubToken,
      }
      saveUiPrefs(nextPrefs)
    },
    [poolGithubBranch, poolGithubOwner, poolGithubPath, poolGithubRepo, poolGithubToken],
  )

  const downloadPoolTrackToLibrary = useCallback(
    async (track, options = {}) => {
      const {
        suppressNotice = false,
        bypassBusy = false,
      } = options
      if (!track?.audioUrl || (!bypassBusy && (poolDownloadingTrackId || poolBulkDownloading))) {
        return
      }

      const title = String(track.title || '').trim() || 'Adsız parça'
      const artist = String(track.artist || '').trim() || 'Bilinmeyen sanatçı'
      const normalizedAudioUrl = normalizeDriveUrl(track.audioUrl || '')
      const normalizedCoverUrl = normalizeDriveUrl(track.coverUrl || '')
      const requestId = `pool-download-${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      upsertDownloadJob({
        requestId,
        status: 'starting',
        receivedBytes: 0,
        totalBytes: 0,
        title,
        artist,
      })

      setPoolDownloadingTrackId(track.id)
      try {
        let audioFile = null
        let localFileAudioUrl = ''
        let blobSize = 0
        const safeBase = `${artist} - ${title}`.replace(/[\\/:*?"<>|]+/g, ' ').trim() || `track-${Date.now()}`

        if (typeof window !== 'undefined' && window.novaPlayer?.downloadRemoteAssetToLibrary) {
          const bridgeResult = await window.novaPlayer.downloadRemoteAssetToLibrary({
            requestId,
            url: normalizedAudioUrl,
            fileName: `${safeBase}.mp3`,
            title,
            artist,
          })
          if (bridgeResult?.ok && bridgeResult.fileUrl) {
            localFileAudioUrl = String(bridgeResult.fileUrl)
            blobSize = Number(bridgeResult.size || 0)
          } else {
            if (bridgeResult?.reason === 'aborted') {
              return
            }
            throw new Error(`bridge_download_to_library_failed:${String(bridgeResult?.reason || 'unknown')}`)
          }
        } else if (typeof window !== 'undefined' && window.novaPlayer?.downloadRemoteAsset) {
          const bridgeResult = await window.novaPlayer.downloadRemoteAsset({
            url: normalizedAudioUrl,
            fileName: `${safeBase}.mp3`,
          })
          if (!bridgeResult?.ok || !Array.isArray(bridgeResult.bytes) || !bridgeResult.bytes.length) {
            throw new Error('bridge_download_failed')
          }

          const ext = String(bridgeResult.extension || '.mp3').replace(/[^a-z0-9.]/gi, '') || '.mp3'
          const finalName = `${safeBase}${ext.startsWith('.') ? ext : `.${ext}`}`
          const byteArray = new Uint8Array(bridgeResult.bytes)
          const blob = new Blob([byteArray], {
            type: bridgeResult.contentType || 'audio/mpeg',
          })
          blobSize = blob.size || 0
          audioFile =
            typeof File === 'function'
              ? new File([blob], finalName, { type: blob.type || 'audio/mpeg' })
              : blob
          upsertDownloadJob({
            requestId,
            status: 'downloading',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
        } else {
          const response = await fetch(normalizedAudioUrl, { cache: 'no-store' })
          if (!response.ok) {
            throw new Error('download_failed')
          }
          const blob = await response.blob()
          blobSize = blob.size || 0
          const guessedExt =
            /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(normalizedAudioUrl)?.[1]?.toLowerCase() || 'mp3'
          const fileName = `${safeBase}.${guessedExt}`
          audioFile =
            typeof File === 'function'
              ? new File([blob], fileName, { type: blob.type || 'audio/mpeg' })
              : blob
          upsertDownloadJob({
            requestId,
            status: 'downloading',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
        }

        if (!audioFile && !localFileAudioUrl) {
          throw new Error('audiofile-missing')
        }

        const audioUrl = localFileAudioUrl || URL.createObjectURL(audioFile)
        const durationValue = Number(track.duration || 0) || (await readDuration(audioUrl))
        const signature = getTrackSignature({
          title,
          artist,
          size: blobSize ? `${(blobSize / 1024 / 1024).toFixed(1)} MB` : '',
          duration: durationValue,
        })

        if (allTracks.some((item) => getTrackSignature(item) === signature)) {
          if (!localFileAudioUrl) {
            URL.revokeObjectURL(audioUrl)
          }
          if (!suppressNotice) {
            showUploadNotice(`${artist} - ${title} zaten kütüphanende var.`)
          }
          upsertDownloadJob({
            requestId,
            status: 'completed',
            receivedBytes: blobSize,
            totalBytes: blobSize,
            title,
            artist,
          })
          return
        }

        if (!localFileAudioUrl) {
          assetUrlsRef.current.push(audioUrl)
        }
        let resolvedCoverUrl = normalizedCoverUrl
        let resolvedAlbum = String(track.album || '').trim() || 'Single'
        let resolvedGenre = normalizeGenreName(track.genre || '')
        if (title && artist && artist !== 'Yerel Koleksiyon') {
          const cacheKey = `${normalizeArtistQuery(artist)}|${title}`.toLowerCase()
          const cachedCover = String(getLruCacheValue(coverArtCacheRef.current, cacheKey) || '').trim()
          const cachedAlbum = String(getLruCacheValue(albumCacheRef.current, cacheKey) || '').trim()
          const cachedGenre = normalizeGenreName(getLruCacheValue(genreCacheRef.current, cacheKey) || '')
          if (!resolvedCoverUrl && cachedCover) {
            resolvedCoverUrl = cachedCover
          }
          if ((!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') && cachedAlbum) {
            resolvedAlbum = cachedAlbum
          }
          if (!resolvedGenre && cachedGenre) {
            resolvedGenre = cachedGenre
          }
          if (!resolvedCoverUrl || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single' || !resolvedGenre) {
            try {
              const remoteMeta = await fetchRemoteTrackMetaSmart(title, artist, {
                preferredAlbum: resolvedAlbum,
                preferredDuration: Number(durationValue || 0),
              })
              if (!resolvedCoverUrl && remoteMeta?.coverUrl) {
                resolvedCoverUrl = remoteMeta.coverUrl
              }
              if (
                (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                remoteMeta?.album
              ) {
                resolvedAlbum = String(remoteMeta.album).trim()
              }
              if (!resolvedGenre && remoteMeta?.genre) {
                resolvedGenre = normalizeGenreName(remoteMeta.genre)
              }
              if (!resolvedCoverUrl || !resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') {
                const fallbackIdentity = await inferTrackIdentityFromTitle(title)
                const fallbackArtistMatches = areArtistsCompatible(
                  artist,
                  String(fallbackIdentity?.artist || ''),
                )
                if (fallbackArtistMatches) {
                  if (!resolvedCoverUrl && fallbackIdentity?.coverUrl) {
                    resolvedCoverUrl = fallbackIdentity.coverUrl
                  }
                  if (
                    (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                    fallbackIdentity?.album
                  ) {
                    resolvedAlbum = String(fallbackIdentity.album).trim()
                  }
                }
              }
              if (!resolvedCoverUrl) {
                const insightFallback = await fillCoverFromAlbumInsight({
                  title,
                  artist,
                  album: resolvedAlbum,
                  coverUrl: resolvedCoverUrl,
                })
                if (insightFallback.coverUrl) {
                  resolvedCoverUrl = insightFallback.coverUrl
                }
                if (
                  (!resolvedAlbum || resolvedAlbum.toLowerCase() === 'single') &&
                  insightFallback.album
                ) {
                  resolvedAlbum = insightFallback.album
                }
              }
            } catch {
              // keep current metadata if remote lookup fails
            }
          }
          setLruCacheValue(
            coverArtCacheRef.current,
            cacheKey,
            String(resolvedCoverUrl || '').trim(),
            MAX_COVER_CACHE_ENTRIES,
          )
          setLruCacheValue(
            albumCacheRef.current,
            cacheKey,
            String(resolvedAlbum || '').trim(),
            MAX_ALBUM_CACHE_ENTRIES,
          )
          setLruCacheValue(
            genreCacheRef.current,
            cacheKey,
            String(resolvedGenre || '').trim(),
            MAX_GENRE_CACHE_ENTRIES,
          )
          saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
          saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
          saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)
        }
        const nextTrack = {
          id: `pool-local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          artist,
          album: String(resolvedAlbum || '').trim() || 'Single',
          genre: String(resolvedGenre || '').trim(),
          fileName:
            typeof audioFile?.name === 'string'
              ? audioFile.name
              : `${safeBase}.${String((/\.([a-z0-9]{2,5})(?:\?|$)/i.exec(audioUrl)?.[1] || 'mp3')).toLowerCase()}`,
          size: blobSize ? `${(blobSize / 1024 / 1024).toFixed(1)} MB` : '',
          duration: durationValue,
          gradient: track.gradient || gradients[tracks.length % gradients.length],
          audioBlob: audioFile,
          audioUrl,
          coverBlob: null,
          coverUrl: resolvedCoverUrl,
          coverRemoteUrl: resolvedCoverUrl,
          coverTone: track.coverTone || '',
          coverName: resolvedCoverUrl ? 'Havuz kapağı' : '',
          isFavorite: false,
          createdAt: Date.now(),
          poolSourceAudioUrl: normalizedAudioUrl,
          order:
            Math.max(-1, ...allTracks.map((item, index) => getTrackSortValue(item, index))) + 1,
          source: localFileAudioUrl ? 'link' : 'local',
        }

        setTracks((prev) => [...prev, nextTrack])
        const normalizedArtistAfterAdd = normalizeCoverMatchText(String(nextTrack.artist || ''))
        const artistUnknownAfterAdd =
          !normalizedArtistAfterAdd ||
          normalizedArtistAfterAdd === 'yerel koleksiyon' ||
          normalizedArtistAfterAdd === 'bilinmeyen sanatci'
        const missingCoverAfterAdd = !String(nextTrack.coverUrl || nextTrack.coverRemoteUrl || '').trim()
        const missingAlbumAfterAdd =
          !String(nextTrack.album || '').trim() ||
          String(nextTrack.album || '').trim().toLowerCase() === 'single'

        if (missingCoverAfterAdd || artistUnknownAfterAdd || missingAlbumAfterAdd) {
          // Missing metadata is left as-is until the user manually runs "Verileri Bul".
        }
        if (!currentTrackId) {
          setProgress(0)
          setDuration(nextTrack.duration || 0)
          setCurrentTrackId(nextTrack.id)
          setIsPlaying(false)
          restoreSeekRef.current = 0
        }
        if (!suppressNotice) {
          showUploadNotice(`${artist} - ${title} kütüphaneye indirildi.`)
        }
        upsertDownloadJob({
          requestId,
          status: 'completed',
          receivedBytes: blobSize,
          totalBytes: blobSize,
          title,
          artist,
        })
      } catch (error) {
        const reason = String(error?.message || '')
        if (!suppressNotice) {
          if (reason.includes('invalid-content-type')) {
            showUploadNotice('Havuz parçası indirilemedi: link ses dosyası yerine web sayfası döndürüyor.')
          } else if (reason.includes('drive-confirm-required')) {
            showUploadNotice('Havuz parçası indirilemedi: Drive indirme onayı gerekli görünüyor.')
          } else {
            showUploadNotice('Havuz parçası indirilemedi.')
          }
        }
        upsertDownloadJob({
          requestId,
          status: 'failed',
          receivedBytes: 0,
          totalBytes: 0,
          title,
          artist,
        })
      } finally {
        setPoolDownloadingTrackId(null)
      }
    },
    [
      allTracks,
      currentTrackId,
      poolBulkDownloading,
      poolDownloadingTrackId,
      prefetchArtistCatalogForTrack,
      prefetchLyricsForTrack,
      showUploadNotice,
      tracks.length,
      upsertDownloadJob,
    ],
  )

  const downloadSelectedPoolTracks = useCallback(async () => {
    if (poolBulkDownloading || poolDownloadingTrackId) {
      return
    }

    const queue = selectablePoolTracks
    if (!queue.length) {
      showUploadNotice('İndirilecek şarkı seçmedin.')
      return
    }

    setPoolBulkDownloading(true)
    let successCount = 0

    try {
      for (const track of queue) {
        await downloadPoolTrackToLibrary(track, { suppressNotice: true, bypassBusy: true })
        successCount += 1
        await new Promise((resolve) => window.setTimeout(resolve, 16))
      }
      showUploadNotice(`${successCount} şarkı kütüphanene eklendi.`)
      setPoolSelectedTrackIds([])
      poolSelectionAnchorIdRef.current = null
    } catch {
      showUploadNotice('Toplu indirme sırasında bir hata oluştu.')
    } finally {
      setPoolBulkDownloading(false)
    }
  }, [downloadPoolTrackToLibrary, poolBulkDownloading, poolDownloadingTrackId, selectablePoolTracks, showUploadNotice])

  const downloadablePoolTracks = useMemo(
    () =>
      selectedCollectionId === 'pool'
        ? displayedTracks.filter((track) => track.audioUrl && !isTrackInLocalLibrary(track))
        : [],
    [displayedTracks, isTrackInLocalLibrary, selectedCollectionId],
  )

  const downloadAllPoolTracks = useCallback(async () => {
    if (poolBulkDownloading || poolDownloadingTrackId) {
      return
    }

    const queue = downloadablePoolTracks
    if (!queue.length) {
      showUploadNotice('İndirilecek şarkı bulunamadı.')
      return
    }

    setPoolBulkDownloading(true)
    let successCount = 0

    try {
      for (const track of queue) {
        await downloadPoolTrackToLibrary(track, { suppressNotice: true, bypassBusy: true })
        successCount += 1
        await new Promise((resolve) => window.setTimeout(resolve, 16))
      }
      showUploadNotice(`Hepsi indir tamamlandı. ${successCount} şarkı eklendi.`)
      setPoolSelectedTrackIds([])
      poolSelectionAnchorIdRef.current = null
    } catch {
      showUploadNotice('Hepsi indir sırasında bir hata oluştu.')
    } finally {
      setPoolBulkDownloading(false)
    }
  }, [downloadPoolTrackToLibrary, downloadablePoolTracks, poolBulkDownloading, poolDownloadingTrackId, showUploadNotice])

  const canSwitchTrackNow = useCallback((showNotice = false) => {
    const now = Date.now()
    if (now < trackSwitchCooldownUntilRef.current) {
      if (showNotice) {
        showUploadNotice('Yeni şarkıya geçmek için 1 sn bekle.')
      }
      return false
    }
    return true
  }, [showUploadNotice])

  const setTrackSwitchCooldown = useCallback(() => {
    trackSwitchCooldownUntilRef.current = Date.now() + TRACK_SWITCH_COOLDOWN_MS
  }, [])

  const switchTrack = (nextTrack, shouldPlay = true, options = {}) => {
    if (!nextTrack) {
      return
    }
    const { withFade = true, enforceCooldown = false, collectionId = null, restartIfSame = false } = options
    if (enforceCooldown && !canSwitchTrackNow(true)) {
      return
    }
    if (restartIfSame && currentTrackId === nextTrack.id) {
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = 0
          if (shouldPlay) {
            const playPromise = audioRef.current.play?.()
            if (playPromise?.catch) {
              playPromise.catch(() => {})
            }
          } else {
            audioRef.current.pause?.()
          }
        } catch {
          // ignore manual seek/play restart failures
        }
      }
      setProgress(0)
      setDuration(nextTrack.duration || 0)
      setIsPlaying(shouldPlay)
      restoreSeekRef.current = 0
      if (collectionId) {
        const safeCollectionId = collectionId === 'pool' || collectionId === 'server' ? 'all' : collectionId
        setPlaybackCollectionId(safeCollectionId)
      }
      return
    }

    setProgress(0)
    setDuration(nextTrack.duration || 0)
    setCurrentTrackId(nextTrack.id)
    setIsPlaying(shouldPlay)
    restoreSeekRef.current = 0
    trackSwitchFadeUntilRef.current = withFade && shouldPlay
      ? Date.now() + TRACK_SWITCH_FADE_MS
      : 0
    if (!shouldPlay && audioRef.current) {
      audioRef.current.volume = toAudioGain(volume)
    }
    if (enforceCooldown) {
      setTrackSwitchCooldown()
    }
    if (collectionId) {
      const safeCollectionId = collectionId === 'pool' || collectionId === 'server' ? 'all' : collectionId
      setPlaybackCollectionId(safeCollectionId)
    }
  }

  switchTrackRef.current = switchTrack

  const toggleShuffleMode = () => {
    setShuffleEnabled((prev) => {
      const nextValue = !prev
      if (nextValue) {
        shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
        applyShuffleOrderIds([])
        setRepeatEnabled(false)
      } else {
        applyShuffleOrderIds([])
      }
      return nextValue
    })
  }

  const toggleRepeatMode = () => {
    setRepeatEnabled((prev) => {
      const nextValue = !prev
      if (nextValue) {
        setShuffleEnabled(false)
      }
      return nextValue
    })
  }

  const playSelectedCollection = () => {
    if (!isPlaylistCollectionSelected || !visibleTracks.length) {
      return
    }

    applyQueuedNextTracks([])
    setShuffleEnabled(false)
    setRepeatEnabled(false)
    switchTrack(visibleTracks[0], true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
  }

  const shufflePlaySelectedCollection = () => {
    if (!isPlaylistCollectionSelected || !visibleTracks.length) {
      return
    }

    const randomIndex = Math.floor(Math.random() * visibleTracks.length)
    const randomTrack = visibleTracks[randomIndex] || visibleTracks[0]
    shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
    applyQueuedNextTracks([])
    applyShuffleOrderIds([])
    setRepeatEnabled(false)
    setShuffleEnabled(true)
    switchTrack(randomTrack, true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
  }

  const playGenreFromDock = (genreCollectionId) => {
    const targetGenre = genreCollections.find((item) => item.id === genreCollectionId)
    if (!targetGenre) {
      return
    }

    const playlistTracks = getTracksByCollectionId(genreCollectionId)
    if (!playlistTracks.length) {
      handleCollectionSelect(genreCollectionId)
      return
    }

    handleCollectionSelect(genreCollectionId)
    applyQueuedNextTracks([])
    setRepeatEnabled(false)

    if (shuffleEnabled) {
      const randomIndex = Math.floor(Math.random() * playlistTracks.length)
      const randomTrack = playlistTracks[randomIndex] || playlistTracks[0]
      shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
      applyShuffleOrderIds([])
      setShuffleEnabled(true)
      switchTrack(randomTrack, true, {
        enforceCooldown: true,
        collectionId: genreCollectionId,
      })
      return
    }

    setShuffleEnabled(false)
    switchTrack(playlistTracks[0], true, {
      enforceCooldown: true,
      collectionId: genreCollectionId,
    })
  }

  const [playlistDockDragging, setPlaylistDockDragging] = useState(false)

  const handlePlaylistDockPointerDown = useCallback((event) => {
    if (event.button !== 0) {
      return
    }
    const container = playlistDockRef.current
    if (!(container instanceof HTMLElement)) {
      return
    }
    playlistDockDragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    }
    suppressPlaylistDockClickRef.current = false
    setPlaylistDockDragging(false)
  }, [])

  const handlePlaylistDockPointerMove = useCallback((event) => {
    const container = playlistDockRef.current
    const dragState = playlistDockDragRef.current
    if (!(container instanceof HTMLElement) || !dragState.active) {
      return
    }
    const deltaX = event.clientX - dragState.startX
    if (Math.abs(deltaX) > 4) {
      suppressPlaylistDockClickRef.current = true
      setPlaylistDockDragging(true)
    }
    container.scrollLeft = dragState.startScrollLeft - deltaX
  }, [])

  const handlePlaylistDockPointerUp = useCallback(() => {
    playlistDockDragRef.current.active = false
    setPlaylistDockDragging(false)
  }, [])

  const handlePlaylistDockClickCapture = useCallback((event) => {
    if (!suppressPlaylistDockClickRef.current) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    suppressPlaylistDockClickRef.current = false
  }, [])

  useEffect(() => {
    if (!genreCollections.length || !selectedCollectionId.startsWith('genre:')) {
      return
    }
    const container = playlistDockRef.current
    if (!(container instanceof HTMLElement)) {
      return
    }
    const target = container.querySelector(`[data-genre-dock-id="${CSS.escape(selectedCollectionId)}"]`)
    if (!(target instanceof HTMLElement)) {
      return
    }
    const rafId = window.requestAnimationFrame(() => {
      target.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      })
    })
    return () => window.cancelAnimationFrame(rafId)
  }, [genreCollections, selectedCollectionId])

  const togglePlayback = () => {
    if (!allTracks.length) {
      openAddModal()
      return
    }

    if (!currentTrack && allTracks[0]) {
      const starterPool = playbackTracks.length ? playbackTracks : visibleTracks
      const starterTrack = shuffleEnabled
        ? (getNextTrack() || starterPool[0] || allTracks[0])
        : (starterPool[0] || allTracks[0])
      if (!starterTrack) {
        return
      }
      setProgress(0)
      setDuration(starterTrack.duration || 0)
      setCurrentTrackId(starterTrack.id)
      setIsPlaying(true)
      restoreSeekRef.current = 0
      setPlaybackCollectionId(
        selectedCollectionId === 'pool' || selectedCollectionId === 'server'
          ? 'all'
          : selectedCollectionId,
      )
      return
    }

    setIsPlaying((prev) => !prev)
  }

  const handleWindowMinimize = useCallback((event) => {
    event?.stopPropagation?.()
    window?.novaPlayer?.minimizeWindow?.()
  }, [])

  const handleWindowToggleMaximize = useCallback(async (event) => {
    event?.stopPropagation?.()
    if (!window?.novaPlayer?.toggleWindowMaximize) {
      return
    }
    try {
      const result = await window.novaPlayer.toggleWindowMaximize()
      if (result && typeof result.isMaximized === 'boolean') {
        setWindowIsMaximized(result.isMaximized)
      }
    } catch {
      // ignore toggle failures
    }
  }, [])

  const seekToTime = (nextTime) => {
    const targetTime = Number(nextTime)
    if (!Number.isFinite(targetTime)) {
      return
    }
    const audio = audioRef.current
    if (!audio) {
      return
    }
    const clampedTime = duration > 0 ? Math.min(Math.max(0, targetTime), duration) : Math.max(0, targetTime)
    audio.currentTime = clampedTime
    setProgress(clampedTime)
    restoreSeekRef.current = clampedTime
  }

  const renderLyricsContent = (className = '', options = {}) => {
    const interactive = options?.interactive == null ? parsedLyrics.hasTiming : Boolean(options?.interactive)
    const visibleWindow = Number(options?.visibleWindow || 14)
    if (!parsedLyrics.lines.length) {
      return null
    }
    if (!parsedLyrics.hasTiming) {
      return <pre className={`lyrics-text ${className}`.trim()}>{lyricsText}</pre>
    }
    const total = parsedLyrics.lines.length
    const effectiveActive = activeLyricIndex >= 0 ? activeLyricIndex : 0
    const halfWindow = Math.max(2, Math.floor(visibleWindow / 2))
    const startIndex = Math.max(0, effectiveActive - halfWindow)
    const endIndex = Math.min(total, startIndex + Math.max(4, visibleWindow))
    const visibleLines = parsedLyrics.lines.slice(startIndex, endIndex)
    return (
      <div className={`lyrics-timed ${className}`.trim()}>
        {visibleLines.map((line, offset) => {
          const index = startIndex + offset
          const isActive = index === activeLyricIndex
          const isPassed = activeLyricIndex > -1 && index < activeLyricIndex
          return (
            <p
              key={`lyric-line-${line.at}-${index}`}
              className={`lyrics-line ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`.trim()}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => seekToTime(line.at) : undefined}
              onKeyDown={
                interactive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        seekToTime(line.at)
                      }
                    }
                  : undefined
              }
            >
              {line.text}
            </p>
          )
        })}
      </div>
    )
  }

  const handleWindowClose = useCallback((event) => {
    event?.stopPropagation?.()
    window?.novaPlayer?.closeWindow?.()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const applyLayoutState = (layoutState) => {
      const canUse = Boolean(layoutState?.isFullScreen || layoutState?.isMaximized)
      setWindowCanUseSidebarPlayer(canUse)
      setWindowIsMaximized(Boolean(layoutState?.isMaximized))
    }

    const bridge = window.novaPlayer
    let mounted = true

    if (bridge?.getWindowLayoutState) {
      bridge
        .getWindowLayoutState()
        .then((state) => {
          if (!mounted) {
            return
          }
          applyLayoutState(state)
        })
        .catch(() => {})
    }

    const unsubscribe = bridge?.onWindowLayoutState?.((state) => {
      if (!mounted) {
        return
      }
      applyLayoutState(state)
    })

    return () => {
      mounted = false
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    let rafId = null
    const syncTrackListLayout = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
      rafId = window.requestAnimationFrame(() => {
        setTrackListLayoutVersion((prev) => (prev + 1) % 100000)
      })
    }

    window.addEventListener('resize', syncTrackListLayout)
    document.addEventListener('fullscreenchange', syncTrackListLayout)

    return () => {
      window.removeEventListener('resize', syncTrackListLayout)
      document.removeEventListener('fullscreenchange', syncTrackListLayout)
      if (rafId) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  useEffect(() => {
    setTrackListLayoutVersion((prev) => (prev + 1) % 100000)
  }, [sidebarPlayerActive])

  useEffect(() => {
    if (sidebarPlayerActive) {
      setDockPointerInside(false)
      setDockProximityVisible(true)
      if (dockHideTimerRef.current) {
        window.clearTimeout(dockHideTimerRef.current)
        dockHideTimerRef.current = null
      }
      return undefined
    }

    const handlePointerMove = (event) => {
      if (dockPointerInside) {
        return
      }

      const viewportHeight = window.innerHeight || 0
      const nearBottomEdge = event.clientY >= viewportHeight - 120
      const rect = bottomDockRef.current?.getBoundingClientRect()
      const nearDockArea = rect
        ? event.clientX >= rect.left - 120 &&
          event.clientX <= rect.right + 120 &&
          event.clientY >= rect.top - 120 &&
          event.clientY <= rect.bottom + 120
        : false

      if (nearBottomEdge || nearDockArea) {
        if (dockHideTimerRef.current) {
          window.clearTimeout(dockHideTimerRef.current)
          dockHideTimerRef.current = null
        }
        setDockProximityVisible(true)
        return
      }

      if (dockHideTimerRef.current) {
        return
      }

      dockHideTimerRef.current = window.setTimeout(() => {
        setDockProximityVisible(false)
        dockHideTimerRef.current = null
      }, 160)
    }

    window.addEventListener('mousemove', handlePointerMove)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      if (dockHideTimerRef.current) {
        window.clearTimeout(dockHideTimerRef.current)
        dockHideTimerRef.current = null
      }
    }
  }, [dockPointerInside, sidebarPlayerActive])

  useEffect(() => {
    const handleSpacePlayback = (event) => {
      if (!spaceKeyPlaybackEnabled || event.defaultPrevented) {
        return
      }

      if (isKeyboardInputContext(event) || event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (event.code === 'Space' || event.key === ' ') {
        if (event.repeat) {
          event.preventDefault()
          return
        }

        const now = Date.now()
        if (now < spaceToggleLockUntilRef.current) {
          event.preventDefault()
          return
        }

        spaceToggleLockUntilRef.current = now + 220
        event.preventDefault()
        togglePlayback()
      }
    }

    window.addEventListener('keydown', handleSpacePlayback)
    return () => window.removeEventListener('keydown', handleSpacePlayback)
  }, [spaceKeyPlaybackEnabled, togglePlayback])

  const handlePoolTrackRowClick = useCallback(
    (event, track, index) => {
      if (selectedCollectionId !== 'pool') {
        return
      }

      const target = event?.target
      if (target instanceof Element) {
        const interactiveAncestor = target.closest(
          'button, input, textarea, select, a, [role="menu"], .track-menu, .dock-playlist-menu',
        )
        if (interactiveAncestor) {
          return
        }
      }

      setPoolSelectedTrackIds((prev) => {
        const prevSet = new Set(prev)
        const hasCurrent = prevSet.has(track.id)

        if (event.shiftKey) {
          const anchorId = poolSelectionAnchorIdRef.current || track.id
          const anchorIndex = displayedTracks.findIndex((item) => item.id === anchorId)
          const toIndex = index
          const fromIndex = anchorIndex >= 0 ? anchorIndex : toIndex
          const start = Math.min(fromIndex, toIndex)
          const end = Math.max(fromIndex, toIndex)
          const rangeIds = displayedTracks.slice(start, end + 1).map((item) => item.id)
          const nextSet = new Set(event.ctrlKey || event.metaKey ? prev : [])
          rangeIds.forEach((id) => nextSet.add(id))
          poolSelectionAnchorIdRef.current = track.id
          return Array.from(nextSet)
        }

        if (event.ctrlKey || event.metaKey) {
          if (hasCurrent) {
            prevSet.delete(track.id)
          } else {
            prevSet.add(track.id)
          }
          poolSelectionAnchorIdRef.current = track.id
          return Array.from(prevSet)
        }

        poolSelectionAnchorIdRef.current = track.id
        return [track.id]
      })
    },
    [displayedTracks, selectedCollectionId],
  )

  const playTrack = (trackId) => {
    const selectedTrack = allTracks.find((track) => track.id === trackId)
    if (!selectedTrack) {
      return
    }

    if (selectedCollectionId === 'pool') {
      downloadPoolTrackToLibrary(selectedTrack)
      closeMenus()
      return
    }

    if (currentTrackId === selectedTrack.id) {
      restartTrack()
      setIsPlaying(true)
      closeMenus()
      return
    }

    switchTrack(selectedTrack, true, {
      enforceCooldown: true,
      collectionId: selectedCollectionId,
    })
    closeMenus()
  }

  const restartTrack = () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return
    }

    audio.currentTime = 0
    setProgress(0)
    restoreSeekRef.current = 0
  }

  const stepTrack = () => {
    if (repeatEnabled && currentTrack) {
      restartTrack()
      setIsPlaying(true)
      return
    }

    const nextTrack = getNextTrack({ consumeQueue: true, ignoreShuffle: false })
    if (!nextTrack) {
      return
    }

    switchTrack(nextTrack, true, { enforceCooldown: true })
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const bridge = window.novaPlayer
    const unsubscribe = bridge?.onMediaControl?.((command) => {
      switch (String(command || '')) {
        case 'play-pause':
          togglePlayback()
          break
        case 'next-track':
          stepTrack()
          break
        case 'previous-track':
          restartTrack()
          break
        case 'stop':
          setIsPlaying(false)
          break
        default:
          break
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [restartTrack, stepTrack, togglePlayback])

  const handleSeek = (event) => {
    const nextTime = Number(event.target.value)
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const activeDuration = Number.isFinite(audio.duration) ? audio.duration : duration
    const clampedTime = Number.isFinite(activeDuration) && activeDuration > 0
      ? Math.max(0, Math.min(nextTime, activeDuration))
      : Math.max(0, nextTime)

    audio.currentTime = clampedTime
    setProgress(clampedTime)
    restoreSeekRef.current = clampedTime
  }

  const handleVolumeChange = (event) => {
    setVolume(Number(event.target.value))
  }

  const handleEqualizerChange = (index, value) => {
    setEqualizerGains((prev) => prev.map((gain, gainIndex) => (gainIndex === index ? value : gain)))
  }

  const resetEqualizer = () => {
    setEqualizerGains(Array(equalizerBands.length).fill(0))
  }

  const selectAudioOutput = async (deviceId) => {
    const targetId = String(deviceId || 'default')
    setSelectedAudioOutputId(targetId)
    // Ayarlar modalı kullanıcı kapatana kadar açık kalsın.
    setSettingsOpen(true)
    await applyAudioOutputToPlayer(targetId, { silent: false })
  }

  const handleEditChange = (field, value) => {
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const openCoverPicker = () => {
    if (!editTargetId) {
      return
    }

    setCoverMenuOpen(false)
    coverInputRef.current?.click()
  }

  const requestCoverRemoval = () => {
    setPendingCover(null)
    setCoverRemovalRequested(true)
    setCoverMenuOpen(false)
  }

  const scrollToCoverStage = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const handleTrackCoverImageError = useCallback(
    (track) => {
      if (!track?.id) return
      const localCoverUrl = String(track.coverUrl || '').trim()
      const remoteCoverUrl = String(track.coverRemoteUrl || '').trim()
      const hasLocalBlob = Boolean(track.coverBlob) || localCoverUrl.startsWith('blob:')

      if (hasLocalBlob && remoteCoverUrl && !remoteCoverUrl.startsWith('blob:')) {
        updateTrack(track.id, {
          coverBlob: null,
          coverUrl: remoteCoverUrl,
        })
        return
      }

      if (remoteCoverUrl && !remoteCoverUrl.startsWith('blob:')) {
        repairTrackCoverIfMissing({
          ...track,
          coverUrl: '',
        })
        return
      }

      const rawCover = String(localCoverUrl || remoteCoverUrl).trim()
      if (!rawCover) return
      updateTrack(track.id, { coverUrl: '' })
    },
    [repairTrackCoverIfMissing, updateTrack],
  )

  const refreshCurrentCover = useCallback(async () => {
    if (!currentTrack) {
      return
    }

    if (!window.confirm('Kapak resmini yeniden aramak istediğine emin misin?')) {
      return
    }

    try {
      const remoteCoverUrl = await fetchRemoteCoverArt(currentTrack.title || '', currentTrack.artist || '')
      if (!remoteCoverUrl) {
        showUploadNotice('Yeni kapak bulunamadı.')
        return
      }

      const coverTone = await extractDominantColor(remoteCoverUrl)
      const coverName = `${currentTrack.artist || 'Sanatçı'} - ${currentTrack.title || 'Parça'}`
      const cacheKey = `${normalizeArtistQuery(currentTrack.artist || '').toLowerCase()}::${normalizeArtistQuery(currentTrack.title || '').toLowerCase()}`
      setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
      saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)

      const nextUpdate = {
        coverUrl: remoteCoverUrl,
        coverRemoteUrl: remoteCoverUrl,
        coverTone,
        coverName,
      }

      if (tracks.some((track) => track.id === currentTrack.id)) {
        updateTrack(currentTrack.id, nextUpdate)
      }

      showUploadNotice('Kapak güncellendi.')
    } catch {
      showUploadNotice('Kapak aranırken bir sorun oluştu.')
    }
  }, [currentTrack, showUploadNotice, tracks, updateTrack])

  const refreshCurrentArtistFacts = useCallback(async () => {
    if (!currentTrack) {
      return
    }

    if (!window.confirm('Sanatçı bilgisini yeniden aramak istediğine emin misin?')) {
      return
    }

    setArtistFactsLoading(true)
    try {
      const facts = await fetchArtistFacts(currentTrack.artist || '')
      setLruCacheValue(
        artistFactsCacheRef.current,
        currentTrack.artist || '',
        facts,
        MAX_ARTIST_FACTS_CACHE_ENTRIES,
      )
      saveArtistFactsCache(artistFactsCacheRef.current)
      setArtistFacts(facts)
      showUploadNotice('Sanatçı bilgisi güncellendi.')
    } catch {
      showUploadNotice('Sanatçı bilgisi yenilenemedi.')
    } finally {
      setArtistFactsLoading(false)
    }
  }, [currentTrack, showUploadNotice])

  const openArtistProfile = useCallback((artistName) => {
    const candidates = extractArtistCandidates(String(artistName || ''))
    const normalized = candidates[0] || String(artistName || '').trim()
    if (!normalized) {
      return
    }
    setArtistProfileName(normalized)
    setArtistProfileSelectedAlbumKey('')
    setArtistProfileOpen(true)
  }, [])

  const openAlbumInfo = useCallback(
    async (track, options = {}) => {
      if (!track) {
        return
      }

      const albumName = String(track.album || '').trim() || 'Single'
      const artistName = String(track.artist || '').trim()
      const albumModalCacheKey = `${normalizeCoverMatchText(artistName)}|${normalizeCoverMatchText(albumName)}`
      const poolMatches = serverTracks.filter(
        (item) =>
          normalizeCoverMatchText(item.album || '') === normalizeCoverMatchText(albumName) &&
          doesArtistMatch(item.artist || '', artistName),
      )

      const cachedAlbumInfo = getLruCacheValue(albumInfoModalCacheRef.current, albumModalCacheKey)
      if (cachedAlbumInfo && typeof cachedAlbumInfo === 'object') {
        setAlbumInfoOpen(true)
        setAlbumInfoLoading(false)
        setAlbumInfoYtTracks(Array.isArray(cachedAlbumInfo.ytTracks) ? cachedAlbumInfo.ytTracks : [])
        setAlbumInfoYtTracksLoading(false)
        setAlbumInfo({
          album: String(cachedAlbumInfo.album || albumName || '').trim() || albumName,
          artist:
            String(cachedAlbumInfo.artist || artistName || '').trim() ||
            (artistName || 'Bilinmeyen sanatçı'),
          releaseDate: String(cachedAlbumInfo.releaseDate || '').trim(),
          coverUrl:
            String(cachedAlbumInfo.coverUrl || getTrackDisplayUrl(track, 'hero') || '').trim() ||
            getTrackDisplayUrl(track, 'hero'),
          poolTracks: poolMatches,
          preferDownloads: Boolean(options?.preferDownloads),
        })
        return
      }

      setAlbumInfoOpen(true)
      setAlbumInfoLoading(true)
      setAlbumInfoYtTracks([])
      setAlbumInfoYtTracksLoading(true)
      setAlbumInfo({
        album: albumName,
        artist: artistName || 'Bilinmeyen sanatçı',
        releaseDate: '',
        coverUrl: getTrackDisplayUrl(track, 'hero'),
        poolTracks: poolMatches,
        preferDownloads: Boolean(options?.preferDownloads),
      })

      let insightData = null
      try {
        const insight = await fetchAlbumInsights({
          artist: artistName,
          album: albumName,
          title: track.title || '',
        })
        insightData = insight

        setAlbumInfo((prev) => ({
          ...(prev || {}),
          album: String(insight?.album || albumName || '').trim() || albumName,
          artist: String(insight?.artist || artistName || '').trim() || (artistName || 'Bilinmeyen sanatçı'),
          releaseDate: String(insight?.releaseDate || '').trim(),
          coverUrl: String(insight?.coverUrl || prev?.coverUrl || '').trim(),
          poolTracks: poolMatches,
        }))
      } catch {
        // ignore lookup errors, base info is still shown
      } finally {
        setAlbumInfoLoading(false)
      }

      try {
        const searchQuery = `${artistName} ${albumName}`.trim()
        const searchResult = window?.novaPlayer?.searchYtMusic
          ? await window.novaPlayer.searchYtMusic({ query: searchQuery, limit: 20 })
          : null
        const albumCandidate = Array.isArray(searchResult?.items)
          ? searchResult.items.find((item) => String(item?.type || '') === 'album' && doesArtistMatch(item.artist || '', artistName))
          : null
        if (albumCandidate?.albumId && window?.novaPlayer?.getYtMusicAlbumTracks) {
          const tracksResult = await window.novaPlayer.getYtMusicAlbumTracks({
            albumId: albumCandidate.albumId,
            artistName: albumCandidate.artist || '',
          })
          const ytTracks = Array.isArray(tracksResult?.tracks)
            ? tracksResult.tracks
                .filter((entry) => String(entry?.url || '').trim())
                .map((entry) => ({
                  id: String(entry.id || entry.url || ''),
                  title: cleanFilenameTrackTitle(String(entry.title || '').trim()),
                  artist: String(entry.artist || artistName || '').trim(),
                  album: String(entry.album || albumName || '').trim() || 'Single',
                  duration: Number(entry.duration || 0) || 0,
                  url: String(entry.url || '').trim(),
                  coverUrl: String(entry.thumbnail || '').trim(),
                }))
            : []
          setAlbumInfoYtTracks(ytTracks)
          const finalInfo = {
            album:
              String(insightData?.album || albumName || '').trim() || albumName,
            artist:
              String(insightData?.artist || artistName || '').trim() ||
              (artistName || 'Bilinmeyen sanatçı'),
            releaseDate: String(insightData?.releaseDate || '').trim(),
            coverUrl:
              String(insightData?.coverUrl || getTrackDisplayUrl(track, 'hero') || '').trim() ||
              getTrackDisplayUrl(track, 'hero'),
            ytTracks,
          }
          setLruCacheValue(
            albumInfoModalCacheRef.current,
            albumModalCacheKey,
            finalInfo,
            MAX_ALBUM_INFO_MODAL_CACHE_ENTRIES,
          )
          saveJsonCache(ALBUM_INFO_MODAL_CACHE_KEY, albumInfoModalCacheRef.current)
        } else {
          setAlbumInfoYtTracks([])
          const fallbackInfo = {
            album:
              String(insightData?.album || albumName || '').trim() || albumName,
            artist:
              String(insightData?.artist || artistName || '').trim() ||
              (artistName || 'Bilinmeyen sanatçı'),
            releaseDate: String(insightData?.releaseDate || '').trim(),
            coverUrl:
              String(insightData?.coverUrl || getTrackDisplayUrl(track, 'hero') || '').trim() ||
              getTrackDisplayUrl(track, 'hero'),
            ytTracks: [],
          }
          setLruCacheValue(
            albumInfoModalCacheRef.current,
            albumModalCacheKey,
            fallbackInfo,
            MAX_ALBUM_INFO_MODAL_CACHE_ENTRIES,
          )
          saveJsonCache(ALBUM_INFO_MODAL_CACHE_KEY, albumInfoModalCacheRef.current)
        }
      } catch {
        setAlbumInfoYtTracks([])
      } finally {
        setAlbumInfoYtTracksLoading(false)
      }
    },
    [serverTracks],
  )

  const openHomeMoodPlaylist = useCallback(async (playlist) => {
    const playlistId = String(playlist?.playlistId || playlist?.id || '').trim()
    if (!playlistId || !window?.novaPlayer?.getYtMusicPlaylistTracks) {
      return
    }
    setHomeMoodModalOpen(true)
    setHomeMoodModalTitle(String(playlist?.title || 'Mood playlist'))
    setHomeMoodModalTracks([])
    setHomeMoodModalLoading(true)
    try {
      const result = await window.novaPlayer.getYtMusicPlaylistTracks({ playlistId })
      const tracks = Array.isArray(result?.tracks) ? result.tracks : []
      setHomeMoodModalTitle(String(result?.title || playlist?.title || 'Mood playlist'))
      setHomeMoodModalTracks(
        tracks
          .filter((track) => String(track?.url || '').trim())
          .map((track, index) => ({
            id: String(track.id || `${playlistId}-${index}`),
            title: cleanFilenameTrackTitle(String(track.title || '').trim()) || 'Unknown Title',
            artist: String(track.artist || '').trim() || 'Unknown Artist',
            album: String(track.album || '').trim() || 'Single',
            duration: Number(track.duration || 0) || 0,
            url: String(track.url || '').trim(),
            coverUrl: String(track.thumbnail || '').trim(),
          })),
      )
    } catch {
      setHomeMoodModalTracks([])
    } finally {
      setHomeMoodModalLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!artistProfileOpen || !artistProfileName) {
      return
    }

    const candidates = extractArtistCandidates(artistProfileName)
    const cachedFacts = candidates
      .map((name) => getLruCacheValue(artistFactsCacheRef.current, name))
      .find((entry) => entry !== undefined)

    if (cachedFacts !== undefined) {
      setArtistProfileFacts(cachedFacts)
      setArtistProfileFactsLoading(false)
      return
    }

    let cancelled = false
    setArtistProfileFactsLoading(true)
    setArtistProfileFacts(null)

    const loadFacts = async () => {
      try {
        let facts = null
        for (const artistName of candidates) {
          if (!artistName) {
            continue
          }
          const fetched = await fetchArtistFacts(artistName)
          setLruCacheValue(artistFactsCacheRef.current, artistName, fetched, MAX_ARTIST_FACTS_CACHE_ENTRIES)
          if (!facts && fetched) {
            facts = fetched
          }
        }
        if (!facts) {
          candidates.forEach((artistName) => {
            if (!Object.prototype.hasOwnProperty.call(artistFactsCacheRef.current, artistName)) {
              setLruCacheValue(artistFactsCacheRef.current, artistName, null, MAX_ARTIST_FACTS_CACHE_ENTRIES)
            }
          })
        }
        saveArtistFactsCache(artistFactsCacheRef.current)
        if (!cancelled) {
          setArtistProfileFacts(facts)
        }
      } catch {
        if (!cancelled) {
          setArtistProfileFacts(null)
        }
      } finally {
        if (!cancelled) {
          setArtistProfileFactsLoading(false)
        }
      }
    }

    loadFacts()
    return () => {
      cancelled = true
    }
  }, [artistProfileName, artistProfileOpen])

  useEffect(() => {
    const release = artistProfileSelectedYtRelease
    if (!artistProfileOpen || !release?.id || !window?.novaPlayer?.getYtMusicAlbumTracks) {
      return
    }
    if (artistProfileReleaseTracksByKey[release.key]?.length) {
      return
    }

    let cancelled = false
    setArtistProfileReleaseLoadingKey(release.key)
    ;(async () => {
      try {
        const tracksResult = await window.novaPlayer.getYtMusicAlbumTracks({
          albumId: release.id,
          artistName: artistProfileName,
        })
        const tracks = Array.isArray(tracksResult?.tracks)
          ? tracksResult.tracks
              .filter((track) => String(track?.url || '').trim())
              .map((track) => ({
                id: String(track.id || track.url || ''),
                title: cleanFilenameTrackTitle(String(track.title || '').trim()),
                artist: String(track.artist || artistProfileName || '').trim(),
                album: String(track.album || release.album || '').trim() || 'Single',
                duration: Number(track.duration || 0) || 0,
                url: String(track.url || '').trim(),
                coverUrl: String(track.thumbnail || release.coverUrl || '').trim(),
              }))
          : []
        if (!cancelled) {
          setArtistProfileReleaseTracksByKey((prev) => ({ ...prev, [release.key]: tracks }))
          const cacheKey = normalizeCoverMatchText(artistProfileName)
          const cached = artistProfileYtCacheRef.current[cacheKey]
          if (cached) {
            artistProfileYtCacheRef.current[cacheKey] = {
              ...cached,
              releaseTracksByKey: {
                ...(cached.releaseTracksByKey || {}),
                [release.key]: tracks,
              },
            }
            persistArtistProfileYtCache()
          }
        }
      } catch {
        if (!cancelled) {
          setArtistProfileReleaseTracksByKey((prev) => ({ ...prev, [release.key]: [] }))
        }
      } finally {
        if (!cancelled) {
          setArtistProfileReleaseLoadingKey('')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [artistProfileName, artistProfileOpen, artistProfileReleaseTracksByKey, artistProfileSelectedYtRelease, persistArtistProfileYtCache])

  useEffect(() => {
    if (!artistProfileOpen || !artistProfileName) {
      setArtistProfileYtAlbums([])
      setArtistProfileYtSingles([])
      setArtistProfileYtTopSongs([])
      setArtistProfileYtLoading(false)
      return
    }

    const cacheKey = normalizeCoverMatchText(artistProfileName)
    const cached = artistProfileYtCacheRef.current[cacheKey]
    const now = Date.now()
    const cacheAgeMs = now - Number(cached?.at || 0)
    const isCacheFresh = cacheAgeMs < 1000 * 60 * 60 * 24 * 7
    const hasCachedArtistData =
      Boolean(Array.isArray(cached?.albums) && cached.albums.length) ||
      Boolean(Array.isArray(cached?.singles) && cached.singles.length) ||
      Boolean(Array.isArray(cached?.topSongs) && cached.topSongs.length)
    if (cached) {
      setArtistProfileYtAlbums(cached.albums || [])
      setArtistProfileYtSingles(cached.singles || [])
      setArtistProfileYtTopSongs(cached.topSongs || [])
      setArtistProfileSelectedYtAlbumKey(cached.selectedAlbumKey || '')
      setArtistProfileSelectedYtSingleKey(cached.selectedSingleKey || '')
      setArtistProfileReleaseTracksByKey(cached.releaseTracksByKey || {})
      setArtistProfileReleaseLoadingKey('')
      setArtistProfileYtLoading(false)
      if (isCacheFresh && hasCachedArtistData) {
        return
      }
    }
    if (cached && !isCacheFresh) {
      // Stale cache: keep UI instant, refresh in background.
      setArtistProfileYtLoading(true)
    } else if (!cached) {
      setArtistProfileYtLoading(true)
      // Keep previous data visible while refreshing to avoid flicker/jank.
    }
    let cancelled = false

    const loadArtistYtAlbums = async () => {
      try {
        const albumResult = window?.novaPlayer?.getYtMusicArtistAlbums
          ? await window.novaPlayer.getYtMusicArtistAlbums({ artistName: artistProfileName })
          : { ok: false, albums: [], singles: [], topSongs: [] }
        if (!albumResult?.ok) {
          if (!cancelled) {
            setArtistProfileYtAlbums([])
            setArtistProfileYtSingles([])
            setArtistProfileYtTopSongs([])
          }
          return
        }
        const topSongs = Array.isArray(albumResult.topSongs) ? albumResult.topSongs : []
        if (!cancelled) {
          setArtistProfileYtTopSongs(
            topSongs
              .filter((track) => String(track?.url || '').trim())
              .map((track) => ({
                id: String(track.id || track.url || ''),
                title: cleanFilenameTrackTitle(String(track.title || '').trim()),
                artist: String(track.artist || artistProfileName || '').trim(),
                album: String(track.album || '').trim() || 'Single',
                duration: Number(track.duration || 0) || 0,
                url: String(track.url || '').trim(),
                coverUrl: String(track.thumbnail || '').trim(),
              })),
          )
        }
        const mapReleaseList = (rows = []) => {
          const seen = new Set()
          return rows
            .map((release) => {
              const releaseId = String(release.id || '').trim()
              const releaseTitle = String(release.title || '').trim()
              if (!releaseId || !releaseTitle) {
                return null
              }
              const dedupeKey = `${releaseId}|||${normalizeCoverMatchText(releaseTitle)}`
              if (seen.has(dedupeKey)) {
                return null
              }
              seen.add(dedupeKey)
              return {
                key: normalizeCoverMatchText(releaseTitle || releaseId) || releaseId,
                id: releaseId,
                album: releaseTitle || 'Single',
                coverUrl: String(release.coverUrl || '').trim(),
                trackCount: Number(release.trackCount || release.count || 0) || 0,
              }
            })
            .filter(Boolean)
        }

        const rawAlbums = Array.isArray(albumResult.albums) ? albumResult.albums : []
        const rawSingles = Array.isArray(albumResult.singles) ? albumResult.singles : []
        const albums = mapReleaseList(rawAlbums)
        const singles = mapReleaseList(rawSingles)

        if (!cancelled) {
          setArtistProfileYtAlbums(albums)
          setArtistProfileYtSingles(singles)
          let nextSelectedAlbumKey = ''
          let nextSelectedSingleKey = ''
          if (albums[0]) {
            nextSelectedAlbumKey = albums[0].key
            nextSelectedSingleKey = ''
            setArtistProfileSelectedYtAlbumKey(nextSelectedAlbumKey)
            setArtistProfileSelectedYtSingleKey(nextSelectedSingleKey)
          } else if (singles[0]) {
            nextSelectedSingleKey = singles[0].key
            setArtistProfileSelectedYtSingleKey(nextSelectedSingleKey)
          }
          artistProfileYtCacheRef.current[cacheKey] = {
            at: Date.now(),
            albums,
            singles,
            topSongs: topSongs
              .filter((track) => String(track?.url || '').trim())
              .map((track) => ({
                id: String(track.id || track.url || ''),
                title: cleanFilenameTrackTitle(String(track.title || '').trim()),
                artist: String(track.artist || artistProfileName || '').trim(),
                album: String(track.album || '').trim() || 'Single',
                duration: Number(track.duration || 0) || 0,
                url: String(track.url || '').trim(),
                coverUrl: String(track.thumbnail || '').trim(),
              })),
            selectedAlbumKey: nextSelectedAlbumKey,
            selectedSingleKey: nextSelectedSingleKey,
            releaseTracksByKey: {},
          }
          persistArtistProfileYtCache()
        }
      } catch {
        if (!cancelled) {
          setArtistProfileYtAlbums([])
        }
      } finally {
        if (!cancelled) {
          setArtistProfileYtLoading(false)
        }
      }
    }

    loadArtistYtAlbums()
    return () => {
      cancelled = true
    }
  }, [artistProfileName, artistProfileOpen, persistArtistProfileYtCache])

  useEffect(() => {
    if (!artistProfileOpen) return
    if (!window?.novaPlayer?.downloadRemoteCoverToLibrary) return

    let cancelled = false

    const localizeRows = async (rows, setRows, idSelector, hintPrefix) => {
      if (!Array.isArray(rows) || !rows.length) return
      let changed = false
      const nextRows = [...rows]

      for (let index = 0; index < nextRows.length; index += 1) {
        if (cancelled) return
        const row = nextRows[index]
        const remoteCover = String(row?.coverUrl || '').trim()
        if (!remoteCover || isLocalLikeAssetUrl(remoteCover)) continue

        const rowId = String(idSelector(row) || index + 1).trim()
        const localCover = await persistRemoteCoverUrlLocally(remoteCover, `${hintPrefix}-${rowId}`)
        if (!localCover) continue
        nextRows[index] = { ...row, coverUrl: localCover }
        changed = true
      }

      if (!cancelled && changed) {
        setRows(nextRows)
      }
    }

    void localizeRows(artistProfileYtTopSongs, setArtistProfileYtTopSongs, (row) => row?.id, 'ytm-top')
    void localizeRows(artistProfileYtAlbums, setArtistProfileYtAlbums, (row) => row?.key, 'ytm-album')
    void localizeRows(artistProfileYtSingles, setArtistProfileYtSingles, (row) => row?.key, 'ytm-single')

    if (artistProfileSelectedYtRelease?.key && Array.isArray(artistProfileSelectedYtReleaseTracks)) {
      void localizeRows(
        artistProfileSelectedYtReleaseTracks,
        (rows) =>
          setArtistProfileReleaseTracksByKey((prev) => ({
            ...prev,
            [artistProfileSelectedYtRelease.key]: rows,
          })),
        (row) => row?.id || row?.url || row?.title,
        `ytm-release-${artistProfileSelectedYtRelease.key}`,
      )
    }

    return () => {
      cancelled = true
    }
  }, [
    artistProfileOpen,
    artistProfileYtTopSongs,
    artistProfileYtAlbums,
    artistProfileYtSingles,
    artistProfileSelectedYtRelease,
    artistProfileSelectedYtReleaseTracks,
    persistRemoteCoverUrlLocally,
  ])

  const handleCoverSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const coverUrl = URL.createObjectURL(file)
    assetUrlsRef.current.push(coverUrl)
    setPendingCover({ coverBlob: file, coverUrl, coverName: file.name })
    setCoverRemovalRequested(false)
    setCoverMenuOpen(false)
    event.target.value = ''
  }

  const handlePlaylistCoverSelect = async (event, target = 'create') => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const coverUrl = await readFileAsDataUrl(file)
      if (target === 'edit') {
        setPlaylistEditCoverDraft(coverUrl)
      } else {
        setPlaylistCoverDraft(coverUrl)
      }
    } catch {
      // Ignore invalid image files.
    } finally {
      event.target.value = ''
    }
  }

  const saveTrackChanges = async () => {
    if (!editTargetId || !editDraft) {
      return
    }

    const originalTrack = allTracks.find((track) => track.id === editTargetId)
    if (!originalTrack) {
      return
    }

    const newTitle = cleanFilenameTrackTitle(editDraft.title) || 'Bilinmeyen Şarkı'
    const newArtist = editDraft.artist.trim() || 'Bilinmeyen Sanatci'
    const newAlbum = editDraft.album?.trim() || 'Single'

    // Check if artist or title has changed
    const artistChanged = normalizeArtistQuery(originalTrack.artist || '') !== normalizeArtistQuery(newArtist)
    const titleChanged = originalTrack.title !== newTitle
    const albumChanged =
      normalizeCoverMatchText(originalTrack.album || 'Single') !== normalizeCoverMatchText(newAlbum || 'Single')

    let nextCover = pendingCover
      ? {
          coverBlob: pendingCover.coverBlob,
          coverUrl: pendingCover.coverUrl,
          coverName: pendingCover.coverName,
          coverRemoteUrl: '',
          coverTone: '',
        }
      : coverRemovalRequested
        ? {
            coverBlob: null,
            coverUrl: '',
            coverName: '',
            coverRemoteUrl: '',
            coverTone: '',
          }
        : {}
    let resolvedAlbum = newAlbum
    let resolvedGenre = normalizeGenreName(originalTrack?.genre || '')

    // If artist/title/album changed and no manual cover was provided, refresh remote metadata.
    if ((artistChanged || titleChanged || albumChanged) && !pendingCover && !coverRemovalRequested && newTitle && newArtist && newArtist !== 'Yerel Koleksiyon') {
      try {
        const cacheKey = `${normalizeArtistQuery(newArtist)}|${newTitle}`.toLowerCase()
        const remoteMeta = await fetchRemoteTrackMetaSmart(newTitle, newArtist, {
          preferredAlbum: newAlbum,
          preferredDuration: Number(originalTrack?.duration || 0),
        })
        const remoteCoverUrl = remoteMeta.coverUrl || ''
        const remoteAlbum = String(remoteMeta?.album || '').trim()
        const remoteGenre = normalizeGenreName(remoteMeta?.genre || '')

        // Update caches
      setLruCacheValue(coverArtCacheRef.current, cacheKey, remoteCoverUrl, MAX_COVER_CACHE_ENTRIES)
      setLruCacheValue(albumCacheRef.current, cacheKey, remoteAlbum, MAX_ALBUM_CACHE_ENTRIES)
      setLruCacheValue(genreCacheRef.current, cacheKey, remoteGenre, MAX_GENRE_CACHE_ENTRIES)
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        saveJsonCache(GENRE_CACHE_KEY, genreCacheRef.current)

        // If we got a cover, extract dominant color
        if (remoteCoverUrl) {
          try {
            const tone = await extractDominantColor(remoteCoverUrl)
            nextCover.coverTone = tone || ''
          } catch {
            nextCover.coverTone = ''
          }
        }

        if (remoteCoverUrl) {
          nextCover.coverRemoteUrl = remoteCoverUrl

          // If album was explicitly changed, prioritize the newly found album cover.
          if (albumChanged) {
            nextCover.coverBlob = null
            nextCover.coverUrl = remoteCoverUrl
            nextCover.coverName = 'Albüm kapağı (otomatik)'
          }
        }

        if (remoteAlbum && (artistChanged || titleChanged || albumChanged || normalizeCoverMatchText(newAlbum) === 'single')) {
          resolvedAlbum = remoteAlbum
        }
        if (remoteGenre) {
          resolvedGenre = remoteGenre
        }
      } catch {
        // Silently fail - use original values
      }
    }

    updateTrack(editTargetId, {
      title: newTitle,
      artist: newArtist,
      album: resolvedAlbum,
      genre: resolvedGenre,
      ...nextCover,
    })

    closeEditor()
  }

  const saveBulkTrackChanges = async () => {
    if (!bulkEditDrafts.length && !bulkEditInitialDrafts.length) {
      closeBulkEditor()
      return
    }

    setBulkEditSaving(true)
    try {
      const updatesList = []

      for (const draft of bulkEditDrafts) {
        const originalTrack = trackByIdMap.get(draft.id)
        if (!originalTrack) {
          continue
        }

        const newTitle = cleanFilenameTrackTitle(String(draft.title || '')) || 'Bilinmeyen Şarkı'
        const newArtist = String(draft.artist || '').trim() || 'Bilinmeyen Sanatci'
        const inputAlbum = String(draft.album || '').trim()
        const newAlbum = inputAlbum || 'Single'
        const previewCoverUrl = String(draft.coverPreviewUrl || '').trim()
        const originalCoverUrl = String(originalTrack.coverUrl || originalTrack.coverRemoteUrl || '').trim()

        const artistChanged =
          normalizeArtistQuery(originalTrack.artist || '') !== normalizeArtistQuery(newArtist)
        const titleChanged = String(originalTrack.title || '') !== newTitle
        const albumEdited =
          normalizeCoverMatchText(originalTrack.album || 'Single') !== normalizeCoverMatchText(newAlbum)
        const manualCoverChanged =
          Boolean(draft.coverBlob) ||
          Boolean(draft.removeCover) ||
          (Boolean(previewCoverUrl) && previewCoverUrl !== originalCoverUrl)
        const shouldRefreshMeta =
          (artistChanged || titleChanged) &&
          newTitle &&
          newArtist &&
          newArtist !== 'Yerel Koleksiyon'

        if (!artistChanged && !titleChanged && !albumEdited && !manualCoverChanged) {
          continue
        }

        let remoteMeta = null
        if (shouldRefreshMeta) {
          try {
            remoteMeta = await fetchRemoteTrackMetaSmart(newTitle, newArtist, {
              preferredAlbum: newAlbum,
              preferredDuration: Number(originalTrack?.duration || 0),
            })
          } catch {
            remoteMeta = null
          }
        }

        const nextUpdate = {
          title: newTitle,
          artist: newArtist,
          album:
            shouldRefreshMeta &&
            (!albumEdited || normalizeCoverMatchText(newAlbum) === 'single') &&
            String(remoteMeta?.album || '').trim()
              ? String(remoteMeta.album).trim()
              : newAlbum,
          genre:
            shouldRefreshMeta && normalizeGenreName(remoteMeta?.genre || '')
              ? normalizeGenreName(remoteMeta?.genre || '')
              : normalizeGenreName(originalTrack.genre || ''),
        }

        let changedCoverSource = ''
        if (draft.removeCover) {
          nextUpdate.coverBlob = null
          nextUpdate.coverUrl = ''
          nextUpdate.coverRemoteUrl = ''
          nextUpdate.coverName = ''
          nextUpdate.coverTone = ''
        } else if (draft.coverBlob && previewCoverUrl) {
          changedCoverSource = previewCoverUrl
          nextUpdate.coverBlob = draft.coverBlob
          nextUpdate.coverUrl = previewCoverUrl
          nextUpdate.coverRemoteUrl = ''
          nextUpdate.coverName = draft.coverName || draft.coverBlob.name || 'Kapak'
        } else if (shouldRefreshMeta && String(remoteMeta?.coverUrl || '').trim()) {
          changedCoverSource = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverBlob = null
          nextUpdate.coverUrl = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverRemoteUrl = String(remoteMeta.coverUrl).trim()
          nextUpdate.coverName = 'Albüm kapağı (otomatik)'
        }

        if (changedCoverSource) {
          try {
            nextUpdate.coverTone = await extractDominantColor(changedCoverSource)
          } catch {
            nextUpdate.coverTone = ''
          }
        }

        if (shouldRefreshMeta) {
          const cacheKey = `${normalizeArtistQuery(newArtist)}|${newTitle}`.toLowerCase()
          setLruCacheValue(
            coverArtCacheRef.current,
            cacheKey,
            String(remoteMeta?.coverUrl || '').trim(),
            MAX_COVER_CACHE_ENTRIES,
          )
          setLruCacheValue(
            albumCacheRef.current,
            cacheKey,
            String(remoteMeta?.album || '').trim(),
            MAX_ALBUM_CACHE_ENTRIES,
          )
        }

        updatesList.push({ id: draft.id, updates: nextUpdate })
      }

      const draftIds = new Set(bulkEditDrafts.map((item) => item.id))
      const removedTrackIds = tracks
        .filter((track) => !draftIds.has(track.id))
        .map((track) => track.id)

      if (updatesList.length || removedTrackIds.length) {
        saveJsonCache(COVER_ART_CACHE_KEY, coverArtCacheRef.current)
        saveJsonCache(ALBUM_CACHE_KEY, albumCacheRef.current)
        if (updatesList.length) {
          applyBulkTrackUpdates(updatesList)
        }
        if (removedTrackIds.length) {
          const removedSet = new Set(removedTrackIds)
          setTracks((prev) => prev.filter((track) => !removedSet.has(track.id)))
          setPlaylists((prev) =>
            prev.map((playlist) => ({
              ...playlist,
              trackIds: playlist.trackIds.filter((id) => !removedSet.has(id)),
            })),
          )
          if (removedSet.has(currentTrackId)) {
            setCurrentTrackId(null)
            setIsPlaying(false)
            setProgress(0)
            setDuration(0)
          }
        }
        showUploadNotice(
          `${updatesList.length} şarkı güncellendi, ${removedTrackIds.length} şarkı silindi.`,
        )
      } else {
        showUploadNotice('Değişiklik bulunamadı.')
      }
      setBulkEditOpen(false)
      setBulkEditDrafts([])
      setBulkEditInitialDrafts([])
      setBulkCoverMenuTrackId(null)
      setBulkCoverTargetTrackId(null)
    } finally {
      setBulkEditSaving(false)
    }
  }

  const handleSaveTrackChanges = () => {
    saveTrackChanges().catch(() => {})
  }

  const toggleTrackPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        const hasTrack = playlist.trackIds.includes(trackId)
        return {
          ...playlist,
          trackIds: hasTrack
            ? playlist.trackIds.filter((id) => id !== trackId)
            : [...playlist.trackIds, trackId],
        }
      }),
    )
  }

  const addTrackToPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((playlist) => {
        if (playlist.id !== playlistId) {
          return playlist
        }

        const hasTrack = playlist.trackIds.includes(trackId)

        return {
          ...playlist,
          trackIds: hasTrack
            ? playlist.trackIds.filter((id) => id !== trackId)
            : [...playlist.trackIds, trackId],
        }
      }),
    )
  }

  const queueTrackAsNext = (trackId) => {
    if (!trackId || trackId === currentTrackId) {
      return
    }

    const nextQueue = [
      ...sanitizeQueue(queuedNextTrackIdsRef.current).filter((id) => id !== trackId),
      trackId,
    ]
    applyQueuedNextTracks(nextQueue)
  }

  const reorderUpcomingQueueByDrag = (draggedId, droppedOnId) => {
    if (!draggedId || !droppedOnId || draggedId === droppedOnId) {
      return
    }

    const upcomingIds = upcomingPlaybackTracks
      .map((track) => track?.id)
      .filter((id) => id && id !== currentTrackId)

    if (!upcomingIds.length) {
      return
    }

    const fromIndex = upcomingIds.indexOf(draggedId)
    const toIndex = upcomingIds.indexOf(droppedOnId)
    if (fromIndex < 0 || toIndex < 0) {
      return
    }

    const nextIds = [...upcomingIds]
    const [moved] = nextIds.splice(fromIndex, 1)
    nextIds.splice(toIndex, 0, moved)
    applyQueuedNextTracks(nextIds)
  }

  const createPlaylist = (options = {}) => {
    const overrideName = String(options?.name || '').trim()
    const overrideDescription = String(options?.description || '').trim()
    const overrideCoverUrl = String(options?.coverUrl || '').trim()
    const optionTrackIds = Array.isArray(options?.trackIds) ? options.trackIds.filter(Boolean) : null
    const draftTxtTrackIds = Array.isArray(playlistTxtImportedTrackIds) ? playlistTxtImportedTrackIds.filter(Boolean) : []
    const initialTrackIds = Array.from(new Set((optionTrackIds ?? draftTxtTrackIds)))
    const keepCreatorOpen = Boolean(options?.keepCreatorOpen)

    const trimmed = overrideName || playlistNameDraft.trim()
    const trimmedDescription = overrideDescription || playlistDescriptionDraft.trim()
    if (!trimmed) {
      return null
    }

    const newPlaylist = {
      id: `playlist-${Date.now()}`,
      name: trimmed,
      description: trimmedDescription,
      trackIds: initialTrackIds,
      color: playlistColorDraft,
      coverUrl: overrideCoverUrl || playlistCoverDraft || '',
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    setSelectedCollectionId(newPlaylist.id)
    if (!keepCreatorOpen) {
      setCreatingPlaylist(false)
      setPlaylistNameDraft('')
      setPlaylistDescriptionDraft('')
      setPlaylistTxtFileName('')
      setPlaylistTxtImportedTrackIds([])
      setPlaylistTxtEntriesDraft([])
    }
    return newPlaylist
  }

  const parsePlaylistTxtEntries = (rawText = '') => {
    const lines = String(rawText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    const entries = []
    for (const line of lines) {
      const cleaned = line
        .replace(/^\d+\s*[-.)]\s*/, '')
        .replace(/^\[\d+\]\s*/, '')
        .replace(/^[-*•]\s*/, '')
        .trim()
      if (!cleaned) continue

      const splitByDash = cleaned.split(/\s[-–—]\s/)
      let artist = ''
      let title = cleaned
      if (splitByDash.length >= 2) {
        artist = splitByDash[0].trim()
        title = splitByDash.slice(1).join(' - ').trim()
      }

      const query = `${artist} ${title}`.trim()
      entries.push({
        artist,
        title,
        query: query || cleaned,
      })
    }

    return entries.filter((item) => item.query)
  }

  const pickBestMusicSearchResult = (candidate, entries = []) => {
    if (!entries.length) return null
    const queryNorm = normalizeCoverMatchText(candidate?.query || '')
    const artistNorm = normalizeCoverMatchText(candidate?.artist || '')
    const bannedVersionPattern =
      /\b(?:slowed|slow\s*reverb|reverb|sped\s*up|spedup|nightcore|karaoke|8d|bass\s*boost(?:ed)?|live|concert|konser|performance|canli\s*performans)\b/i

    let best = null
    let bestScore = Number.NEGATIVE_INFINITY
    for (const item of entries) {
      const titleNorm = normalizeCoverMatchText(item?.title || '')
      const uploaderNorm = normalizeCoverMatchText(item?.artist || '')
      const rawTitle = String(item?.title || '')
      const rawUploader = String(item?.artist || '')
      if (
        bannedVersionPattern.test(rawTitle) ||
        bannedVersionPattern.test(rawUploader) ||
        bannedVersionPattern.test(titleNorm) ||
        bannedVersionPattern.test(uploaderNorm)
      ) {
        continue
      }
      const duration = Number(item?.duration || 0)
      let score = 0

      if (duration >= 60 && duration <= 12 * 60) score += 3
      if (duration > 0 && duration < 45) score -= 6
      if (duration > 12 * 60) score -= 2

      if (queryNorm && titleNorm.includes(queryNorm)) score += 6
      if (artistNorm && (titleNorm.includes(artistNorm) || uploaderNorm.includes(artistNorm))) score += 5
      if (titleNorm.includes('official audio') || uploaderNorm.includes('topic')) score += 2
      if (titleNorm.includes('music video')) score += 1
      if (score > bestScore) {
        bestScore = score
        best = item
      }
    }
    return best
  }

  const importPlaylistFromTxt = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      setPlaylistTxtFileName(file.name)
      setPlaylistTxtImportedTrackIds([])
      setPlaylistTxtEntriesDraft([])
      const text = await file.text()
      const entries = parsePlaylistTxtEntries(text).slice(0, 250)
      if (!entries.length) {
        setPlaylistTxtImportedTrackIds([])
        showUploadNotice('TXT içinde geçerli şarkı satırı bulunamadı.')
        return
      }
      setPlaylistTxtEntriesDraft(entries)
      if (!playlistNameDraft.trim()) {
        const fallbackName = file.name.replace(/\.[^.]+$/, '').trim()
        if (fallbackName) {
          setPlaylistNameDraft(fallbackName)
        }
      }
      showUploadNotice(`TXT hazır: ${entries.length} satır. Oluştur'a basınca playlist'e eklenecek.`)
    } catch {
      showUploadNotice('TXT içe aktarma başarısız oldu.')
    }
  }

  const createPlaylistFromDraft = async () => {
    const fallbackName = playlistTxtFileName ? playlistTxtFileName.replace(/\.[^.]+$/, '').trim() : ''
    const newPlaylist = createPlaylist({
      name: playlistNameDraft.trim() || fallbackName || `Playlist ${Date.now()}`,
      description: playlistDescriptionDraft,
      trackIds: [],
      keepCreatorOpen: false,
    })
    if (!newPlaylist) {
      return
    }

    const pendingEntries = Array.isArray(playlistTxtEntriesDraft) ? playlistTxtEntriesDraft : []
    if (!pendingEntries.length) {
      showUploadNotice(`Playlist oluşturuldu: ${newPlaylist.name}`)
      return
    }
    if (!window.novaPlayer?.searchYtMusic && !window.novaPlayer?.searchYoutube) {
      showUploadNotice('Playlist oluşturuldu, ama bu sürümde arama desteği yok.')
      return
    }

    try {
      playlistTxtImportCancelRef.current = false
      setPlaylistTxtImporting(true)
      setPlaylistTxtImportPlaylistId(newPlaylist.id)
      setPlaylistTxtReviewItems([])
      setPlaylistTxtReviewOpen(true)
      const importedTrackIds = []
      const progressNoticeId = `playlist-txt-import-${Date.now()}`
      playlistTxtImportNoticeIdRef.current = progressNoticeId
      setNotifications((prev) => [
        {
          id: progressNoticeId,
          message: `TXT playlist ekleniyor... 0/${pendingEntries.length}`,
          createdAt: Date.now(),
          read: false,
          actionLabel: 'Aktarmayı iptal et',
          actionType: 'cancel-txt-import',
        },
        ...prev,
      ].slice(0, 120))
      setHasUnreadNotifications(true)

      const TXT_IMPORT_CONCURRENCY = 3
      let processedCount = 0
      const processEntry = async (entry) => {
        if (playlistTxtImportCancelRef.current) {
          processedCount += 1
          return
        }
        const result = window.novaPlayer?.searchYtMusic
          ? await window.novaPlayer.searchYtMusic({ query: entry.query, limit: 8 })
          : await window.novaPlayer.searchYoutube({ query: entry.query, limit: 8 })
        const items = Array.isArray(result?.items) ? result.items : []
        const picked = pickBestMusicSearchResult(entry, items)
        if (picked?.url) {
          const addedTracks = await handleLinkAdd(
            {
              audioUrl: picked.url,
              title: entry.title || picked.title || '',
              artist: entry.artist || picked.artist || '',
            },
            { keepModalOpen: true, suppressNotice: true },
          )
          addedTracks.forEach((track) => {
            if (track?.id) {
              importedTrackIds.push(track.id)
              appendTrackToPlaylist(newPlaylist.id, track.id)
              setPlaylistTxtReviewItems((prev) => [
                {
                  id: `${track.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  entryTitle: entry.title || '',
                  entryArtist: entry.artist || '',
                  trackId: track.id,
                  trackTitle: track.title || entry.title || 'Bilinmeyen şarkı',
                  trackArtist: track.artist || entry.artist || 'Bilinmeyen sanatçı',
                },
                ...prev,
              ])
            }
          })
        }
        processedCount += 1
        setNotifications((prev) =>
          prev.map((notice) =>
            notice.id === progressNoticeId
              ? { ...notice, message: `TXT playlist ekleniyor... ${Math.min(processedCount, pendingEntries.length)}/${pendingEntries.length}` }
              : notice,
          ),
        )
      }

      for (let start = 0; start < pendingEntries.length; start += TXT_IMPORT_CONCURRENCY) {
        if (playlistTxtImportCancelRef.current) {
          break
        }
        const batch = pendingEntries.slice(start, start + TXT_IMPORT_CONCURRENCY)
        // Aynı anda 3 arama/indirme
        await Promise.all(
          batch.map((entry) =>
            processEntry(entry).catch(() => {
              processedCount += 1
            }),
          ),
        )
      }

      const uniqueIds = Array.from(new Set(importedTrackIds))
      setPlaylistTxtImportedTrackIds(uniqueIds)

      if (playlistTxtImportCancelRef.current) {
        showUploadNotice(`Aktarım iptal edildi: ${newPlaylist.name} (${uniqueIds.length} parça eklendi)`)
      } else {
        showUploadNotice(
          uniqueIds.length
            ? `Playlist hazır: ${newPlaylist.name} (${uniqueIds.length} parça eklendi)`
            : `Playlist oluşturuldu: ${newPlaylist.name}. Eşleşen müzik bulunamadı.`,
        )
      }
    } catch {
      showUploadNotice('Playlist oluşturuldu, ancak TXT şarkıları eklenirken hata oluştu.')
    } finally {
      const activeNoticeId = playlistTxtImportNoticeIdRef.current
      if (activeNoticeId) {
        setNotifications((prev) => prev.filter((notice) => notice.id !== activeNoticeId))
      }
      playlistTxtImportNoticeIdRef.current = ''
      playlistTxtImportCancelRef.current = false
      setPlaylistTxtImporting(false)
      setPlaylistTxtEntriesDraft([])
      setPlaylistTxtFileName('')
      setPlaylistTxtImportPlaylistId('')
    }
  }

  const shufflePlayCollectionById = (collectionId) => {
    const targetTracks = getTracksByCollectionId(collectionId)
    if (!targetTracks.length) {
      handleCollectionSelect(collectionId)
      return
    }
    const randomIndex = Math.floor(Math.random() * targetTracks.length)
    const randomTrack = targetTracks[randomIndex] || targetTracks[0]
    handleCollectionSelect(collectionId)
    shuffleSeedRef.current = `${Date.now()}-${Math.random()}`
    applyQueuedNextTracks([])
    applyShuffleOrderIds([])
    setRepeatEnabled(false)
    setShuffleEnabled(true)
    switchTrack(randomTrack, true, {
      enforceCooldown: true,
      collectionId,
    })
  }

  const savePlaylistChanges = () => {
    const nextName = playlistEditDraft.trim()
    const nextDescription = playlistEditDescriptionDraft.trim()
    if (!editingPlaylistId || !nextName) {
      return
    }

    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === editingPlaylistId
          ? {
              ...playlist,
              name: nextName,
              description: nextDescription,
              color: playlistEditColorDraft,
              coverUrl: playlistEditCoverDraft || '',
            }
          : playlist,
      ),
    )
    closePlaylistEditor()
  }

  const requestDeletePlaylist = (playlistId) => {
    const playlist = playlists.find((item) => item.id === playlistId)
    if (!playlist) {
      return
    }
    setPendingDeletePlaylistId(playlistId)
  }

  const deletePlaylist = (playlistId) => {
    const playlist = playlists.find((item) => item.id === playlistId)
    if (!playlist) {
      return
    }

    setPlaylists((prev) => prev.filter((item) => item.id !== playlistId))
    if (selectedCollectionId === playlistId) {
      setSelectedCollectionId('all')
    }

    if (editingPlaylistId === playlistId) {
      closePlaylistEditor()
    }
    setPendingDeletePlaylistId(null)
  }

  const toggleFavorite = (trackId) => {
    const track = allTracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }

    const nextFavoriteState = !track.isFavorite
    setFavoriteTrackIds((prev) =>
      nextFavoriteState ? Array.from(new Set([...prev, trackId])) : prev.filter((id) => id !== trackId),
    )

    if (track.source === 'drive') {
      setServerTracks((prev) =>
        prev.map((item) => (item.id === trackId ? { ...item, isFavorite: nextFavoriteState } : item)),
      )
      return
    }

    updateTrack(trackId, { isFavorite: nextFavoriteState })
  }

  const togglePinned = (trackId) => {
    const track = allTracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }
    const nextPinnedState = !Boolean(track.isPinned)
    setPinnedTrackIds((prev) =>
      nextPinnedState ? Array.from(new Set([...prev, trackId])) : prev.filter((id) => id !== trackId),
    )
    setTracks((prev) =>
      prev.map((item) => (item.id === trackId ? { ...item, isPinned: nextPinnedState } : item)),
    )
    setServerTracks((prev) =>
      prev.map((item) => (item.id === trackId ? { ...item, isPinned: nextPinnedState } : item)),
    )
    updateTrack(trackId, { isPinned: nextPinnedState })
  }

  const toggleCurrentTrackFavorite = () => {
    if (!currentTrack) {
      return
    }

    toggleFavorite(currentTrack.id)

    if (dockFavoritePulseTimerRef.current) {
      window.clearTimeout(dockFavoritePulseTimerRef.current)
    }

    setDockFavoritePulseId(currentTrack.id)
    dockFavoritePulseTimerRef.current = window.setTimeout(() => {
      setDockFavoritePulseId(null)
    }, 220)
  }

  useEffect(() => {
    return () => {
      if (dockFavoritePulseTimerRef.current) {
        window.clearTimeout(dockFavoritePulseTimerRef.current)
      }
    }
  }, [])

  const requestDeleteTrack = (trackId) => {
    const track = tracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }
    setTrackMenuId(null)
    setTrackMenuPosition(null)
    setPendingDeleteTrackId(trackId)
  }

  const deleteTrack = async (trackId) => {
    const track = tracks.find((item) => item.id === trackId)
    if (!track) {
      return
    }

    // Yerel dosyayı gerçekten diskten silmeyi dene.
    if (window.novaPlayer?.deleteLocalTrackFile) {
      try {
        await window.novaPlayer.deleteLocalTrackFile({
          fileName: track.fileName || '',
          audioUrl: track.audioUrl || '',
        })
      } catch {
        // UI silme akışı devam etsin
      }
    }

    releaseTrackResources(track)
    deleteStoredTrack(trackId).catch(() => {})

    setTracks((prev) => {
      const deletionIndex = prev.findIndex((item) => item.id === trackId)
      const next = prev.filter((item) => item.id !== trackId)
      const activePlaylist =
        selectedCollectionId === 'all'
          ? null
          : playlists.find((playlist) => playlist.id === selectedCollectionId) || null
      const nextVisible =
        !activePlaylist
          ? next
          : next.filter((item) => activePlaylist.trackIds.includes(item.id))

      if (currentTrackId === trackId) {
        const replacement =
          nextVisible[deletionIndex] || nextVisible[deletionIndex - 1] || nextVisible[0] || next[0] || null
        setCurrentTrackId(replacement?.id || null)
        setProgress(0)
        setDuration(replacement?.duration || 0)
        setIsPlaying(Boolean(replacement))
      }

      if (editTargetId === trackId) {
        closeEditor()
      }

      return next
    })

    setPlaylists((prev) =>
      prev.map((playlist) => ({
        ...playlist,
        trackIds: playlist.trackIds.filter((id) => id !== trackId),
      })),
    )

    setTrackMenuId(null)
    setPendingDeleteTrackId(null)
  }

  const openTrackMenu = (trackId, anchorEl, pointer = null) => {
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    setDockPlaylistMenuOpen(false)
    setPlaylistMenuTrackId(null)
    setPlaylistMenuPosition(null)
    if (trackMenuId === trackId) {
      setTrackMenuId(null)
      setTrackMenuPosition(null)
      return
    }

    const rect = anchorEl?.getBoundingClientRect()
    const menuWidth = 280
    const menuEstimatedHeight = 340
    const horizontalPadding = 12
    const verticalPadding = 12
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    if (pointer && Number.isFinite(pointer.x) && Number.isFinite(pointer.y)) {
      const left = Math.min(
        Math.max(pointer.x, horizontalPadding),
        Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
      )
      const top = Math.min(
        Math.max(pointer.y, verticalPadding),
        Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
      )
      setTrackMenuId(trackId)
      setTrackMenuPosition({
        position: 'fixed',
        top,
        left,
      })
      return
    }
    const left = rect
        ? Math.min(
          Math.max(rect.right - menuWidth, horizontalPadding),
          Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
        )
      : horizontalPadding
    const fitsBelow = rect
      ? rect.bottom + 8 + menuEstimatedHeight <= viewportHeight - verticalPadding
      : true

    setTrackMenuId(trackId)
    setTrackMenuPosition(
      rect
        ? fitsBelow
          ? {
              position: 'fixed',
              top: Math.min(
                rect.bottom + 8,
                Math.max(verticalPadding, viewportHeight - menuEstimatedHeight - verticalPadding),
              ),
              left,
            }
          : {
              position: 'fixed',
              bottom: Math.max(viewportHeight - rect.top + 8, verticalPadding),
              left,
            }
        : {
            position: 'fixed',
            top: 96,
            left: horizontalPadding,
          },
    )
  }

  const openPlaylistMenu = (trackId, anchorEl) => {
    setPlaylistContextMenuId(null)
    setPlaylistContextMenuPosition(null)
    const rect = anchorEl?.getBoundingClientRect()
    const horizontalPadding = 12
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
    const menuWidth = Math.min(360, Math.max(280, viewportWidth - horizontalPadding * 2))
    const preferredLeft = rect
      ? rect.left + rect.width / 2 - menuWidth / 2
      : horizontalPadding
    const left = Math.min(
      Math.max(preferredLeft, horizontalPadding),
      Math.max(horizontalPadding, viewportWidth - menuWidth - horizontalPadding),
    )
    const fitsAbove = rect ? rect.top - 240 > 12 : true

    setPlaylistMenuTrackId(trackId)
    setPlaylistMenuPosition(
      rect
        ? fitsAbove
          ? {
              position: 'fixed',
              top: Math.max(rect.top - 12, 12),
              left,
              transform: 'translateY(-100%)',
            }
          : {
              position: 'fixed',
              top: Math.min(rect.bottom + 12, viewportHeight - 24),
              left,
            }
        : {
            position: 'fixed',
            bottom: 96,
            left: horizontalPadding,
          },
    )
    setDockPlaylistMenuOpen(true)
    setTrackMenuId(null)
    setTrackMenuPosition(null)
  }

  const toggleDockPlaylistMenu = (anchorEl) => {
    if (dockPlaylistMenuOpen && playlistMenuPosition) {
      setDockPlaylistMenuOpen(false)
      setPlaylistMenuTrackId(null)
      setPlaylistMenuPosition(null)
      return
    }

    if (currentTrack) {
      openPlaylistMenu(currentTrack.id, anchorEl)
    }
  }

  const openTrackPlaylistMenu = (trackId, anchorEl) => {
    openPlaylistMenu(trackId, anchorEl)
  }

  const handleMediaShortcutInputKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') {
      setMediaToggleShortcut('')
      return
    }

    const nextShortcut = mediaShortcutFromKeyboardEvent(event)
    if (typeof nextShortcut === 'string') {
      setMediaToggleShortcut(nextShortcut.trim())
    }
  }, [])

  const handleResetShortcutInputKeyDown = useCallback((event) => {
    if (event.key === 'Tab') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') {
      setResetShortcut('Ctrl+Shift+R')
      return
    }

    const nextShortcut = mediaShortcutFromKeyboardEvent(event)
    if (typeof nextShortcut === 'string') {
      setResetShortcut(nextShortcut.trim())
    }
  }, [])

  const showGlobalUpdaterCard =
    Boolean(updaterUiState?.supported) &&
    Boolean(updaterUiState?.error)

  const showUpdaterCenterModal =
    Boolean(updaterUiState?.supported) &&
    Boolean(updaterCenterModalOpen) &&
    (Boolean(updaterUiState?.updateAvailable) ||
      Boolean(updaterUiState?.downloading) ||
      Boolean(updaterUiState?.downloaded))

  const showUpdaterInNotifications =
    Boolean(updaterUiState?.supported) &&
    !showUpdaterCenterModal &&
    (Boolean(updaterUiState?.updateAvailable) ||
      Boolean(updaterUiState?.downloading) ||
      Boolean(updaterUiState?.downloaded))

  return (
    <div className={appShellLayoutClass} style={themeVars} onClick={closeMenus}>
      <audio ref={audioRef} />

      {firstRunWizardOpen ? (
        <div className="first-run-wizard-overlay" onClick={(event) => event.stopPropagation()}>
          <div className="first-run-wizard-card glass">
            <div className="panel-header">
              <div>
                <p className="eyebrow">{t('firstRun', 'İlk kurulum')}</p>
              </div>
            </div>
            <div className="first-run-wizard-progress">
              <div className="first-run-wizard-progress-head">
                <span>{tf('firstRunStep', { current: firstRunWizardStep, total: 3 }, 'Adım {current}/{total}')}</span>
                <span>%{Math.round((firstRunWizardStep / 3) * 100)}</span>
              </div>
              <div className="first-run-wizard-progress-track">
                <span
                  className="first-run-wizard-progress-fill"
                  style={{ width: `${Math.round((firstRunWizardStep / 3) * 100)}%` }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
            {firstRunWizardStep === 1 ? (
              <MotionDiv
                key="first-run-step-1"
                className="first-run-wizard-section"
                initial={{ opacity: 0, x: 18, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.98 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <p className="about-title">{t('welcome', 'Hoş geldin')}</p>
                <p className="about-text">
                  {t(
                    'firstRunIntro',
                    'İlk kurulumda tema, dil ve kapanış davranışını ayarlayalım. Yardımcı modüller eksikse uygulama içinde ayrı menüde göstereceğiz.',
                  )}
                </p>
                <div className="editor-actions">
                  <button className="mini-button" onClick={() => setFirstRunWizardStep(2)}>
                    {t('continue', 'Devam et')}
                  </button>
                </div>
              </MotionDiv>
            ) : null}

            {firstRunWizardStep === 2 ? (
              <MotionDiv
                key="first-run-step-2"
                className="first-run-wizard-section"
                initial={{ opacity: 0, x: 18, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.98 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <p className="about-title">{t('firstRunThemeTitle', '1. Tema seçimi')}</p>
                <div className="menu-options">
                  {[
                    { value: 'dark', label: t('dark', 'Koyu') },
                    { value: 'gray', label: t('gray', 'Grimsi') },
                    { value: 'light', label: t('light', 'Açık') },
                    { value: 'transparent', label: t('transparent', 'Şeffaf') },
                    { value: 'custom', label: t('customTheme', 'Özel renk') },
                  ].map((item) => (
                    <button
                      key={`first-run-theme-${item.value}`}
                      type="button"
                      className={`menu-item ${item.value === 'custom' ? 'custom-theme-option' : ''} ${themeMode === item.value ? 'selected' : ''}`.trim()}
                      onClick={() => setThemeMode(item.value)}
                    >
                      <span>{item.label}</span>
                      {item.value === 'custom' ? <small>{language === 'en' ? 'NEW' : 'YENİ'}</small> : null}
                    </button>
                  ))}
                </div>
                {themeMode === 'custom' ? (
                  <label className="settings-color-field first-run-color-field">
                    <span>{t('themeColor', 'Tema rengi')}</span>
                    <input
                      type="color"
                      value={customThemeColor}
                      onChange={(event) => setCustomThemeColor(event.target.value)}
                    />
                  </label>
                ) : null}
                <p className="about-title">{t('firstRunLanguageTitle', 'Dil')}</p>
                <div className="menu-options">
                  {[
                    { value: 'tr', label: 'Türkçe' },
                    { value: 'en', label: 'English' },
                  ].map((item) => (
                    <button
                      key={`first-run-lang-${item.value}`}
                      type="button"
                      className={`menu-item ${language === item.value ? 'selected' : ''}`}
                      onClick={() => setLanguage(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setFirstRunWizardStep(1)}>
                    {t('back', 'Geri')}
                  </button>
                  <button className="mini-button" onClick={() => setFirstRunWizardStep(3)}>
                    {t('continue', 'Devam et')}
                  </button>
                </div>
              </MotionDiv>
            ) : null}

            {firstRunWizardStep === 3 ? (
              <MotionDiv
                key="first-run-step-3"
                className="first-run-wizard-section"
                initial={{ opacity: 0, x: 18, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -18, scale: 0.98 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                <p className="about-title">{t('firstRunCloseTitle', '2. Kapatma davranışı')}</p>
                <div className="menu-options">
                  {[
                    { value: 'tray', label: t('closeTray', 'Arka planda kalsın') },
                    { value: 'quit', label: t('closeQuit', 'Tamamen kapansın') },
                  ].map((item) => (
                    <button
                      key={`first-run-close-${item.value}`}
                      type="button"
                      className={`menu-item ${closeBehavior === item.value ? 'selected' : ''}`}
                      onClick={() => setCloseBehavior(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="about-title">{t('launchOnStartup', 'Bilgisayar açıldığında uygulamayı otomatik başlat')}</p>
                <div className="menu-options">
                  <button
                    type="button"
                    className={`menu-item ${launchOnStartupEnabled ? 'selected' : ''}`}
                    onClick={() => setLaunchOnStartupEnabled(true)}
                  >
                    {t('on', 'Açık')}
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${!launchOnStartupEnabled ? 'selected' : ''}`}
                    onClick={() => setLaunchOnStartupEnabled(false)}
                  >
                    {t('off', 'Kapalı')}
                  </button>
                </div>
                <p className="about-title">{t('firstRunAnimationTitle', 'Animasyon')}</p>
                <div className="menu-options">
                  <button
                    type="button"
                    className={`menu-item ${!reduceAnimationsEnabled ? 'selected' : ''}`}
                    onClick={() => setReduceAnimationsEnabled(false)}
                  >
                    {t('normal', 'Normal')}
                  </button>
                  <button
                    type="button"
                    className={`menu-item ${reduceAnimationsEnabled ? 'selected' : ''}`}
                    onClick={() => setReduceAnimationsEnabled(true)}
                  >
                    {t('reduced', 'Azaltılmış')}
                  </button>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setFirstRunWizardStep(2)}>
                    {t('back', 'Geri')}
                  </button>
                  <button className="mini-button" onClick={completeFirstRunWizard}>
                    {t('finish', 'Bitir')}
                  </button>
                </div>
              </MotionDiv>
            ) : null}
            </AnimatePresence>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {coverTransitionWashVisible ? (
          <MotionDiv
            key={`cover-wash-${currentTrackId || 'none'}`}
            className="cover-transition-wash"
            style={{ '--cover-shift-color': hexToRgba(currentThemeColor, 0.36) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.62, ease: 'easeOut' }}
          />
        ) : null}
      </AnimatePresence>

      <input
        ref={coverInputRef}
        className="hidden-input"
        type="file"
        accept="image/*"
        onChange={handleCoverSelect}
      />
      <input
        ref={lyricsFileInputRef}
        className="hidden-input"
        type="file"
        accept=".txt,text/plain"
        onChange={handleLyricsFileUpload}
      />

      {isDragActive ? (
        <div className="drag-overlay">
          <div className="drag-overlay-card">
            <Upload size={22} />
            <strong>{t('dropMusicTitle', 'Müziği bırak, otomatik ekleyelim')}</strong>
            <span>{t('dropMusicHint', 'MP3 ve diğer ses dosyaları desteklenir.')}</span>
          </div>
        </div>
      ) : null}

      <MotionDiv
        className="ambient ambient-left"
        animate={runtimeLowPowerEnabled ? { opacity: 0.12 } : { opacity: [0.14, 0.22, 0.14] }}
        transition={runtimeLowPowerEnabled ? { duration: 0 } : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionDiv
        className="ambient ambient-right"
        animate={runtimeLowPowerEnabled ? { opacity: 0.1 } : { opacity: [0.1, 0.18, 0.1] }}
        transition={runtimeLowPowerEnabled ? { duration: 0 } : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo-frame">
            <img src={appLogo} alt="Music logo" className="topbar-logo" />
          </div>
          <h1>GLITCH Music</h1>
          <div className="topbar-youtube-search" onClick={(event) => event.stopPropagation()}>
            <div className="topbar-youtube-search-row">
              <select
                value={topbarYoutubeFilter}
                onChange={(event) => setTopbarYoutubeFilter(event.target.value)}
                title={t('searchFilter', 'Arama filtresi')}
              >
                <option value="all">{tt('Tümü', 'All')}</option>
                <option value="songs">{tt('Müzik', 'Music')}</option>
                <option value="artists">{t('artist', 'Sanatçı')}</option>
                <option value="albums">{t('album', 'Albüm')}</option>
                <option value="playlists">Playlist</option>
                <option value="podcasts">Podcast</option>
              </select>
              <input
                type="text"
                value={topbarYoutubeQuery}
                onChange={(event) => {
                  const nextQuery = event.target.value
                  setTopbarYoutubeQuery(nextQuery)
                  setTopbarYoutubeError('')
                  if (topbarYoutubeAlbumViewTitle) {
                    setTopbarYoutubeAlbumViewTitle('')
                    setTopbarYoutubeResults(topbarYoutubeRootResults)
                  } else {
                    const predicted = buildPredictedYtmResults(nextQuery, topbarYoutubeFilter, 12)
                    if (predicted.length) {
                      setTopbarYoutubeResults(predicted)
                      setTopbarYoutubeRootResults(predicted)
                    }
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleTopbarYouTubeSearch()
                  }
                }}
                placeholder={t('searchYoutube', "YouTube'da ara")}
              />
              <button
                type="button"
                className="mini-button ghost"
                onClick={handleTopbarYouTubeSearch}
                disabled={topbarYoutubeLoading}
              >
                <Youtube size={14} />
                {topbarYoutubeLoading ? t('searching', 'Aranıyor...') : tt('Ara', 'Search')}
              </button>
            </div>
            {topbarYoutubeError ? <p className="field-hint">{topbarYoutubeError}</p> : null}
            {topbarYoutubeResults.length ? (
              <div className="topbar-youtube-results add-link-search-results">
                {topbarYoutubeAlbumViewTitle ? (
                  <div className="search-results-header-row">
                    <button
                      type="button"
                      className="mini-button ghost"
                      onClick={() => {
                        setTopbarYoutubeResults(topbarYoutubeRootResults)
                        setTopbarYoutubeAlbumViewTitle('')
                        setTopbarYoutubeError('')
                      }}
                    >
                      <ArrowLeft size={14} />
                      {t('backToResults', 'Sonuçlara dön')}
                    </button>
                    <span className="search-results-header-label">{topbarYoutubeAlbumViewTitle}</span>
                  </div>
                ) : null}
                {!topbarYoutubeAlbumViewTitle ? (
                  <>
                    {topbarSearchGroups.featuredArtist ? (
                      <p className="search-results-section-title">{t('artist', 'Sanatçı')}</p>
                    ) : null}
                    {topbarSearchGroups.featuredArtist ? (
                      <div key={`topbar-yt-result-${topbarSearchGroups.featuredArtist.id}`} className="add-link-search-item topbar-youtube-result-item">
                        {topbarSearchGroups.featuredArtist.thumbnail ? (
                          <img src={topbarSearchGroups.featuredArtist.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} />
                        ) : (
                          <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>
                        )}
                        <span className="add-link-search-item-meta">
                          <strong>{topbarSearchGroups.featuredArtist.title}</strong>
                          <small>{t('artist', 'Sanatçı')}</small>
                        </span>
                        <button type="button" className="topbar-result-download-button" onClick={() => openArtistProfile(topbarSearchGroups.featuredArtist.artist || topbarSearchGroups.featuredArtist.title || '')}>
                          <UserRound size={14} /> {t('open', 'Aç')}
                        </button>
                      </div>
                    ) : null}
                    {topbarSearchGroups.featuredAlbum ? <p className="search-results-section-title">{t('album', 'Albüm')}</p> : null}
                    {topbarSearchGroups.featuredAlbum ? (
                      <div key={`topbar-yt-result-${topbarSearchGroups.featuredAlbum.id}`} className="add-link-search-item topbar-youtube-result-item">
                        {topbarSearchGroups.featuredAlbum.thumbnail ? (
                          <img src={topbarSearchGroups.featuredAlbum.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} />
                        ) : (
                          <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>
                        )}
                        <span className="add-link-search-item-meta">
                          <strong>{topbarSearchGroups.featuredAlbum.title}</strong>
                          <small>{topbarSearchGroups.featuredAlbum.artist || t('unknownArtist', 'Bilinmeyen sanatçı')} • {t('album', 'Albüm')}</small>
                        </span>
                        <button
                          type="button"
                          className="topbar-result-download-button"
                          onClick={() => {
                            loadYtMusicAlbumTracks(topbarSearchGroups.featuredAlbum).then((tracks) => {
                              if (tracks.length) {
                                setTopbarYoutubeResults(tracks)
                                setTopbarYoutubeAlbumViewTitle(topbarSearchGroups.featuredAlbum.title || t('album', 'Albüm'))
                                setTopbarYoutubeError('')
                              } else {
                                setTopbarYoutubeError(tt('Albüm şarkıları getirilemedi.', 'Album tracks could not be loaded.'))
                              }
                            })
                          }}
                        >
                          <ListMusic size={14} /> {t('open', 'Aç')}
                        </button>
                      </div>
                    ) : null}
                    {topbarSearchGroups.songs.length ? <p className="search-results-section-title">{t('songs', 'Şarkılar')}</p> : null}
                  </>
                ) : null}
                {(topbarYoutubeAlbumViewTitle ? topbarYoutubeResults : topbarSearchGroups.songs).map((item) => (
                  <div key={`topbar-yt-result-${item.id}`} className="add-link-search-item topbar-youtube-result-item">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} />
                    ) : (
                      <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>
                    )}
                    <span className="add-link-search-item-meta">
                      <strong>{item.title}</strong>
                      <small>
                        {item.type === 'playlist' ? `${item.artist || 'YouTube Music'} • Playlist` : (item.artist || t('unknownArtist', 'Bilinmeyen sanatçı'))}
                      </small>
                    </span>
                    <button
                      type="button"
                      className={`topbar-result-download-button ${
                        topbarYoutubeAddedIds.has(String(item.id || item.url || '')) ||
                        isTrackAlreadyInLibraryByMeta(item?.title || '', item?.artist || '')
                          ? 'done'
                          : ''
                      }`}
                      onClick={() => {
                        if (String(item?.type || '') === 'podcast') return
                        if (String(item?.type || '') === 'playlist') {
                          openHomeMoodPlaylist({
                            id: String(item?.id || item?.playlistId || ''),
                            playlistId: String(item?.playlistId || item?.id || ''),
                            title: String(item?.title || 'Playlist'),
                          })
                          return
                        }
                        handleTopbarYouTubeDirectAdd(item)
                      }}
                      disabled={
                        String(item?.type || '') === 'podcast' ||
                        topbarYoutubeAddingIds.has(String(item.id || item.url || '')) ||
                        (String(item?.type || '') !== 'playlist' && isTrackAlreadyInLibraryByMeta(item?.title || '', item?.artist || ''))
                      }
                    >
                      {String(item?.type || '') === 'podcast'
                        ? (<><Mic2 size={14} />Podcast</>)
                        : String(item?.type || '') === 'playlist'
                          ? (<><ListMusic size={14} />{t('open', 'Aç')}</>)
                        : isTrackAlreadyInLibraryByMeta(item?.title || '', item?.artist || '')
                          ? (<><Check size={14} />{t('loaded', 'Yüklü')}</>)
                        : topbarYoutubeAddingIds.has(String(item.id || item.url || ''))
                          ? (<><Download size={14} />{t('downloading', 'İndiriliyor...')}</>)
                        : topbarYoutubeAddedIds.has(String(item.id || item.url || ''))
                          ? (<><Check size={14} />{t('loaded', 'Yüklü')}</>)
                          : (<><Download size={14} />{t('download', 'İndir')}</>)}
                    </button>
                  </div>
                ))}
                {!topbarYoutubeAlbumViewTitle && topbarSearchGroups.restArtists.length ? <p className="search-results-section-title">{t('otherArtists', 'Diğer sanatçılar')}</p> : null}
                {!topbarYoutubeAlbumViewTitle && topbarSearchGroups.restArtists.map((item) => (
                  <div key={`topbar-yt-result-${item.id}`} className="add-link-search-item topbar-youtube-result-item">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                    <span className="add-link-search-item-meta"><strong>{item.title}</strong><small>{t('artist', 'Sanatçı')}</small></span>
                    <button type="button" className="topbar-result-download-button" onClick={() => openArtistProfile(item.artist || item.title || '')}><UserRound size={14} /> {t('open', 'Aç')}</button>
                  </div>
                ))}
                {!topbarYoutubeAlbumViewTitle && topbarSearchGroups.restAlbums.length ? <p className="search-results-section-title">{t('otherAlbums', 'Diğer albümler')}</p> : null}
                {!topbarYoutubeAlbumViewTitle && topbarSearchGroups.restAlbums.map((item) => (
                  <div key={`topbar-yt-result-${item.id}`} className="add-link-search-item topbar-youtube-result-item">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                    <span className="add-link-search-item-meta"><strong>{item.title}</strong><small>{item.artist || t('unknownArtist', 'Bilinmeyen sanatçı')} • {t('album', 'Albüm')}</small></span>
                    <button
                      type="button"
                      className="topbar-result-download-button"
                      onClick={() => {
                        loadYtMusicAlbumTracks(item).then((tracks) => {
                          if (tracks.length) {
                            setTopbarYoutubeResults(tracks)
                            setTopbarYoutubeAlbumViewTitle(item.title || t('album', 'Albüm'))
                            setTopbarYoutubeError('')
                          } else {
                            setTopbarYoutubeError(tt('Albüm şarkıları getirilemedi.', 'Album tracks could not be loaded.'))
                          }
                        })
                      }}
                    >
                      <ListMusic size={14} /> {t('open', 'Aç')}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="topbar-actions">
          <div className="topbar-utility-group">
            <div className="topbar-utility-item">
              <button
                className="icon-button topbar-icon-button"
                onClick={(event) => {
                  event.stopPropagation()
                  setNotificationsOpen(false)
                  setDownloadsOpen(false)
                  handleCollectionSelect('home')
                }}
                aria-label={t('home', 'Ana menü')}
                title={t('home', 'Ana menü')}
              >
                <House size={18} />
              </button>
            </div>
            <div className="topbar-utility-item">
              <button
                className="icon-button topbar-icon-button"
                onClick={(event) => {
                  event.stopPropagation()
                  setNotificationsOpen(false)
                  setDownloadsOpen(false)
                  openReportIssueModal()
                }}
                aria-label={t('reportIssue', 'Hata bildir')}
                title={t('reportIssue', 'Hata bildir')}
              >
                <Bug size={18} />
              </button>
            </div>
            <div className="topbar-utility-item">
              <button
                className="icon-button topbar-icon-button"
                onClick={(event) => {
                  event.stopPropagation()
                  setNotificationsOpen(false)
                  setDownloadsOpen(false)
                  setStatsOpen(true)
                }}
                aria-label={t('statistics', 'İstatistikler')}
                title={t('statistics', 'İstatistikler')}
              >
                <BarChart3 size={18} />
              </button>
            </div>
            <div className="topbar-utility-item topbar-notification-wrap">
              <button
                ref={notificationsButtonRef}
                className={`icon-button topbar-icon-button ${notificationsOpen ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setSettingsOpen(false)
                  setStatsOpen(false)
                  toggleNotificationsPanel()
                }}
                aria-label={t('notifications', 'Bildirimler')}
              >
                <Bell size={18} />
              </button>
              {hasUnreadNotifications ? <span className="topbar-notification-dot" /> : null}
            </div>
            <div className="topbar-utility-item topbar-notification-wrap">
              <button
                ref={downloadsButtonRef}
                className={`icon-button topbar-icon-button ${downloadsOpen ? 'active' : ''}`}
                onClick={(event) => {
                  event.stopPropagation()
                  setSettingsOpen(false)
                  setStatsOpen(false)
                  toggleDownloadsPanel()
                }}
                aria-label={t('downloads', 'İndirilenler')}
                title={t('downloads', 'İndirilenler')}
              >
                <Download size={18} />
              </button>
              {activeDownloadCount > 0 ? <span className="topbar-notification-dot" /> : null}
            </div>
            <div className="topbar-utility-item">
              <button className="icon-button topbar-icon-button" onClick={(event) => { event.stopPropagation(); setNotificationsOpen(false); setDownloadsOpen(false); setSettingsOpen(true) }} aria-label={t('settings', 'Ayarlar')} title={t('settings', 'Ayarlar')}>
                <Settings size={18} />
              </button>
            </div>
          </div>

          <button
            className="upload-button"
            onClick={(event) => { event.stopPropagation(); setNotificationsOpen(false); setDownloadsOpen(false); openUploadPicker() }}
            aria-label={t('add', 'Ekle')}
            title={t('add', 'Ekle')}
          >
            <Upload size={18} />
          </button>
          <div
            className="window-control-group"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={handleWindowToggleMaximize}
          >
            <button
              type="button"
              className="window-control-button"
              onClick={handleWindowMinimize}
              aria-label={t('minimize', 'Simge durumuna küçült')}
              title={t('minimize', 'Simge durumuna küçült')}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="window-control-button"
              onClick={handleWindowToggleMaximize}
              aria-label={windowIsMaximized ? t('restore', 'Geri yükle') : t('maximize', 'Büyüt')}
              title={windowIsMaximized ? t('restore', 'Geri yükle') : t('maximize', 'Büyüt')}
            >
              {windowIsMaximized ? <Minimize2 size={16} /> : <Square size={16} />}
            </button>
            <button
              type="button"
              className="window-control-button close"
              onClick={handleWindowClose}
              aria-label={t('close', 'Kapat')}
              title={t('close', 'Kapat')}
            >
              <X size={16} />
            </button>
          </div>
        </div>

          <input
            ref={inputRef}
            className="hidden-input"
            type="file"
            accept=".mp3,audio/*"
            multiple
            onChange={handleUpload}
          />
      </header>

      {showGlobalUpdaterCard ? (
        <div className="global-updater-card-wrap" onClick={(event) => event.stopPropagation()}>
          <div className="updater-inline-card">
            <div className="updater-inline-meta">
              <p>
                {updaterUiState.downloaded
                  ? `${t('updateReady', 'Güncelleme hazır')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                  : updaterUiState.downloading
                    ? `${t('updateDownloading', 'Güncelleme indiriliyor')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                    : updaterUiState.updateAvailable
                      ? `${t('updateAvailable', 'Yeni sürüm bulundu')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                      : t('updateStatus', 'Güncelleme durumu')}
              </p>
              <small>
                {updaterUiState.error
                  ? updaterUiState.error
                  : updaterUiState.downloading
                    ? `%${Math.round(updaterUiState.progressPercent || 0)} ${tt('indirildi', 'downloaded')}`
                    : updaterUiState.checking
                      ? t('checking', 'Kontrol ediliyor...')
                      : tt('Yeni sürüm hazırsa indirip yeniden başlatabilirsin.', 'If a new version is ready, you can download and restart.')}
              </small>
            </div>
            <div className="updater-inline-actions">
              <button
                type="button"
                className="mini-button ghost"
                onClick={handleUpdaterCheckNow}
                disabled={updaterUiState.checking || updaterUiState.downloading}
              >
                {tt('Kontrol et', 'Check')}
              </button>
              <button
                type="button"
                className="mini-button"
                onClick={handleUpdaterDownloadNow}
                disabled={
                  updaterUiState.checking ||
                  updaterUiState.downloading ||
                  !updaterUiState.updateAvailable ||
                  updaterUiState.downloaded
                }
              >
                {t('download', 'İndir')}
              </button>
              <button
                type="button"
                className="mini-button"
                onClick={handleUpdaterInstallNow}
                disabled={!updaterUiState.downloaded}
              >
                {tt('Yeniden başlat ve kur', 'Restart and install')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUpdaterCenterModal ? (
        <div className="modal-backdrop updater-center-backdrop" onClick={() => setUpdaterCenterModalOpen(false)}>
          <div className="modal-card glass updater-center-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <div>
                <p className="eyebrow">{tt('Güncelleme', 'Update')}</p>
                <h3>
                  {updaterUiState.downloaded
                    ? `${t('updateReady', 'Güncelleme hazır')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                    : updaterUiState.downloading
                      ? `${t('updateDownloading', 'Güncelleme indiriliyor')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                      : `${t('updateAvailable', 'Yeni sürüm bulundu')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`}
                </h3>
                <small>
                  {updaterUiState.downloading
                    ? `%${Math.round(updaterUiState.progressPercent || 0)} ${tt('indirildi', 'downloaded')}`
                    : updaterUiState.downloaded
                      ? tt('İndirme tamamlandı. Yeniden başlatınca kurulur.', 'Download completed. It will install after restart.')
                      : tt('İstersen şimdi indirip kurabilirsin.', 'You can download and install it now.')}
                </small>
              </div>
              <button className="mini-button ghost" type="button" onClick={() => setUpdaterCenterModalOpen(false)}>
                <X size={14} />
                {t('close', 'Kapat')}
              </button>
            </div>
            <div className="updater-inline-actions">
              <button
                type="button"
                className="mini-button ghost"
                onClick={handleUpdaterCheckNow}
                disabled={updaterUiState.checking || updaterUiState.downloading}
              >
                {tt('Kontrol et', 'Check')}
              </button>
              <button
                type="button"
                className="mini-button"
                onClick={handleUpdaterDownloadNow}
                disabled={
                  updaterUiState.checking ||
                  updaterUiState.downloading ||
                  !updaterUiState.updateAvailable ||
                  updaterUiState.downloaded
                }
              >
                {t('download', 'İndir')}
              </button>
              <button
                type="button"
                className="mini-button"
                onClick={handleUpdaterInstallNow}
                disabled={!updaterUiState.downloaded}
              >
                {tt('Yeniden başlat ve kur', 'Restart and install')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {notificationsOpen
        ? createPortal(
            <div
              className={`notifications-panel notifications-panel--plain theme-${themeMode} ${brightGradientReadabilityVars ? 'bright' : ''}`}
              style={{
                ...themeVars,
                top: notificationsPanelPosition.top,
                left: notificationsPanelPosition.left,
                width: notificationsPanelPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="notifications-head">
                <h4>{t('notifications', 'Bildirimler')}</h4>
                <button
                  type="button"
                  className="mini-button ghost"
                  onClick={clearNotifications}
                  disabled={!notifications.length}
                >
                  <Trash2 size={14} />
                  {t('clearAllNotifications', 'Tümünü temizle')}
                </button>
              </div>
              {showUpdaterInNotifications ? (
                <div className="updater-inline-card">
                  <div className="updater-inline-meta">
                    <p>
                      {updaterUiState.downloaded
                        ? `${t('updateReady', 'Güncelleme hazır')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                        : updaterUiState.downloading
                          ? `${t('updateDownloading', 'Güncelleme indiriliyor')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                          : updaterUiState.updateAvailable
                            ? `${t('updateAvailable', 'Yeni sürüm bulundu')}${updaterUiState.latestVersion ? `: v${updaterUiState.latestVersion}` : ''}`
                            : t('updateStatus', 'Güncelleme durumu')}
                    </p>
                    <small>
                      {updaterUiState.error
                        ? updaterUiState.error
                        : updaterUiState.downloading
                          ? `%${Math.round(updaterUiState.progressPercent || 0)} ${tt('indirildi', 'downloaded')}`
                          : updaterUiState.checking
                            ? t('checking', 'Kontrol ediliyor...')
                            : tt('Yeni sürümü kontrol edebilirsin.', 'You can check for the new version.')}
                    </small>
                  </div>
                  <div className="updater-inline-actions">
                    <button
                      type="button"
                      className="mini-button ghost"
                      onClick={handleUpdaterCheckNow}
                      disabled={updaterUiState.checking || updaterUiState.downloading}
                    >
                      {tt('Kontrol et', 'Check')}
                    </button>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={handleUpdaterDownloadNow}
                      disabled={
                        updaterUiState.checking ||
                        updaterUiState.downloading ||
                        !updaterUiState.updateAvailable ||
                        updaterUiState.downloaded
                      }
                    >
                      {t('download', 'İndir')}
                    </button>
                    <button
                      type="button"
                      className="mini-button"
                      onClick={handleUpdaterInstallNow}
                      disabled={!updaterUiState.downloaded}
                    >
                      {tt('Yeniden başlat ve kur', 'Restart and install')}
                    </button>
                  </div>
                  {updaterManualCheckUpToDate ? (
                    <div className="updater-inline-up-to-date" role="status" aria-live="polite">
                      <Check size={14} />
                      <span>{tt('Güncelsin!', 'You are up to date!')}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {activeTxtImportNotice ? (
                <div className="notification-item notification-item--sticky-import unread">
                  <div className="notification-item-body">
                    <p>{activeTxtImportNotice.message}</p>
                    <small>
                      {new Date(activeTxtImportNotice.createdAt).toLocaleTimeString(
                        language === 'tr' ? 'tr-TR' : 'en-US',
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </small>
                    {activeTxtImportNotice.actionType === 'cancel-txt-import' ? (
                      <button
                        type="button"
                        className="mini-button ghost"
                        onClick={() => {
                          playlistTxtImportCancelRef.current = true
                          setNotifications((prev) =>
                            prev.map((item) =>
                              item.id === activeTxtImportNotice.id
                                ? {
                                    ...item,
                                    actionType: '',
                                    actionLabel: '',
                                    message: `${item.message} (iptal ediliyor...)`,
                                  }
                                : item,
                            ),
                          )
                        }}
                      >
                        {activeTxtImportNotice.actionLabel || 'Aktarmayı iptal et'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="notifications-list">
                {notificationsForList.length ? (
                  notificationsForList.map((notice) => (
                    <div key={notice.id} className={`notification-item ${notice.read ? '' : 'unread'}`}>
                      <div className="notification-item-body">
                        <p>{notice.message}</p>
                        <small>{new Date(notice.createdAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</small>
                        {notice.actionType === 'cancel-txt-import' ? (
                          <button
                            type="button"
                            className="mini-button ghost"
                            onClick={() => {
                              playlistTxtImportCancelRef.current = true
                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === notice.id
                                    ? {
                                        ...item,
                                        actionType: '',
                                        actionLabel: '',
                                        message: `${item.message} (iptal ediliyor...)`,
                                      }
                                    : item,
                                ),
                              )
                            }}
                          >
                            {notice.actionLabel || 'Aktarmayı iptal et'}
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="icon-button mini-button ghost notification-delete"
                        onClick={() => removeNotification(notice.id)}
                        aria-label={t('close', 'Kapat')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="notifications-empty">{t('noNotifications', 'Henüz bildirim yok')}</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {downloadsOpen
        ? createPortal(
            <div
              className={`notifications-panel notifications-panel--plain theme-${themeMode} ${brightGradientReadabilityVars ? 'bright' : ''}`}
              style={{
                ...themeVars,
                top: downloadsPanelPosition.top,
                left: downloadsPanelPosition.left,
                width: downloadsPanelPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="notifications-head">
                <h4>İndirilenler</h4>
                <div className="editor-actions">
                  <button
                    type="button"
                    className={`mini-button ghost ${downloadsConsoleOpen ? 'active' : ''}`}
                    onClick={() => setDownloadsConsoleOpen((prev) => !prev)}
                  >
                    Konsol
                  </button>
                  <button
                    type="button"
                    className="mini-button ghost"
                    onClick={clearDownloadJobs}
                    disabled={!downloadJobs.length}
                  >
                    <Trash2 size={14} />
                    Tümünü temizle
                  </button>
                </div>
              </div>
              <div className="downloads-summary">
                <span className="mini-badge">Toplam: {downloadJobs.length}</span>
                <span className="mini-badge">Aktif: {activeDownloadCount}</span>
                <span className="mini-badge">Biten: {doneDownloadCount}</span>
              </div>
              <div className="downloads-filters">
                <button type="button" className={`mini-button ghost ${downloadFilter === 'all' ? 'active' : ''}`} onClick={() => setDownloadFilter('all')}>Tümü</button>
                <button type="button" className={`mini-button ghost ${downloadFilter === 'active' ? 'active' : ''}`} onClick={() => setDownloadFilter('active')}>Aktif</button>
                <button type="button" className={`mini-button ghost ${downloadFilter === 'done' ? 'active' : ''}`} onClick={() => setDownloadFilter('done')}>Biten</button>
              </div>
              <div className="notifications-list">
                {filteredDownloadJobs.length ? (
                  filteredDownloadJobs.map((job) => {
                    const total = Number(job.totalBytes || 0)
                    const received = Number(job.receivedBytes || 0)
                    const progressPercent = total > 0 ? Math.min(100, Math.round((received / total) * 100)) : 0
                    const statusText =
                      job.status === 'completed'
                        ? 'Tamamlandı'
                        : job.status === 'failed'
                          ? 'Başarısız'
                          : job.status === 'paused'
                            ? 'Durduruldu'
                            : job.status === 'cancelled'
                              ? 'İptal edildi'
                          : job.status === 'starting'
                            ? 'Başlatılıyor...'
                            : 'İndiriliyor...'
                    const isActiveDownload = job.status === 'starting' || job.status === 'downloading'
                    return (
                      <div key={job.requestId} className={`notification-item ${job.status === 'downloading' ? 'unread' : ''}`}>
                        <div className="notification-item-body">
                          <p>{job.title || 'Şarkı indiriliyor'}</p>
                          <small>{job.artist || 'Bilinmeyen sanatçı'}</small>
                          <small>
                            {formatBytes(received)}
                            {total > 0 ? ` / ${formatBytes(total)} (${progressPercent}%)` : ''}
                            {' • '}
                            {statusText}
                          </small>
                          <div className="download-progress-track">
                            <span
                              className="download-progress-fill"
                              style={{ width: `${job.status === 'completed' ? 100 : progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="download-item-actions">
                          {isActiveDownload ? (
                            <>
                              <button
                                type="button"
                                className="mini-button ghost download-action-button"
                                onClick={() => controlDownloadJob(job.requestId, 'pause')}
                              >
                                Durdur
                              </button>
                              <button
                                type="button"
                                className="mini-button danger download-action-button"
                                onClick={() => controlDownloadJob(job.requestId, 'cancel')}
                              >
                                İptal
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="icon-button mini-button ghost notification-delete"
                            onClick={() => removeDownloadJob(job.requestId)}
                            aria-label={t('close', 'Kapat')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="notifications-empty">Henüz indirme geçmişi yok</p>
                )}
              </div>
              {downloadsConsoleOpen ? (
                <div className="downloads-console">
                  <div className="downloads-console-head">
                    <strong>Konsol</strong>
                    <button type="button" className="mini-button ghost" onClick={() => setDownloadsConsoleLines([])}>
                      Temizle
                    </button>
                  </div>
                  <div className="downloads-console-body">
                    {downloadsConsoleLines.length ? (
                      downloadsConsoleLines.map((line, index) => (
                        <p key={`dl-console-${index}`}>{line}</p>
                      ))
                    ) : (
                      <p>Konsol kaydı henüz yok.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      <AnimatePresence>
        {dependencyNoticeOpen && !firstRunWizardOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setDependencyNoticeOpen(false)
              localStorage.setItem('nova-player-dependency-notice-v2', 'seen')
            }}
          >
            <MotionDiv
              className="modal-card glass dependency-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">İlk kurulum</p>
                  <h3>{t('dependencyTitle', 'Eksik bağımlılıklar bulundu')}</h3>
                </div>
                <div className="editor-actions">
                  <button
                    className="mini-button ghost"
                    onClick={() => {
                      setDependencyNoticeOpen(false)
                      localStorage.setItem('nova-player-dependency-notice-v2', 'seen')
                    }}
                  >
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                </div>
              </div>

              <p className="about-text">
                {t(
                  'dependencyHint',
                  'Uygulamada indirme ve YouTube Music arama özellikleri için aşağıdaki araçlar gerekli:',
                )}
                <strong> yt-dlp</strong>, <strong>ffmpeg</strong>, <strong>python</strong>, <strong>ytmusicapi</strong>.
              </p>

              <div className="dependency-tags">
                {dependencyMissingBase.map((name) => (
                  <span key={`dep-base-${name}`} className="mini-badge">{name}</span>
                ))}
                {dependencyMissingPython.map((name) => (
                  <span key={`dep-py-${name}`} className="mini-badge">{name}</span>
                ))}
              </div>
              {dependencyMissingAll.length ? (
                <div className="dependency-downloads-card">
                  {dependencyMissingAll.map((dep) => (
                    <button
                      key={`dep-download-${dep}`}
                      className="dependency-download-item"
                      onClick={() => handleDependencyLinkClick(dep)}
                    >
                      <span className="dependency-download-item-name">{dep}</span>
                      <span className="dependency-download-item-action">tıkla ve indir</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {dependencyRestartNotice ? (
                <p className="about-text">
                  Kurulumdan sonra değişikliklerin algılanması için uygulamayı yeniden başlat.
                </p>
              ) : null}

              <p className="about-text">{t('pasteCommandHint', 'Aşağıdakini kopyalayıp CMD/PowerShell’e yapıştır:')}</p>
              <textarea
                className="dependency-command-box"
                readOnly
                value={
                  dependencyInstallCommands ||
                  defaultDependencyInstallCommands
                }
              />

              {dependencyAutoInstallLogs.length ? (
                <textarea
                  className="dependency-command-box"
                  readOnly
                  value={dependencyAutoInstallLogs.join('\n')}
                />
              ) : null}

              <div className="editor-actions">
                <button
                  className="mini-button"
                  onClick={async () => {
                    const text =
                      dependencyInstallCommands ||
                      defaultDependencyInstallCommands
                    try {
                      await navigator.clipboard.writeText(text)
                      showUploadNotice(t('installCommandsCopied', 'Kurulum komutları panoya kopyalandı.'))
                    } catch {
                      showUploadNotice(t('copyFailed', 'Kopyalama başarısız oldu.'))
                    }
                  }}
                >
                  {t('copyCommands', 'Komutları kopyala')}
                </button>
                {dependencyRestartNotice ? (
                  <button className="mini-button" onClick={restartAppForDependencies}>
                    Yeniden başlat
                  </button>
                ) : null}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {statsOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setStatsOpen(false)}
          >
            <MotionDiv
              className="modal-card glass stats-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">İstatistikler</p>
                  <h3>
                    <BarChart3 size={18} />
                    Dinleme özeti
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setStatsOpen(false)}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <section className="stats-card">
                  <span>Toplam dinleme</span>
                  <strong>{formatListenDuration(playStats?.totalSeconds || 0)}</strong>
                  <small>Tüm oturumlar dahil, bu cihazda kaydedilir.</small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen</span>
                  <strong>{topTrackStats.topTrack?.title || 'Henüz yok'}</strong>
                  <small>
                    {topTrackStats.topTrack
                      ? `${topTrackStats.topTrack.artist} • ${formatListenDuration(topTrackStats.topSeconds)}`
                      : 'Biraz müzik çalınca burada görünür.'}
                  </small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen sanatçı</span>
                  <strong>{topTrackStats.topArtist?.name || 'Henüz yok'}</strong>
                  <small>
                    {topTrackStats.topArtist
                      ? formatListenDuration(topTrackStats.topArtist.seconds)
                      : 'Sanatçı istatistiği için biraz dinleme gerekli.'}
                  </small>
                </section>

                <section className="stats-card">
                  <span>En çok dinlenen albüm</span>
                  {topTrackStats.topAlbum ? (
                    <div className="stats-highlight">
                      <span className="stats-highlight-cover">
                        {getTrackDisplayUrl(topTrackStats.topAlbum.track, 'thumb') ? (
                          <img
                            src={getTrackDisplayUrl(topTrackStats.topAlbum.track, 'thumb')}
                            alt={`${topTrackStats.topAlbum.name} kapağı`}
                          />
                        ) : (
                          <span
                            className="playlist-menu-cover-fallback"
                            style={{ background: topTrackStats.topAlbum.track?.gradient || gradients[0] }}
                          >
                            {(topTrackStats.topAlbum.name || 'A').slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span className="stats-highlight-copy">
                        <strong>{topTrackStats.topAlbum.name}</strong>
                        <small>{topTrackStats.topAlbum.track?.artist || '-'}</small>
                      </span>
                    </div>
                  ) : (
                    <strong>Henüz yok</strong>
                  )}
                  <small>
                    {topTrackStats.topAlbum
                      ? formatListenDuration(topTrackStats.topAlbum.seconds)
                      : 'Albüm istatistiği için biraz dinleme gerekli.'}
                  </small>
                </section>

                <section className="stats-card stats-card-wide">
                  <span>En çok dinlenenler</span>
                  {topTrackStats.topList.length ? (
                    <div className="stats-top-list">
                      {topTrackStats.topList.map((item, index) => (
                        <div key={item.trackId} className="stats-top-item">
                          <b>{index + 1}</b>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.artist}</small>
                          </div>
                          <span>{`${formatListenDuration(item.seconds)} • ${Math.max(1, Math.round(Number(item.seconds || 0) / 60))} dk`}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <small>Henüz yeterli dinleme verisi yok.</small>
                  )}
                </section>

                <section className="stats-card stats-card-wide">
                  <div className="stats-card-head">
                    <span>Özel playlistler (aylık)</span>
                    <div className="editor-actions">
                      {monthlyRecapData ? (
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => {
                            if (monthlyRecapData) {
                              setMonthlyRecapSnapshot(monthlyRecapData)
                            }
                            setMonthlyRecapStep(0)
                            setMonthlyRecapOpen(true)
                          }}
                          title="Aylık özet animasyonunu aç"
                        >
                          <BarChart3 size={14} />
                          Aylık özet
                        </button>
                      ) : null}
                      {monthlyGeneratedCollections.length ? (
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => shufflePlayCollectionById(monthlyGeneratedCollections[0].id)}
                          title="En güncel aylık listeyi karışık çal"
                        >
                          <Shuffle size={14} />
                          Karışık çal
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {monthlyGeneratedCollections.length ? (
                    <div className="stats-top-list">
                      {monthlyGeneratedCollections.slice(0, 8).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="stats-top-item"
                          onClick={() => {
                            setStatsOpen(false)
                            handleCollectionSelect(item.id)
                          }}
                        >
                          <b>♪</b>
                          <div>
                            <strong>{item.name}</strong>
                            <small>Bu ayın en çok dinlenenleri</small>
                          </div>
                          <span>{item.count}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <small>Aylık özel playlist henüz oluşmadı.</small>
                  )}
                </section>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {monthlyRecapOpen && monthlyRecapSnapshot ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMonthlyRecapOpen(false)}
          >
            <MotionDiv
              className="modal-card glass monthly-recap-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Aylık özet</p>
                  <h3>
                    <BarChart3 size={18} />
                    {monthlyRecapSnapshot.monthLabel}
                  </h3>
                </div>
                <div className="editor-actions">
                  {monthlyRecapSnapshot.topTrack ? (
                    <button
                      className="mini-button ghost"
                      onClick={() => switchTrack(monthlyRecapSnapshot.topTrack, true, { restartIfSame: true })}
                    >
                      <Play size={14} />
                      Dinle
                    </button>
                  ) : null}
                  <button className="mini-button ghost" onClick={() => setMonthlyRecapOpen(false)}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="monthly-recap-progress">
                {[0, 1, 2, 3].map((step) => (
                  <span
                    key={`recap-step-${step}`}
                    className={`monthly-recap-progress-dot ${monthlyRecapStep >= step ? 'active' : ''}`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {monthlyRecapStep === 0 ? (
                  <MotionDiv
                    key="recap-total"
                    className="monthly-recap-scene"
                    style={{ '--recap-accent': monthlyRecapSnapshot.topTrack?.gradient || gradients[0] }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="monthly-recap-ambient" aria-hidden="true">
                      <span className="monthly-recap-blob blob-a" />
                      <span className="monthly-recap-blob blob-b" />
                      <span className="monthly-recap-blob blob-c" />
                    </div>
                    <p className="monthly-recap-scene-label">Bu ay toplam dinleme</p>
                    <strong>{formatListenDuration(monthlyRecapSnapshot.totalSeconds)}</strong>
                    <div className="monthly-recap-metrics-row">
                      <span>{monthlyRecapSnapshot.trackCount} parça</span>
                      <span>{monthlyRecapSnapshot.topTracks?.length || 0} favori öne çıktı</span>
                    </div>
                    {monthlyRecapDelayedMessage ? (
                      <MotionDiv
                        className="monthly-recap-delayed-message"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        {monthlyRecapDelayedMessage}
                      </MotionDiv>
                    ) : null}
                  </MotionDiv>
                ) : null}

                {monthlyRecapStep === 1 ? (
                  <MotionDiv
                    key="recap-track"
                    className="monthly-recap-scene monthly-recap-track-scene"
                    style={{ '--recap-accent': monthlyRecapSnapshot.topTrack?.gradient || gradients[0] }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="monthly-recap-ambient" aria-hidden="true">
                      <span className="monthly-recap-blob blob-a" />
                      <span className="monthly-recap-blob blob-b" />
                      <span className="monthly-recap-blob blob-c" />
                    </div>
                    <p className="monthly-recap-scene-label">En çok dinlediğin şarkı</p>
                    <div className="monthly-recap-track">
                      <span className="monthly-recap-track-cover">
                        {getTrackDisplayUrl(monthlyRecapSnapshot.topTrack, 'cover') ? (
                          <img src={getTrackDisplayUrl(monthlyRecapSnapshot.topTrack, 'cover')} alt="" />
                        ) : (
                          <span className="monthly-recap-track-cover-fallback" style={{ background: monthlyRecapSnapshot.topTrack?.gradient || gradients[0] }} />
                        )}
                      </span>
                      <div>
                        <strong>{monthlyRecapSnapshot.topTrack?.title || 'Bilinmeyen parça'}</strong>
                        <span>{monthlyRecapSnapshot.topTrack?.artist || '-'}</span>
                        <small>{formatListenDuration(monthlyRecapSnapshot.topTrackSeconds)}</small>
                      </div>
                    </div>
                    {monthlyRecapDelayedMessage ? (
                      <MotionDiv
                        className="monthly-recap-delayed-message"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        {monthlyRecapDelayedMessage}
                      </MotionDiv>
                    ) : null}
                  </MotionDiv>
                ) : null}

                {monthlyRecapStep === 2 ? (
                  <MotionDiv
                    key="recap-artist"
                    className="monthly-recap-scene"
                    style={{ '--recap-accent': monthlyRecapSnapshot.topTrack?.gradient || gradients[0] }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="monthly-recap-ambient" aria-hidden="true">
                      <span className="monthly-recap-blob blob-a" />
                      <span className="monthly-recap-blob blob-b" />
                      <span className="monthly-recap-blob blob-c" />
                    </div>
                    <p className="monthly-recap-scene-label">En çok dinlediğin sanatçı</p>
                    <strong>{monthlyRecapSnapshot.topArtistName || '-'}</strong>
                    <span>{formatListenDuration(monthlyRecapSnapshot.topArtistSeconds)}</span>
                    {monthlyRecapDelayedMessage ? (
                      <MotionDiv
                        className="monthly-recap-delayed-message"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        {monthlyRecapDelayedMessage}
                      </MotionDiv>
                    ) : null}
                  </MotionDiv>
                ) : null}

                {monthlyRecapStep === 3 ? (
                  <MotionDiv
                    key="recap-end"
                    className="monthly-recap-scene"
                    style={{ '--recap-accent': monthlyRecapSnapshot.topTrack?.gradient || gradients[0] }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="monthly-recap-ambient" aria-hidden="true">
                      <span className="monthly-recap-blob blob-a" />
                      <span className="monthly-recap-blob blob-b" />
                      <span className="monthly-recap-blob blob-c" />
                    </div>
                    <p className="monthly-recap-scene-label">Aylık özet hazır</p>
                    <strong>{monthlyRecapSnapshot.trackCount} parça üzerinden hazırlandı</strong>
                    {monthlyRecapDelayedMessage ? (
                      <MotionDiv
                        className="monthly-recap-delayed-message"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                      >
                        {monthlyRecapDelayedMessage}
                      </MotionDiv>
                    ) : null}
                    <div className="editor-actions">
                      <button
                        className="mini-button primary"
                        onClick={() => {
                          setMonthlyRecapOpen(false)
                          setStatsOpen(false)
                          window.setTimeout(() => {
                            handleCollectionSelect(`monthly:${monthlyRecapSnapshot.monthKey}`)
                          }, 0)
                        }}
                      >
                        Listeyi aç
                      </button>
                      <button
                        className="mini-button ghost"
                        onClick={() => shufflePlayCollectionById(`monthly:${monthlyRecapSnapshot.monthKey}`)}
                      >
                        <Shuffle size={14} />
                        Karışık çal
                      </button>
                    </div>
                  </MotionDiv>
                ) : null}
              </AnimatePresence>

              <div className="monthly-recap-controls">
                <button
                  type="button"
                  className="mini-button ghost"
                  onClick={() => setMonthlyRecapStep((prev) => Math.max(0, prev - 1))}
                  disabled={monthlyRecapStep <= 0}
                >
                  <ArrowLeft size={14} />
                  Geri
                </button>
                <span className="monthly-recap-step-label">
                  Adım {monthlyRecapStep + 1} / 4
                </span>
                <button
                  type="button"
                  className="mini-button primary"
                  onClick={() => setMonthlyRecapStep((prev) => Math.min(3, prev + 1))}
                  disabled={monthlyRecapStep >= 3}
                >
                  İleri
                  <ChevronRight size={14} />
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {settingsOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSettingsOpen(false)}
          >
            <MotionDiv
              className="modal-card glass settings-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t('settings', 'Ayarlar')}</p>
                  <h3>
                    <Settings size={18} />
                  {t('appSettings', 'Uygulama ayarları')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setSettingsOpen(false)}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                </div>
              </div>

              <div className="settings-layout">
                <aside className="settings-menu">
                  <div className="settings-menu-items">
                    {[
                      ['audio', t('audioOutput', 'Ses')],
                      ['appearance', t('theme', 'Görünüm')],
                      ['system', t('system', 'Sistem')],
                      ['console', t('console', 'Konsol')],
                      ['source', t('sharedSource', 'Kaynak')],
                      ['notes', t('notes', 'Notlar')],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`settings-menu-item ${settingsTab === value ? 'active' : ''}`}
                        onClick={() => setSettingsTab(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="settings-menu-footer" />
                </aside>

                <div
                  className={`settings-content ${settingsTab === 'appearance' ? 'appearance-scroll-enabled' : ''} ${settingsTab === 'system' ? 'system-scroll-enabled' : ''}`}
                >
                  {settingsTab === 'audio' ? (
                    <>
                      <section className="settings-section">
                        <h4>{t('audioOutput', 'Ses çıkışı')}</h4>
                        <p>{t('audioOutputHint', 'Buradan hoparlör, kulaklık ya da sanal çıkış aygıtını seçebilirsin.')}</p>
                        <div className="settings-output-list">
                          {!canSelectAudioOutput ? (
                            <div className="menu-empty">{t('outputNotSupported', 'Bu cihazda desteklenmiyor')}</div>
                          ) : audioOutputs.length === 0 ? (
                            <div className="menu-empty">{t('outputNotFound', 'Çıkış aygıtı bulunamadı')}</div>
                          ) : (
                            audioOutputs.map((device, index) => (
                              <button
                                key={device.deviceId}
                                className={`menu-item ${selectedAudioOutputId === device.deviceId ? 'selected' : ''}`}
                                onClick={() => selectAudioOutput(device.deviceId)}
                              >
                                <Check size={14} className={selectedAudioOutputId === device.deviceId ? 'visible' : 'hidden-check'} />
                                <span>{device.label || `Çıkış ${index + 1}`}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </section>

                      <section className="settings-section settings-eq-section">
                        <div className="settings-section-head">
                          <div>
                            <h4>{t('equalizer', 'Ekolayzer')}</h4>
                            <p>{t('equalizerHint', 'Frekansları hafifçe yükseltip azaltarak sesi şekillendirebilirsin.')}</p>
                          </div>
                          <button className="mini-button ghost" onClick={resetEqualizer}>
                            {t('reset', 'Sıfırla')}
                          </button>
                        </div>
                        <div className="settings-eq-grid">
                          {equalizerBands.map((band, index) => (
                            <label key={band.key} className="eq-band">
                              <span>{band.label}</span>
                              <input
                                className="range eq-range"
                                type="range"
                                min="-12"
                                max="12"
                                step="1"
                                value={equalizerGains[index] || 0}
                                onChange={(event) => handleEqualizerChange(index, Number(event.target.value))}
                              />
                              <strong>{(equalizerGains[index] || 0) > 0 ? `+${equalizerGains[index] || 0}` : equalizerGains[index] || 0} dB</strong>
                            </label>
                          ))}
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'appearance' ? (
                    <>
                      <div className="appearance-top-grid">
                        <div className="appearance-left-column">
                          <section className="settings-section appearance-theme-section">
                            <h4>{t('theme', 'Tema')}</h4>
                            <p>{t('themeHint', 'Arayüz görünümünü seç.')}</p>
                            <div className="settings-theme-list">
                              {[
                                ['dark', t('dark', 'Koyu')],
                                ['gray', t('gray', 'Grimsi')],
                                ['light', t('light', 'Açık')],
                                ['transparent', t('transparent', 'Şeffaf')],
                                ['custom', t('customTheme', 'Özel renk')],
                              ].map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  className={`menu-item ${value === 'custom' ? 'custom-theme-option' : ''} ${themeMode === value ? 'selected' : ''}`.trim()}
                                  onClick={() => setThemeMode(value)}
                                >
                                  <span>{label}</span>
                                  {value === 'custom' ? <small>{language === 'en' ? 'NEW' : 'YENİ'}</small> : null}
                                </button>
                              ))}
                            </div>
                            {themeMode === 'custom' ? (
                              <div className="settings-custom-theme-picker">
                                <p className="settings-help-text">{t('customThemeHint', 'Koyu, gri ve açık dışında kendi ana rengini seç.')}</p>
                                <label className="settings-color-field">
                                  <span>{t('themeColor', 'Tema rengi')}</span>
                                  <input
                                    type="color"
                                    value={customThemeColor}
                                    onChange={(event) => setCustomThemeColor(event.target.value)}
                                  />
                                </label>
                              </div>
                            ) : null}
                          </section>

                          <section className="settings-section">
                            <h4>{t('language', 'Dil')}</h4>
                            <p>{t('languageHint', 'Arayüz dilini değiştir.')}</p>
                            <div className="settings-theme-list">
                              {[
                                ['tr', t('turkish', 'Türkçe')],
                                ['en', t('english', 'English')],
                              ].map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  className={`menu-item ${language === value ? 'selected' : ''}`}
                                  onClick={() => setLanguage(value)}
                                >
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        </div>

                        <section className="settings-section background-style-section">
                          <h4>{t('backgroundStyle', 'Arka plan stili')}</h4>
                          <p>{t('backgroundStyleHint', 'Arka planı düz renk veya gradyan olarak ayarlayabilirsin.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('coverBasedBackground', 'Kapak rengine göre arka plan')}</span>
                            <input
                              type="checkbox"
                              checked={coverBasedBackgroundEnabled}
                              onChange={(event) => setCoverBasedBackgroundEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('coverBasedBackgroundHint', 'Açıkken arka plan gradyanı çalan şarkının kapak tonundan üretilir.')}</p>
                          <div className="settings-theme-list">
                            {[
                              ['solid', t('backgroundSolid', 'Düz renk')],
                              ['gradient', t('backgroundGradient', 'Gradyan')],
                            ].map(([value, label]) => (
                              <button
                                key={value}
                                type="button"
                                className={`menu-item ${backgroundStyle === value ? 'selected' : ''}`}
                                onClick={() => setBackgroundStyle(value)}
                              >
                                <span>{label}</span>
                              </button>
                            ))}
                          </div>
                          <div className="settings-color-grid">
                            <label className="settings-color-field">
                              <span>{t('backgroundColor1', 'Renk 1')}</span>
                              <input
                                type="color"
                                value={backgroundColor1}
                                onChange={(event) => setBackgroundColor1(event.target.value)}
                              />
                            </label>
                            {backgroundStyle === 'gradient' ? (
                              <label className="settings-color-field">
                                <span>{t('backgroundColor2', 'Renk 2')}</span>
                                <input
                                  type="color"
                                  value={backgroundColor2}
                                  onChange={(event) => setBackgroundColor2(event.target.value)}
                                />
                              </label>
                            ) : null}
                          </div>
                        </section>
                      </div>

                      <section className="settings-section settings-appearance-options">
                        <h4>{t('appearanceOptions', 'Görünüm seçenekleri')}</h4>
                        <p>{t('appearanceOptionsHint', 'Görünüm ve kaydırma tercihlerini tek yerden yönet.')}</p>
                        <div className="settings-options-scroll">
                          <label className="settings-toggle-row">
                            <span>{t('reduceAnimations', 'Animasyonları azalt')}</span>
                            <input
                              type="checkbox"
                              checked={reduceAnimationsEnabled}
                              onChange={(event) => setReduceAnimationsEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('reduceAnimationsHint', 'Arayüz geçişlerini ve hareketli efektleri sadeleştirir.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('lowPowerMode', 'Performans modu')}</span>
                            <input
                              type="checkbox"
                              checked={lowPowerModeEnabled}
                              onChange={(event) => setLowPowerModeEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('lowPowerModeHint', 'Blur, gölge ve cam efektlerini azaltarak daha stabil çalıştırır.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('fullscreenEffects', 'Tam ekran efektleri')}</span>
                            <input
                              type="checkbox"
                              checked={fullscreenEffectsEnabled}
                              onChange={(event) => setFullscreenEffectsEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('fullscreenEffectsHint', 'Gradyan, animasyon ve görsel efektleri aç/kapat.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('compactList', 'Kompakt liste görünümü')}</span>
                            <input
                              type="checkbox"
                              checked={compactListEnabled}
                              onChange={(event) => setCompactListEnabled(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('compactListHint', 'Şarkı satırlarını daha sıkı göstererek ekrana daha fazla parça sığdırır.')}</p>
                          <label className="settings-toggle-row">
                            <span>{t('showScrollbars', 'Kaydırma çubuğunu göster')}</span>
                            <input
                              type="checkbox"
                              checked={showScrollbars}
                              onChange={(event) => setShowScrollbars(event.target.checked)}
                            />
                          </label>
                          <p className="settings-help-text">{t('showScrollbarsHint', 'Kapalıyken kaydırma çubukları gizlenir, açıkken görünür olur.')}</p>
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'system' ? (
                    <>
                      <section className="settings-section system-options-scroll">
                        <h4>{t('systemOptions', 'Sistem ayarları')}</h4>
                        <p>{t('systemOptionsHint', 'Genel kullanım ve oynatma davranışlarını buradan yönet.')}</p>
                        <label className="settings-toggle-row">
                          <span>{t('resetShortcut', 'Acil reset kısayolu (Ctrl + Shift + R)')}</span>
                          <input
                            type="checkbox"
                            checked={resetShortcutEnabled}
                            onChange={(event) => setResetShortcutEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('monoAudio', 'Sesi mono olarak çal')}</span>
                          <input
                            type="checkbox"
                            checked={monoAudioEnabled}
                            onChange={(event) => setMonoAudioEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('preventSleepWhilePlaying', 'Şarkı çalarken ekranı açık tut ve uyku modunu engelle')}</span>
                          <input
                            type="checkbox"
                            checked={preventSleepWhilePlayingEnabled}
                            onChange={(event) => setPreventSleepWhilePlayingEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('launchOnStartup', 'Bilgisayar açıldığında uygulamayı otomatik başlat')}</span>
                          <input
                            type="checkbox"
                            checked={launchOnStartupEnabled}
                            onChange={(event) => setLaunchOnStartupEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('spaceShortcut', 'Boşluk tuşu ile çal/duraklat')}</span>
                          <input
                            type="checkbox"
                            checked={spaceKeyPlaybackEnabled}
                            onChange={(event) => setSpaceKeyPlaybackEnabled(event.target.checked)}
                          />
                        </label>
                        <label className="settings-toggle-row">
                          <span>{t('arrowShortcut', 'Ok tuşlarıyla 5 sn ileri/geri sar')}</span>
                          <input
                            type="checkbox"
                            checked={arrowSeekEnabled}
                            onChange={(event) => setArrowSeekEnabled(event.target.checked)}
                          />
                        </label>
                      </section>

                      <section className="settings-section">
                        <h4>{t('closeMode', 'Kapatma')}</h4>
                        <p>{t('closeModeHint', 'Kapat tuşuna basınca uygulamanın ne yapacağını seç.')}</p>
                        <div className="settings-theme-list">
                          {[
                            ['tray', t('closeTray', 'Arka planda kalsın')],
                            ['quit', t('closeQuit', 'Tamamen kapansın')],
                          ].map(([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              className={`menu-item ${closeBehavior === value ? 'selected' : ''}`}
                              onClick={() => setCloseBehavior(value)}
                            >
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </section>

                      <section className="settings-section">
                        <h4>{t('hardwareAcceleration', 'Donanım hızlandırma')}</h4>
                        <p>{t('hardwareAccelerationHint', 'Kapattığında uygulama yeniden başlatma ister.')}</p>
                        <label className="settings-toggle-row">
                          <span>{t('hardwareAcceleration', 'Donanım hızlandırma')}</span>
                          <input
                            type="checkbox"
                            checked={hardwareAccelerationEnabled}
                            onChange={(event) => setHardwareAccelerationEnabled(event.target.checked)}
                          />
                        </label>
                      </section>

                      <section className="settings-section">
                        <h4>{t('mediaShortcut', 'Global çal/duraklat kısayolu')}</h4>
                        <p>{t('mediaShortcutHint', 'Örnek: Ctrl+Alt+P. Boş bırakırsan kapalı olur.')}</p>
                        <label className="field settings-manifest-field">
                          <span>{t('mediaShortcut', 'Global çal/duraklat kısayolu')}</span>
                          <input
                            type="text"
                            value={mediaToggleShortcut}
                            readOnly
                            onKeyDown={handleMediaShortcutInputKeyDown}
                            placeholder="Ctrl+Alt+P"
                            title="Kısayolu kaydetmek için klavyeden kombinasyona bas. Silmek için Backspace."
                          />
                        </label>
                      </section>

                      <section className="settings-section">
                        <h4>{t('resetShortcut', 'Acil reset kısayolu')}</h4>
                        <p>{t('resetShortcutHint', 'Uygulama verilerini temizleme kısayolu. Şarkılar silinmez.')}</p>
                        <label className="field settings-manifest-field">
                          <span>{t('resetShortcut', 'Acil reset kısayolu')}</span>
                          <input
                            type="text"
                            value={resetShortcut}
                            readOnly
                            onKeyDown={handleResetShortcutInputKeyDown}
                            placeholder="Ctrl+Shift+R"
                            title="Kısayolu kaydetmek için klavyeden kombinasyona bas. Silmek için Backspace varsayılan (Ctrl+Shift+R) olur."
                          />
                        </label>
                      </section>

                      <section className="settings-section">
                        <h4>{t('export', 'Dışa aktarma')}</h4>
                        <p>{t('exportHint', 'Tüm şarkıları ve mevcut kapakları klasöre indir.')}</p>
                        <button
                          className="mini-button primary"
                          onClick={exportLibrary}
                          disabled={exportingLibrary}
                        >
                          <Upload size={14} />
                          {exportingLibrary ? t('exporting', 'Hazırlanıyor...') : t('exportStart', 'Müzikleri ve kapakları indir')}
                        </button>
                        <p className="settings-help-text">{t('resetCacheHint', 'Kapak, albüm, söz ve sanatçı bilgisini temizler. Şarkıların silinmez.')}</p>
                        <button
                          className="mini-button ghost"
                          onClick={() => setPendingResetCache(true)}
                        >
                          <Trash2 size={14} />
                          {t('resetCache', 'Önbelleği sıfırla')}
                        </button>
                        <p className="settings-help-text">{t('restoreLegacyDataHint', 'Önceki sürüm klasörlerinden şarkı verilerini geri almayı dener.')}</p>
                        <button
                          className="mini-button ghost"
                          onClick={restoreLegacyData}
                          disabled={restoringLegacyData}
                        >
                          <RefreshCw size={14} />
                          {restoringLegacyData ? 'Geri yükleniyor...' : t('restoreLegacyData', 'Eski veriyi geri yükle')}
                        </button>
                        <p className="settings-help-text">{t('factoryResetHint', 'Şarkılar, kapaklar, ayarlar, önbellek ve tüm yerel veriler kalıcı olarak silinir.')}</p>
                        <button
                          className="mini-button danger"
                          onClick={() => setPendingFactoryReset(true)}
                        >
                          <Trash2 size={14} />
                          {t('factoryReset', 'Tüm uygulama verilerini sil')}
                        </button>
                      </section>

                      <section className="settings-section">
                        <h4>Offline sağlık ekranı</h4>
                        <p>Kütüphanedeki olası eksikleri hızlıca gör.</p>
                        {audioOnlyHiddenCount ? (
                          <>
                            <p className="settings-help-text">Kapak ve söz bulunamadığı için gizlenen ses dosyalarını görünür yapar.</p>
                            <button
                              className="mini-button ghost"
                              onClick={revealAudioOnlyTracks}
                            >
                              <RefreshCw size={14} />
                              Verileri Bul
                            </button>
                          </>
                        ) : null}
                        <div className="stats-top-list settings-history-list">
                          <div className="stats-top-item">
                            <b>✓</b>
                            <div><strong>Sağlıklı parça</strong><small>Yerel veri tam</small></div>
                            <span>{offlineHealth.healthyCount}</span>
                          </div>
                          <div className="stats-top-item">
                            <b>!</b>
                            <div><strong>Kapaksız</strong><small>Kapak eksik parçalar</small></div>
                            <span>{offlineHealth.missingCoverCount}</span>
                          </div>
                          <div className="stats-top-item">
                            <b>!</b>
                            <div><strong>Sözsüz</strong><small>Yerel söz bulunamadı</small></div>
                            <span>{offlineHealth.missingLyricsCount}</span>
                          </div>
                          <div className="stats-top-item">
                            <b>!</b>
                            <div><strong>Ses URL eksik</strong><small>Boş/bozuk kaynak</small></div>
                            <span>{offlineHealth.missingAudioCount}</span>
                          </div>
                          <div className="stats-top-item">
                            <b>#</b>
                            <div><strong>Muhtemel tekrar</strong><small>Aynı imza ile tekrar edenler</small></div>
                            <span>{offlineHealth.duplicateCount}</span>
                          </div>
                          <div className="stats-top-item">
                            <b>•</b>
                            <div><strong>Eksik veri</strong><small>Kapak veya söz eksik parçalar</small></div>
                            <span>{audioOnlyHiddenCount}</span>
                          </div>
                        </div>
                      </section>

                      <section className="settings-section">
                        <h4>Dinleme geçmişi</h4>
                        <p>Geçmişte dinlenen şarkıları buradan filtreleyebilirsin.</p>
                        <div className="settings-history-filters">
                          <label className="field">
                            <span>Tarih</span>
                            <input
                              type="date"
                              value={historyFilterDate}
                              onChange={(event) => setHistoryFilterDate(event.target.value)}
                            />
                          </label>
                          <label className="field">
                            <span>Şarkı adı</span>
                            <input
                              type="search"
                              value={historyFilterQuery}
                              onChange={(event) => setHistoryFilterQuery(event.target.value)}
                              placeholder="Şarkı ara"
                            />
                          </label>
                        </div>
                        <div className="stats-top-list settings-history-list">
                          {filteredListenHistory.length ? (
                            filteredListenHistory.slice(0, 120).map((item) => (
                              <div key={item.id} className="stats-top-item">
                                <b>•</b>
                                <div>
                                  <strong>{item.title}</strong>
                                </div>
                                <span>{new Date(item.at).toLocaleDateString(language === 'en' ? 'en-US' : 'tr-TR')}</span>
                              </div>
                            ))
                          ) : (
                            <small>Filtreye uygun dinleme geçmişi bulunamadı.</small>
                          )}
                        </div>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'console' ? (
                    <>
                      {!consoleUnlocked ? (
                        <section className="settings-section">
                          <h4>Konsol erişimi</h4>
                          <p>
                            {consoleAccessHash && consoleAccessSalt
                              ? 'Konsolu açmak için şifreni gir.'
                              : 'İlk kullanım: konsol için bir şifre oluştur.'}
                          </p>
                          <label className="field">
                            <span>Şifre</span>
                            <input
                              type="password"
                              value={consoleSecretInput}
                              onChange={(event) => setConsoleSecretInput(event.target.value)}
                              placeholder="Şifre"
                            />
                          </label>
                          {!consoleAccessHash || !consoleAccessSalt ? (
                            <label className="field">
                              <span>Şifre (tekrar)</span>
                              <input
                                type="password"
                                value={consoleSecretConfirm}
                                onChange={(event) => setConsoleSecretConfirm(event.target.value)}
                                placeholder="Şifreyi tekrar gir"
                              />
                            </label>
                          ) : null}
                          {consoleAuthError ? <p className="field-hint">{consoleAuthError}</p> : null}
                          <div className="editor-actions">
                            <button className="mini-button" onClick={unlockConsoleAccess}>
                              {!consoleAccessHash || !consoleAccessSalt ? 'Şifre oluştur ve aç' : 'Konsolu aç'}
                            </button>
                          </div>
                        </section>
                      ) : (
                        <>
                          <section className="settings-section">
                            <h4>Konsol komutları</h4>
                            <p>Hızlı bakım işlemlerini buradan çalıştırabilirsin.</p>
                            <div className="editor-actions console-actions-compact">
                              <button className="mini-button console-mini-button" onClick={rerunFirstRunWizard}>
                                Kurulum sihirbazını tekrar aç
                              </button>
                              <button
                                className="mini-button ghost console-mini-button"
                                onClick={async () => {
                                  await checkFirstRunDependencies()
                                  pushDownloadConsoleLine('Bağımlılık kontrolü yeniden çalıştırıldı.')
                                }}
                              >
                                Bağımlılıkları kontrol et
                              </button>
                              <button
                                className="mini-button ghost console-mini-button"
                                onClick={openDependencyNoticeFromConsole}
                              >
                                Eksik modallar menüsünü aç
                              </button>
                              <button
                                className="mini-button ghost console-mini-button"
                                onClick={() => setDownloadsConsoleLines([])}
                              >
                                Konsolu temizle
                              </button>
                              <button className="mini-button ghost console-mini-button" onClick={lockConsoleAccess}>
                                Kilitle
                              </button>
                            </div>
                          </section>

                          <section className="settings-section">
                            <h4>Canlı konsol</h4>
                            <p>İndirme ve sistem olayları burada görünür.</p>
                            <div className="downloads-console settings-console">
                              <div className="downloads-console-body">
                                {downloadsConsoleLines.length ? (
                                  downloadsConsoleLines.map((line, index) => <p key={`settings-console-${index}`}>{line}</p>)
                                ) : (
                                  <p>Konsol kaydı henüz yok.</p>
                                )}
                              </div>
                            </div>
                          </section>
                        </>
                      )}
                    </>
                  ) : null}

                  {settingsTab === 'source' ? (
                    <>
                      <section className="settings-section">
                        <h4>Google + YouTube bağla</h4>
                        <p>YouTube playlistlerini hesabından çekip uygulamaya içe aktarabilirsin. OAuth bilgileri .env dosyasından okunur.</p>
                        <div className="editor-actions">
                          {!youtubeAuthStatus.connected ? (
                            <button
                              className="mini-button primary"
                              type="button"
                              onClick={connectYoutubeAccount}
                              disabled={youtubeAuthLoading || !googleClientId || !googleClientSecret}
                            >
                              <UserRound size={14} />
                              {youtubeAuthLoading ? 'Bağlanıyor...' : 'Google ile bağlan'}
                            </button>
                          ) : (
                            <>
                              <button className="mini-button" onClick={openYoutubePlaylistImport} disabled={youtubePlaylistsLoading}>
                                <ListMusic size={14} />
                                Playlistleri içe aktar
                              </button>
                              <button className="mini-button ghost" onClick={disconnectYoutubeAccount} disabled={youtubeAuthLoading}>
                                <X size={14} />
                                Bağlantıyı kaldır
                              </button>
                            </>
                          )}
                        </div>
                        <small className="settings-help-text">
                          {youtubeAuthStatus.connected
                            ? `Bağlı kanal: ${youtubeAuthStatus.channelTitle || 'Bilinmiyor'}`
                            : (!googleClientId || !googleClientSecret
                              ? '.env içinde VITE_GOOGLE_CLIENT_ID ve VITE_GOOGLE_CLIENT_SECRET tanımlanmalı.'
                              : 'Henüz Google hesabı bağlı değil.')}
                        </small>
                      </section>

                      <section className="settings-section">
                        <h4>Spotify hesabını bağla</h4>
                        <p>Spotify playlistlerini uygulamaya içe aktarmak için hesabını bağla. API bilgileri .env dosyasından okunur.</p>
                        <div className="editor-actions">
                          {!spotifyAuthStatus.connected ? (
                            <button
                              className="mini-button primary"
                              type="button"
                              onClick={connectSpotifyAccount}
                              disabled={spotifyAuthLoading}
                            >
                              <Disc size={14} />
                              {spotifyAuthLoading ? 'Bağlanıyor...' : 'Spotify hesabını bağla'}
                            </button>
                          ) : (
                            <>
                              <button
                                className="mini-button"
                                type="button"
                                onClick={importSpotifyPlaylists}
                                disabled={spotifyImportLoading}
                              >
                                <ListMusic size={14} />
                                {spotifyImportLoading ? 'Hazırlanıyor...' : 'Playlistleri içe aktar'}
                              </button>
                              <button
                                className="mini-button ghost"
                                type="button"
                                onClick={disconnectSpotifyAccount}
                                disabled={spotifyAuthLoading}
                              >
                                <X size={14} />
                                Bağlantıyı kaldır
                              </button>
                            </>
                          )}
                        </div>
                        <small className="settings-help-text">
                          {spotifyAuthStatus.connected
                            ? (spotifyAuthStatus.accountLabel || 'Spotify hesabı bağlı')
                            : 'Henüz Spotify hesabı bağlı değil.'}
                        </small>
                      </section>

                      <section className="settings-section">
                        <h4>{t('sharedSource', 'Ortak kaynak')}</h4>
                        <p>{t('sharedSourceHint', 'Yan bilgisayardaki tracks.json linkini gir. Buradaki şarkılar herkes tarafından görülebilir.')}</p>
                        <label className="field settings-manifest-field">
                          <span>{t('remoteManifestUrl', 'Uzak manifest URL')}</span>
                          <input
                            type="text"
                            value={sharedManifestUrl}
                            onChange={(event) => setSharedManifestUrl(event.target.value)}
                            placeholder="http://192.168.x.x:8080/tracks.json"
                          />
                        </label>
                        <small className="settings-help-text">{t('remoteManifestExample', 'Örnek: ağda açtığın küçük bir HTTP sunucu üzerinden tracks.json.')}</small>
                        <small className="settings-help-text">{t('remoteManifestRelative', 'Manifest içinde audioFile/coverFile kullanırsan URL yazmadan dosya yoluyla ekleyebilirsin. (Örn: songs/parca.mp3)')}</small>
                      </section>
                    </>
                  ) : null}

                  {settingsTab === 'notes' ? (
                    <section className="settings-section">
                      <h4>{t('notes', 'Not')}</h4>
                      <p>{t('noteLocal', 'Playlist ve favori durumları yerelde saklanır.')}</p>
                      <p>{t('noteResume', 'Uygulama son çalınan parçayı ve konumu hatırlar.')}</p>
                      <p>{t('noteShared', 'Sunucudakiler, uzak manifest adresinden dakikada bir güncellenir.')}</p>
                      <p>{t('noteExport', 'Dışa aktarma, ses ve kapakları tek klasörde yedekler.')}</p>
                      <p>{t('noteResetShortcut', 'Acil reset kısayolu: Ctrl + Shift + R')}</p>
                      <p>{tf('noteAppVersion', { app: APP_NAME, version: APP_VERSION }, `${APP_NAME} sürümü: v${APP_VERSION}`)}</p>
                    </section>
                  ) : null}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {youtubeImportOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setYoutubeImportOpen(false)}
          >
            <MotionDiv
              className="modal-card glass playlist-add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">YouTube</p>
                  <h3>
                    <ListMusic size={18} />
                    Playlist içe aktar
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setYoutubeImportOpen(false)}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>
              <div className="playlist-add-list">
                {youtubePlaylistsLoading ? (
                  <div className="menu-empty">Playlistler yükleniyor...</div>
                ) : youtubePlaylists.length === 0 ? (
                  <div className="menu-empty">Playlist bulunamadı.</div>
                ) : (
                  youtubePlaylists.map((playlist) => (
                    <div key={playlist.playlistId} className="playlist-add-row">
                      <span className="playlist-add-cover">
                        {playlist.coverUrl ? (
                          <img src={playlist.coverUrl} alt="" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: gradients[0] }} />
                        )}
                      </span>
                      <span className="playlist-add-copy">
                        <strong>{playlist.title || 'Playlist'}</strong>
                        <small>
                          {Number.isFinite(Number(playlist?.trackCount))
                            ? `${Number(playlist.trackCount)} şarkı`
                            : 'Şarkı sayısı alınamadı'}
                        </small>
                      </span>
                      <button
                        type="button"
                        className="playlist-add-button"
                        onClick={() => importYoutubePlaylist(playlist)}
                        disabled={youtubeImportingPlaylistId === playlist.playlistId}
                      >
                        {youtubeImportingPlaylistId === playlist.playlistId ? 'İçe aktarılıyor...' : 'İçe aktar'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {spotifyImportOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSpotifyImportOpen(false)}
          >
            <MotionDiv
              className="modal-card glass playlist-add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Spotify</p>
                  <h3>
                    <ListMusic size={18} />
                    Playlist içe aktar
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setSpotifyImportOpen(false)}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>
              <div className="playlist-add-list">
                {spotifyPlaylistsLoading ? (
                  <div className="menu-empty">Playlistler yükleniyor...</div>
                ) : spotifyPlaylists.length === 0 ? (
                  <div className="menu-empty">Playlist bulunamadı.</div>
                ) : (
                  spotifyPlaylists.map((playlist) => (
                    <div key={playlist.playlistId} className="playlist-add-row">
                      <span className="playlist-add-cover">
                        {playlist.coverUrl ? (
                          <img src={playlist.coverUrl} alt="" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: gradients[0] }} />
                        )}
                      </span>
                      <span className="playlist-add-copy">
                        <strong>{playlist.title || 'Playlist'}</strong>
                        <small>{Number(playlist.trackCount || 0)} şarkı</small>
                      </span>
                      <button
                        type="button"
                        className="playlist-add-button"
                        onClick={() => importSpotifyPlaylist(playlist)}
                        disabled={spotifyImportingPlaylistId === playlist.playlistId}
                      >
                        {spotifyImportingPlaylistId === playlist.playlistId ? 'İçe aktarılıyor...' : 'İçe aktar'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {poolAdminOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePoolAdminPanel}
          >
            <MotionDiv
              className={`modal-card glass pool-admin-modal ${poolAdminUnlocked ? '' : 'pool-admin-modal--auth'}`.trim()}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Müzik Havuzu</p>
                  <h3>
                    <Lock size={18} />
                    Havuz düzenleme paneli
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePoolAdminPanel}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              {!poolAdminUnlocked ? (
                <form
                  className="pool-admin-auth"
                  onSubmit={(event) => {
                    event.preventDefault()
                    unlockPoolAdminPanel()
                  }}
                >
                  <label className="field">
                    <span>Şifre</span>
                    <input
                      ref={poolAdminPasswordInputRef}
                      type="password"
                      value={poolAdminPasswordInput}
                      onChange={(event) => {
                        setPoolAdminPasswordInput(event.target.value)
                        if (poolAdminAuthError) {
                          setPoolAdminAuthError('')
                        }
                      }}
                      placeholder="Panel şifresi"
                      autoComplete="current-password"
                    />
                  </label>
                  {poolAdminAuthError ? <p className="pool-admin-error">{poolAdminAuthError}</p> : null}
                  <button type="submit" className="mini-button primary">
                    Panele gir
                  </button>
                </form>
              ) : (
                <div className="pool-admin-body">
                  <div className="pool-admin-toolbar">
                    <button
                      className="mini-button ghost"
                      onClick={() => loadPoolAdminTracksFromGithub()}
                      disabled={poolAdminLoading}
                    >
                      {poolAdminLoading ? 'Yükleniyor...' : 'Yenile'}
                    </button>
                    <button className="mini-button ghost" onClick={addPoolAdminTrack}>
                      <Plus size={14} />
                      Satır ekle
                    </button>
                    <button className="mini-button primary" onClick={downloadPoolManifestJson}>
                      <Download size={14} />
                      tracks.json indir
                    </button>
                    <input
                      className="pool-admin-search-input"
                      type="search"
                      value={poolAdminSearchQuery}
                      onChange={(event) => setPoolAdminSearchQuery(event.target.value)}
                      placeholder="Şarkı, sanatçı veya link ara"
                    />
                  </div>
                  <div className="pool-admin-github-grid">
                    <label className="field">
                      <span>GitHub Owner</span>
                      <input
                        type="text"
                        value={poolGithubOwner}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubOwner(nextValue)
                          persistPoolGithubPrefs({ poolGithubOwner: nextValue })
                        }}
                        placeholder="ghxsty-dev"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>Repo</span>
                      <input
                        type="text"
                        value={poolGithubRepo}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubRepo(nextValue)
                          persistPoolGithubPrefs({ poolGithubRepo: nextValue })
                        }}
                        placeholder="glitch-music-pool"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>Branch</span>
                      <input
                        type="text"
                        value={poolGithubBranch}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubBranch(nextValue)
                          persistPoolGithubPrefs({ poolGithubBranch: nextValue })
                        }}
                        placeholder="main"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field">
                      <span>JSON yolu</span>
                      <input
                        type="text"
                        value={poolGithubPath}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubPath(nextValue)
                          persistPoolGithubPrefs({ poolGithubPath: nextValue })
                        }}
                        placeholder="tracks.json"
                        autoComplete="off"
                      />
                    </label>
                    <label className="field pool-admin-token-field">
                      <span>GitHub Token (repo)</span>
                      <input
                        type="password"
                        value={poolGithubToken}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setPoolGithubToken(nextValue)
                          persistPoolGithubPrefs({ poolGithubToken: nextValue })
                        }}
                        placeholder="ghp_..."
                        autoComplete="off"
                      />
                    </label>
                    <button
                      className="mini-button primary pool-admin-github-save"
                      onClick={publishPoolManifestToGithub}
                      disabled={poolGithubSaving}
                    >
                      <Upload size={14} />
                      {poolGithubSaving ? "GitHub'a yazılıyor..." : "GitHub'a kaydet"}
                    </button>
                  </div>
                  {poolAdminNotice ? <p className="pool-admin-note">{poolAdminNotice}</p> : null}
                  <div className="pool-admin-grid" ref={poolAdminGridRef}>
                    <datalist id="pool-admin-artist-suggestions">
                      {poolAdminArtistSuggestions.map((artist) => (
                        <option key={`pool-admin-artist-${artist}`} value={artist} />
                      ))}
                    </datalist>
                    {filteredPoolAdminTracks.map((track) => (
                      <div key={track.id} className="pool-admin-row">
                        <label className="field">
                          <span>Sanatçı adı</span>
                          <input
                            type="text"
                            list="pool-admin-artist-suggestions"
                            value={track.artist || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'artist', event.target.value)}
                            placeholder="Radiohead"
                            autoComplete="off"
                          />
                        </label>
                        <label className="field">
                          <span>Şarkı adı</span>
                          <input
                            type="text"
                            value={track.title || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'title', event.target.value)}
                            placeholder="Nice Dream"
                          />
                        </label>
                        <label className="field">
                          <span>Link</span>
                          <input
                            type="text"
                            value={track.downloadUrl}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'downloadUrl', event.target.value)}
                            placeholder="https://...mp3"
                          />
                        </label>
                        <label className="field">
                          <span>Kapak linki (opsiyonel)</span>
                          <input
                            type="text"
                            value={track.coverUrl || ''}
                            onChange={(event) => updatePoolAdminTrack(track.id, 'coverUrl', event.target.value)}
                            placeholder="https://...jpg"
                          />
                        </label>
                        <button
                          className="mini-button danger pool-admin-remove"
                          onClick={() => removePoolAdminTrack(track.id)}
                          title="Satırı sil"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    ))}
                    {!filteredPoolAdminTracks.length ? (
                      <div className="menu-empty">Aramaya uygun kayıt bulunamadı.</div>
                    ) : null}
                  </div>
                </div>
              )}
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {pendingDeleteTrack || pendingDeletePlaylist || pendingResetCache || pendingFactoryReset ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setPendingDeleteTrackId(null)
              setPendingDeletePlaylistId(null)
              setPendingResetCache(false)
              setPendingFactoryReset(false)
            }}
          >
            <MotionDiv
              className="modal-card glass confirm-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="confirm-modal-head">
                <p className="eyebrow">
                  {pendingFactoryReset
                    ? t('confirmFactoryResetTitle', 'Fabrika ayarına dön')
                    : pendingResetCache
                    ? t('confirmResetCacheTitle', 'Önbelleği sıfırla')
                    : pendingDeleteTrack
                    ? t('confirmDeleteTrackTitle', 'Şarkıyı sil')
                    : t('confirmDeletePlaylistTitle', 'Playlisti sil')}
                </p>
                <h3>
                  <Trash2 size={18} />
                  {pendingFactoryReset
                    ? t('confirmFactoryResetTitle', 'Fabrika ayarına dön')
                    : pendingResetCache
                    ? t('confirmResetCacheTitle', 'Önbelleği sıfırla')
                    : pendingDeleteTrack
                    ? t('confirmDeleteTrackTitle', 'Şarkıyı sil')
                    : t('confirmDeletePlaylistTitle', 'Playlisti sil')}
                </h3>
              </div>

              <p className="confirm-modal-copy">
                {pendingFactoryReset
                  ? t('confirmFactoryResetBody', 'Tüm uygulama verileri kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istediğine emin misin?')
                  : pendingResetCache
                  ? t('confirmResetCacheBody', 'Önbelleği temizlemek istediğine emin misin? Şarkılar silinmez.')
                  : pendingDeleteTrack
                  ? tf(
                      'confirmDeleteTrackBody',
                      { name: pendingDeleteTrack.title || 'Bu parça' },
                      `"${pendingDeleteTrack.title || 'Bu parça'}" parçasını silmek istediğine emin misin?`,
                    )
                  : tf(
                      'confirmDeletePlaylistBody',
                      { name: pendingDeletePlaylist?.name || 'Bu playlist' },
                      `"${pendingDeletePlaylist?.name || 'Bu playlist'}" playlistini silmek istediğine emin misin?`,
                    )}
              </p>

              <div className="editor-actions">
                <button
                  className="mini-button ghost"
                  onClick={() => {
                    setPendingDeleteTrackId(null)
                    setPendingDeletePlaylistId(null)
                    setPendingResetCache(false)
                    setPendingFactoryReset(false)
                  }}
                >
                  <X size={14} />
                  {t('cancelAction', 'Vazgeç')}
                </button>
                <button
                  className="mini-button danger"
                  onClick={() => {
                    if (pendingFactoryReset) {
                      setPendingFactoryReset(false)
                      runFactoryReset()
                      return
                    }
                    if (pendingResetCache) {
                      resetAppCaches()
                      setPendingResetCache(false)
                      return
                    }
                    if (pendingDeleteTrack) {
                      deleteTrack(pendingDeleteTrack.id)
                      return
                    }
                    if (pendingDeletePlaylist) {
                      deletePlaylist(pendingDeletePlaylist.id)
                    }
                  }}
                >
                  <Trash2 size={14} />
                  {pendingFactoryReset ? t('resetAction', 'Sıfırla') : pendingResetCache ? t('resetAction', 'Sıfırla') : t('deleteAction', 'Sil')}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {addModalOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddModal}
          >
            <MotionDiv
              className="modal-card glass add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Ekle</p>
                  <h3>
                    <Plus size={18} />
                    Dosya veya link
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closeAddModal}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              {addMode === 'choose' ? (
                <div className="add-choice-grid">
                  <button
                    className="add-choice-card"
                    onClick={() => {
                      setAddMode('file')
                      inputRef.current?.click()
                    }}
                  >
                    <FileUp size={20} />
                    <strong>Dosya ekle</strong>
                    <span>Bilgisayarındaki MP3'leri otomatik okuyalım.</span>
                  </button>

                </div>
              ) : null}

              {false ? (
                <div className="add-link-layout">
                  <section className="add-link-search glass">
                    <label className="field">
                      <span>YouTube'da ara</span>
                      <div className="add-link-search-row">
                        <input
                          type="text"
                          value={youtubeSearchQuery}
                          onChange={(event) => {
                            setYoutubeSearchQuery(event.target.value)
                            if (youtubeSearchAlbumViewTitle) {
                              setYoutubeSearchAlbumViewTitle('')
                              setYoutubeSearchResults(youtubeSearchRootResults)
                            }
                          }}
                          placeholder="Şarkı veya sanatçı ara"
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              handleYouTubeSearch()
                            }
                          }}
                        />
                        <button
                          className="mini-button ghost"
                          onClick={handleYouTubeSearch}
                          disabled={youtubeSearchLoading}
                        >
                          <Youtube size={14} />
                          {youtubeSearchLoading ? 'Aranıyor...' : 'Ara'}
                        </button>
                      </div>
                    </label>
                    {youtubeSearchError ? <p className="field-hint">{youtubeSearchError}</p> : null}
                    <div className="add-link-search-results">
                      {youtubeSearchAlbumViewTitle ? (
                        <div className="search-results-header-row">
                          <button
                            type="button"
                            className="mini-button ghost"
                            onClick={() => {
                              setYoutubeSearchResults(youtubeSearchRootResults)
                              setYoutubeSearchAlbumViewTitle('')
                              setYoutubeSearchError('')
                            }}
                          >
                            <ArrowLeft size={14} />
                            Sonuçlara dön
                          </button>
                          <span className="search-results-header-label">{youtubeSearchAlbumViewTitle}</span>
                        </div>
                      ) : null}
                      {youtubeSearchResults.length ? (
                        <>
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.featuredArtist ? <p className="search-results-section-title">Sanatçı</p> : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.featuredArtist ? (
                            <button
                              key={`yt-result-${addLinkSearchGroups.featuredArtist.id}`}
                              type="button"
                              className="add-link-search-item"
                              onClick={() => openArtistProfile(addLinkSearchGroups.featuredArtist.artist || addLinkSearchGroups.featuredArtist.title || '')}
                            >
                              {addLinkSearchGroups.featuredArtist.thumbnail ? <img src={addLinkSearchGroups.featuredArtist.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                              <span className="add-link-search-item-meta">
                                <span className="add-link-search-item-title">{addLinkSearchGroups.featuredArtist.title || 'Sanatçı'}</span>
                                <span className="add-link-search-item-artist">Sanatçı</span>
                              </span>
                            </button>
                          ) : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.featuredAlbum ? <p className="search-results-section-title">Albüm</p> : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.featuredAlbum ? (
                            <button
                              key={`yt-result-${addLinkSearchGroups.featuredAlbum.id}`}
                              type="button"
                              className="add-link-search-item"
                              onClick={async () => {
                                const tracks = await loadYtMusicAlbumTracks(addLinkSearchGroups.featuredAlbum)
                                if (tracks.length) {
                                  setYoutubeSearchResults(tracks)
                                  setYoutubeSearchAlbumViewTitle(addLinkSearchGroups.featuredAlbum.title || 'Albüm')
                                  setYoutubeSearchError('')
                                } else {
                                  setYoutubeSearchError('Albüm şarkıları getirilemedi.')
                                }
                              }}
                            >
                              {addLinkSearchGroups.featuredAlbum.thumbnail ? <img src={addLinkSearchGroups.featuredAlbum.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                              <span className="add-link-search-item-meta">
                                <span className="add-link-search-item-title">{addLinkSearchGroups.featuredAlbum.title || 'Albüm'}</span>
                                <span className="add-link-search-item-artist">{`${addLinkSearchGroups.featuredAlbum.artist || ''} • Albüm`}</span>
                              </span>
                            </button>
                          ) : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.songs.length ? <p className="search-results-section-title">Şarkılar</p> : null}
                          {(youtubeSearchAlbumViewTitle ? youtubeSearchResults : addLinkSearchGroups.songs).map((item) => (
                          <button
                            key={`yt-result-${item.id}`}
                            type="button"
                            className="add-link-search-item"
                            onClick={async () => {
                              const itemType = String(item.type || 'song')
                              if (itemType === 'artist') {
                                openArtistProfile(item.artist || item.title || '')
                                return
                              }
                              if (itemType === 'album') {
                                const tracks = await loadYtMusicAlbumTracks(item)
                                if (tracks.length) {
                                  setYoutubeSearchResults(tracks)
                                  setYoutubeSearchAlbumViewTitle(String(item.title || 'Albüm'))
                                  setYoutubeSearchError('')
                                } else {
                                  setYoutubeSearchError('Albüm şarkıları getirilemedi.')
                                }
                                return
                              }
                              if (itemType === 'playlist') {
                                openHomeMoodPlaylist({
                                  id: String(item?.id || item?.playlistId || ''),
                                  playlistId: String(item?.playlistId || item?.id || ''),
                                  title: String(item?.title || 'Playlist'),
                                })
                                return
                              }
                              setLinkDraft((prev) => ({
                                ...prev,
                                title: String(item.title || '').trim() || prev.title,
                                artist: String(item.artist || '').trim() || prev.artist,
                                audioUrl: String(item.url || '').trim(),
                              }))
                            }}
                          >
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt=""
                                className="add-link-search-item-cover"
                                draggable={false}
                              />
                            ) : (
                              <span className="add-link-search-item-cover add-link-search-item-cover-placeholder">
                                <Youtube size={14} />
                              </span>
                            )}
                            <span className="add-link-search-item-meta">
                              <span className="add-link-search-item-title">{item.title || 'Video'}</span>
                              <span className="add-link-search-item-artist">
                                {item.type === 'album'
                                  ? `${item.artist || ''} • Albüm`
                                  : item.type === 'artist'
                                    ? 'Sanatçı'
                                    : item.type === 'playlist'
                                      ? 'Playlist'
                                    : (item.artist || '')}
                              </span>
                            </span>
                          </button>
                          ))}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.restArtists.length ? <p className="search-results-section-title">Diğer sanatçılar</p> : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.restArtists.map((item) => (
                            <button key={`yt-result-${item.id}`} type="button" className="add-link-search-item" onClick={() => openArtistProfile(item.artist || item.title || '')}>
                              {item.thumbnail ? <img src={item.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                              <span className="add-link-search-item-meta"><span className="add-link-search-item-title">{item.title || 'Sanatçı'}</span><span className="add-link-search-item-artist">Sanatçı</span></span>
                            </button>
                          ))}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.restAlbums.length ? <p className="search-results-section-title">Diğer albümler</p> : null}
                          {!youtubeSearchAlbumViewTitle && addLinkSearchGroups.restAlbums.map((item) => (
                            <button
                              key={`yt-result-${item.id}`}
                              type="button"
                              className="add-link-search-item"
                              onClick={async () => {
                                const tracks = await loadYtMusicAlbumTracks(item)
                                if (tracks.length) {
                                  setYoutubeSearchResults(tracks)
                                  setYoutubeSearchAlbumViewTitle(String(item.title || 'Albüm'))
                                  setYoutubeSearchError('')
                                } else {
                                  setYoutubeSearchError('Albüm şarkıları getirilemedi.')
                                }
                              }}
                            >
                              {item.thumbnail ? <img src={item.thumbnail} alt="" className="add-link-search-item-cover" draggable={false} /> : <span className="add-link-search-item-cover add-link-search-item-cover-placeholder"><Youtube size={14} /></span>}
                              <span className="add-link-search-item-meta"><span className="add-link-search-item-title">{item.title || 'Albüm'}</span><span className="add-link-search-item-artist">{`${item.artist || ''} • Albüm`}</span></span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <p className="field-hint">Arama yapınca sonuçlar burada görünecek.</p>
                      )}
                    </div>
                  </section>

                  <section className="add-form add-link-form">
                    <label className="field">
                      <span>Şarkı adı (isteğe bağlı)</span>
                      <input
                        type="text"
                        value={linkDraft.title}
                        onChange={(event) =>
                          setLinkDraft((prev) => ({ ...prev, title: event.target.value }))
                        }
                        placeholder="Şarkı adı"
                        autoFocus
                      />
                    </label>

                    <label className="field">
                      <span>Sanatçı (isteğe bağlı)</span>
                      <input
                        type="text"
                        value={linkDraft.artist}
                        onChange={(event) =>
                          setLinkDraft((prev) => ({ ...prev, artist: event.target.value }))
                        }
                        placeholder="Sanatçı adı"
                      />
                    </label>

                    <label className="field">
                      <span>Şarkı bağlantısı</span>
                      <input
                        type="text"
                        value={linkDraft.audioUrl}
                        onChange={(event) =>
                          setLinkDraft((prev) => ({ ...prev, audioUrl: event.target.value }))
                        }
                        placeholder="Drive veya YouTube linki"
                      />
                    </label>
                    <p className="field-hint">
                      Drive linki direkt eklenir. YouTube/playlist linki otomatik indirilip kütüphaneye alınır.
                    </p>

                    <label className="field">
                      <span>Kapak bağlantısı</span>
                      <input
                        type="text"
                        value={linkDraft.coverUrl}
                        onChange={(event) =>
                          setLinkDraft((prev) => ({ ...prev, coverUrl: event.target.value }))
                        }
                        placeholder="https://...jpg"
                      />
                    </label>

                    <div className="editor-actions">
                      <button className="mini-button ghost" onClick={() => setAddMode('choose')}>
                        Geri
                      </button>
                      <button
                        className="mini-button ghost"
                        onClick={async () => {
                          const first = youtubeSearchResults.find((item) => String(item?.type || 'song') === 'song' && item?.url)
                          if (!first?.url) {
                            showUploadNotice('Önce YouTube sonucu seç veya ara.')
                            return
                          }
                          await handleLinkAdd({
                            audioUrl: first.url,
                            title: first.title || '',
                            artist: first.artist || '',
                          })
                        }}
                      >
                        <Youtube size={14} />
                        İlk sonucu ekle
                      </button>
                      <button
                        className={`mini-button ${linkAddSuccessSignature ? 'success' : 'primary'}`}
                        onClick={() => handleLinkAdd()}
                      >
                        {linkAddSuccessSignature ? <Check size={14} /> : <Link2 size={14} />}
                        {linkAddSuccessSignature ? 'Şarkı eklendi' : 'Linki ekle'}
                      </button>
                    </div>
                  </section>
                </div>
              ) : null}

            </MotionDiv>
          </MotionDiv>
        ) : null}

        {reportIssueOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!reportIssueSubmitting) {
                setReportIssueOpen(false)
              }
            }}
          >
            <MotionDiv
              className="modal-card glass report-issue-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Hata bildir</p>
                  <h3>
                    <Bug size={18} />
                    Discord'a gönder
                  </h3>
                </div>
                <div className="editor-actions">
                  <button
                    className="mini-button ghost"
                    onClick={() => setReportIssueOpen(false)}
                    disabled={reportIssueSubmitting}
                  >
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="add-form">
                <label className="field">
                  <span>Başlık</span>
                  <input
                    type="text"
                    maxLength={220}
                    value={reportIssueDraft.title}
                    onChange={(event) =>
                      setReportIssueDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Hata bildirinin başlığı"
                    autoFocus
                  />
                </label>

                <label className="field">
                  <span>Konu</span>
                  <input
                    type="text"
                    maxLength={420}
                    value={reportIssueDraft.subject}
                    onChange={(event) =>
                      setReportIssueDraft((prev) => ({ ...prev, subject: event.target.value }))
                    }
                    placeholder="Hata bildirisinin konusu"
                  />
                </label>

                <label className="field">
                  <span>Açıklama</span>
                  <textarea
                    value={reportIssueDraft.description}
                    onChange={(event) =>
                      setReportIssueDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Sorunun nasıl oluştuğunu adım adım yaz."
                    rows={7}
                  />
                </label>
              </div>

              <div className="editor-actions">
                <button
                  className="mini-button ghost"
                  onClick={() => setReportIssueOpen(false)}
                  disabled={reportIssueSubmitting}
                >
                  Vazgeç
                </button>
                <button
                  className="mini-button primary"
                  onClick={submitReportIssue}
                  disabled={reportIssueSubmitting}
                >
                  <Bug size={14} />
                  {reportIssueSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {playlistAddOpen && currentPlaylist ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistAddModal}
          >
            <MotionDiv
              className="modal-card glass playlist-add-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist'e ekle</p>
                  <h3>
                    <ListMusic size={18} />
                    {currentPlaylist.name}
                  </h3>
                  <span className="panel-subtitle">Şarkının yanındaki + ile doğrudan bu playliste ekleyebilirsin.</span>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistAddModal}>
                    <X size={14} />
                    Kapat
                  </button>
                </div>
              </div>

              <div className="playlist-add-list">
                <label className="field playlist-add-search-field">
                  <span>Şarkı ara</span>
                  <input
                    type="text"
                    value={playlistAddSearchQuery}
                    onChange={(event) => setPlaylistAddSearchQuery(event.target.value)}
                    placeholder="Tüm parçalarda ara"
                    autoFocus
                  />
                </label>

                {playlistAddFilteredTracks.map((track) => {
                  const alreadyInPlaylist = currentPlaylist.trackIds.includes(track.id)

                  return (
                    <div key={`playlist-add-${track.id}`} className="playlist-add-row">
                      <span className="playlist-add-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="playlist-add-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                      <button
                        className={`playlist-add-button ${alreadyInPlaylist ? 'added' : ''}`}
                        type="button"
                        onClick={() => addTrackToPlaylist(currentPlaylist.id, track.id)}
                        aria-label={alreadyInPlaylist ? 'Playlistten çıkar' : 'Playliste ekle'}
                        title={alreadyInPlaylist ? 'Bu şarkıyı playlistten çıkar' : 'Bu şarkıyı playliste ekle'}
                      >
                        {alreadyInPlaylist ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  )
                })}
                {!playlistAddFilteredTracks.length ? (
                  <div className="menu-empty">Aramaya uygun şarkı bulunamadı.</div>
                ) : null}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>

      {artistProfileOpen ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setArtistProfileOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="modal-card glass artist-profile-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="artist-profile-body">
              <div className="artist-profile-top">
                <div className="artist-profile-top-main">
                  <div className="artist-profile-avatar">
                    {artistProfilePhotoUrl ? (
                      <img src={artistProfilePhotoUrl} alt={`${artistProfileName || 'Sanatçı'} görseli`} />
                    ) : (
                      <span className="artist-photo-fallback">
                        <UserRound size={18} />
                        Sanatçı
                      </span>
                    )}
                  </div>
                  <div className="artist-profile-head-inline">
                    <p className="eyebrow">Sanatçı</p>
                    <h3>{artistProfileName || 'Bilinmeyen sanatçı'}</h3>
                    <div className="artist-profile-stat-chips">
                      <span className="artist-profile-stat-chip">
                        <ListMusic size={13} />
                        {artistProfileYtTopSongs.length} Top Songs
                      </span>
                      <span className="artist-profile-stat-chip">
                        <Disc size={13} />
                        {artistProfileYtAlbums.length} Albums
                      </span>
                      <span className="artist-profile-stat-chip">
                        <Mic2 size={13} />
                        {artistProfileYtSingles.length} Singles / EPs
                      </span>
                    </div>
                    {artistProfileFactsLoading ? (
                      <p className="about-text">Sanatçı bilgisi çekiliyor...</p>
                    ) : artistProfileFacts ? (
                      <>
                        <p className="about-text">{artistProfileAboutLine || 'Detay bulunamadı.'}</p>
                        {artistProfileFacts.summary ? <p className="about-summary">{artistProfileFacts.summary}</p> : null}
                      </>
                    ) : (
                      <p className="about-text">Sanatçı detayları bulunamadı.</p>
                    )}
                  </div>
                </div>
                <button className="mini-button ghost artist-profile-close" onClick={() => setArtistProfileOpen(false)}>
                  <X size={14} />
                  Kapat
                </button>
              </div>

              <section className="artist-profile-tracks artist-profile-merged">
                <div className="artist-section-head">
                  <p className="about-title">Top Songs (YouTube Music)</p>
                  <small>{artistProfileYtTopSongs.length} parça</small>
                </div>
                <div className="artist-profile-track-list">
                  {artistProfileYtTopSongs.length ? (
                    artistProfileYtTopSongs.map((track) => (
                      <button
                        key={`artist-yt-top-song-${track.id}`}
                        type="button"
                        className="artist-profile-track-row"
                        onClick={async () => {
                          const trackKey = String(track.id || track.url || '')
                          if (!track.url) return
                          if (isTrackAlreadyInLibraryByMeta(track.title, track.artist)) {
                            return
                          }
                          setArtistProfileDownloadingIds((prev) => {
                            const next = new Set(prev)
                            next.add(trackKey)
                            return next
                          })
                          await handleLinkAdd(
                            {
                              audioUrl: track.url,
                              title: track.title,
                              artist: track.artist,
                            },
                            { keepModalOpen: true, suppressNotice: false },
                          )
                          setArtistProfileDownloadingIds((prev) => {
                            const next = new Set(prev)
                            next.delete(trackKey)
                            return next
                          })
                        }}
                      >
                        <span className="artist-profile-track-cover">
                          {track.coverUrl ? (
                            <img src={track.coverUrl} alt="" className="track-thumb-image" />
                          ) : (
                            <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                          )}
                        </span>
                        <span className="artist-profile-track-copy">
                          <strong>{track.title}</strong>
                          <small>{track.artist}</small>
                        </span>
                        <span className={`artist-profile-track-action ${isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? 'added' : ''}`}>
                          {isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? (
                            <>
                              <Check size={12} />
                              Eklendi
                            </>
                          ) : artistProfileDownloadingIds.has(String(track.id || track.url || '')) ? (
                            <span className="spinner-dot">●</span>
                          ) : (
                            'İndir'
                          )}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="about-text">Top songs bulunamadı.</p>
                  )}
                </div>
              
                <div className="artist-section-head">
                  <p className="about-title">Albums (YouTube Music)</p>
                  <small>{artistProfileYtAlbums.length} albüm</small>
                </div>
                {artistProfileYtLoading ? (
                  <p className="about-text">YouTube Music albümleri aranıyor...</p>
                ) : (
                  <>
                    <div className="artist-horizontal-strip">
                      {artistProfileYtAlbums.length ? (
                        artistProfileYtAlbums.map((albumItem) => (
                          <button
                            key={`artist-yt-album-${albumItem.key}`}
                            type="button"
                            className={`album-browser-card artist-album-card ${artistProfileSelectedYtAlbumKey === albumItem.key ? 'active' : ''}`}
                            onClick={() => {
                              openArtistReleaseModal(albumItem, 'album')
                            }}
                            title={`${albumItem.album} albümündeki şarkıları aç`}
                          >
                            <span className="album-browser-cover">
                              {albumItem.coverUrl ? (
                                <img src={albumItem.coverUrl} alt={`${albumItem.album} kapağı`} className="track-thumb-image" />
                              ) : (
                                <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                              )}
                            </span>
                            <span className="album-browser-copy">
                              <strong>{albumItem.album}</strong>
                              <small>
                                {(artistProfileReleaseTracksByKey[albumItem.key]?.length || albumItem.trackCount || 0)} şarkı
                              </small>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="about-text">Bu sanatçı için YouTube Music albümü bulunamadı.</p>
                      )}
                    </div>

                    <div className="artist-section-head">
                      <p className="about-title">Singles - EPs (YouTube Music)</p>
                      <small>{artistProfileYtSingles.length} yayın</small>
                    </div>
                    <div className="artist-horizontal-strip">
                      {artistProfileYtSingles.length ? (
                        artistProfileYtSingles.map((singleItem) => (
                          <button
                            key={`artist-yt-single-${singleItem.key}`}
                            type="button"
                            className={`album-browser-card artist-album-card ${artistProfileSelectedYtSingleKey === singleItem.key ? 'active' : ''}`}
                            onClick={() => {
                              openArtistReleaseModal(singleItem, 'single')
                            }}
                            title={`${singleItem.album} içindeki şarkıları aç`}
                          >
                            <span className="album-browser-cover">
                              {singleItem.coverUrl ? (
                                <img src={singleItem.coverUrl} alt={`${singleItem.album} kapağı`} className="track-thumb-image" />
                              ) : (
                                <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                              )}
                            </span>
                            <span className="album-browser-copy">
                              <strong>{singleItem.album}</strong>
                              <small>
                                {(artistProfileReleaseTracksByKey[singleItem.key]?.length || singleItem.trackCount || 0)} şarkı
                              </small>
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="about-text">Single/EP bulunamadı.</p>
                      )}
                    </div>

                  </>
                )}
              </section>
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      {artistReleaseModalOpen && artistProfileSelectedYtRelease ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setArtistReleaseModalOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <MotionDiv
            className="modal-card glass artist-release-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="artist-release-hero">
              <div className="artist-release-hero-left">
                <p className="eyebrow">Albüm</p>
                <h3>{artistProfileSelectedYtRelease.album}</h3>
                <span className="panel-subtitle">{artistProfileName || 'Sanatçı'}</span>
              </div>
              <div className="artist-release-hero-cover">
                {artistProfileSelectedYtRelease.coverUrl ? (
                  <img src={artistProfileSelectedYtRelease.coverUrl} alt={`${artistProfileSelectedYtRelease.album} kapağı`} />
                ) : (
                  <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                )}
              </div>
              <div className="artist-release-hero-right">
                <div className="artist-release-hero-controls">
                  <div className="artist-release-stats-wrap">
                    <div className="artist-release-stats">
                      <strong>{artistReleaseTrackCount}</strong>
                      <span>Şarkı</span>
                    </div>
                    <div className="artist-release-stats">
                      <strong>{formatTime(artistReleaseTotalDuration)}</strong>
                      <span>Toplam süre</span>
                    </div>
                  </div>
                  <div className="artist-release-actions">
                    <button className="mini-button ghost" onClick={() => setArtistReleaseModalOpen(false)}>
                      <X size={14} />
                      Kapat
                    </button>
                    <button
                      type="button"
                      className="mini-button primary"
                      disabled={
                        artistProfileReleaseLoadingKey === artistProfileSelectedYtRelease.key ||
                        artistProfileSelectedYtReleaseTracks.filter((track) => !isTrackAlreadyInLibraryByMeta(track.title, track.artist)).length === 0
                      }
                      onClick={async () => {
                        const pendingTracks = artistProfileSelectedYtReleaseTracks.filter(
                          (track) => track?.url && !isTrackAlreadyInLibraryByMeta(track.title, track.artist),
                        )
                        for (const track of pendingTracks) {
                          const trackKey = String(track.id || track.url || '')
                          setArtistProfileDownloadingIds((prev) => {
                            const next = new Set(prev)
                            next.add(trackKey)
                            return next
                          })
                          await handleLinkAdd(
                            {
                              audioUrl: track.url,
                              title: track.title,
                              artist: track.artist,
                            },
                            { keepModalOpen: true, suppressNotice: false },
                          )
                          setArtistProfileDownloadingIds((prev) => {
                            const next = new Set(prev)
                            next.delete(trackKey)
                            return next
                          })
                        }
                      }}
                    >
                      <Download size={14} />
                      Hepsini indir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="artist-profile-track-list home-mood-modal-list">
              {artistProfileReleaseLoadingKey === artistProfileSelectedYtRelease.key ? (
                <p className="about-text">Şarkılar yükleniyor...</p>
              ) : null}
              {artistProfileSelectedYtReleaseTracks.map((track) => (
                <button
                  key={`artist-yt-track-${track.id}`}
                  type="button"
                  className="artist-profile-track-row"
                  onClick={async () => {
                    const trackKey = String(track.id || track.url || '')
                    if (!track.url) return
                    if (isTrackAlreadyInLibraryByMeta(track.title, track.artist)) return
                    setArtistProfileDownloadingIds((prev) => {
                      const next = new Set(prev)
                      next.add(trackKey)
                      return next
                    })
                    await handleLinkAdd(
                      {
                        audioUrl: track.url,
                        title: track.title,
                        artist: track.artist,
                      },
                      { keepModalOpen: true, suppressNotice: false },
                    )
                    setArtistProfileDownloadingIds((prev) => {
                      const next = new Set(prev)
                      next.delete(trackKey)
                      return next
                    })
                  }}
                >
                  <span className="artist-profile-track-cover">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="track-thumb-image" />
                    ) : (
                      <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                    )}
                  </span>
                  <span className="artist-profile-track-copy">
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </span>
                  <span className={`artist-profile-track-action ${isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? 'added' : ''}`}>
                    {isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? (
                      <>
                        <Check size={12} />
                        Eklendi
                      </>
                    ) : artistProfileDownloadingIds.has(String(track.id || track.url || '')) ? (
                      <span className="spinner-dot">●</span>
                    ) : (
                      'İndir'
                    )}
                  </span>
                </button>
              ))}
              {!artistProfileSelectedYtReleaseTracks.length && artistProfileReleaseLoadingKey !== artistProfileSelectedYtRelease.key ? (
                <p className="about-text">Bu yayın için şarkı bulunamadı.</p>
              ) : null}
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      {albumInfoOpen ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setAlbumInfoOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="modal-card glass album-info-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Albüm</p>
                <h3>{albumInfo?.album || 'Bilinmeyen albüm'}</h3>
                <span className="panel-subtitle">{albumInfo?.artist || 'Bilinmeyen sanatçı'}</span>
              </div>
              <button className="mini-button ghost" onClick={() => setAlbumInfoOpen(false)}>
                <X size={14} />
                Kapat
              </button>
            </div>

            <div className="album-info-body">
              <div className="album-info-cover">
                {albumInfo?.coverUrl ? (
                  <img src={albumInfo.coverUrl} alt={`${albumInfo?.album || t('album', 'Albüm')} ${t('coverAlt', 'kapak')}`} />
                ) : (
                  <div className="track-thumb-fallback" style={{ background: gradients[0] }} />
                )}
              </div>

              <div className="album-info-content">
                <p className="about-title">{tt('Detaylar', 'Details')}</p>
                {albumInfoLoading ? (
                  <p className="about-text">{tt('Albüm bilgileri çekiliyor...', 'Loading album details...')}</p>
                ) : (
                  <p className="about-text">
                    {tt('Çıkış tarihi:', 'Release date:')}{' '}
                    {albumInfo?.releaseDate && Number.isFinite(new Date(albumInfo.releaseDate).getTime())
                      ? new Date(albumInfo.releaseDate).toLocaleDateString(
                          language === 'tr' ? 'tr-TR' : 'en-US',
                          { day: '2-digit', month: 'long', year: 'numeric' },
                        )
                      : tt('Bilinmiyor', 'Unknown')}
                  </p>
                )}

                {Array.isArray(albumInfo?.poolTracks) && albumInfo.poolTracks.length ? (
                  <>
                    <p className="about-title">{tt('Havuzdaki bu albüm şarkıları', 'Pool tracks from this album')}</p>
                    <div className="artist-profile-track-list">
                      {albumInfo.poolTracks.map((track) => {
                        const isAlreadyInLibrary = isTrackInLocalLibrary(track)
                        return (
                        <button
                          key={`album-pool-track-${track.id}`}
                          type="button"
                          className={`artist-profile-track-row ${isAlreadyInLibrary ? 'already-added' : ''}`}
                          onClick={() => {
                            if (isAlreadyInLibrary) {
                              return
                            }
                            downloadPoolTrackToLibrary(track)
                          }}
                        >
                          <span className="artist-profile-track-cover">
                            {getTrackDisplayUrl(track, 'thumb') ? (
                              <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                            ) : (
                              <span className="track-thumb-fallback" style={{ background: track.gradient }} />
                            )}
                          </span>
                          <span className="artist-profile-track-copy">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                          <span className={`artist-profile-track-action ${isAlreadyInLibrary ? 'added' : ''}`}>
                            {isAlreadyInLibrary ? (
                              <>
                                <Check size={12} />
                                {t('added', 'Eklendi')}
                              </>
                            ) : (
                              t('add', 'Ekle')
                            )}
                          </span>
                        </button>
                        )
                      })}
                    </div>
                  </>
                ) : null}

                <div className="album-info-download-header">
                  <p className="about-title">{tt('Albüm şarkıları (YouTube Music)', 'Album tracks (YouTube Music)')}</p>
                  <button
                    type="button"
                    className="mini-button ghost"
                    disabled={
                      albumInfoYtTracksLoading ||
                      albumInfoYtTracks.filter((track) => !isTrackAlreadyInLibraryByMeta(track.title, track.artist)).length === 0
                    }
                    onClick={async () => {
                      const pendingTracks = albumInfoYtTracks.filter(
                        (track) => track?.url && !isTrackAlreadyInLibraryByMeta(track.title, track.artist),
                      )
                      for (const track of pendingTracks) {
                        const trackKey = String(track.id || track.url || '')
                        setAlbumInfoDownloadingIds((prev) => {
                          const next = new Set(prev)
                          next.add(trackKey)
                          return next
                        })
                        await handleLinkAdd(
                          {
                            audioUrl: track.url,
                            title: track.title,
                            artist: track.artist,
                          },
                          { keepModalOpen: true, suppressNotice: true },
                        )
                        setAlbumInfoDownloadingIds((prev) => {
                          const next = new Set(prev)
                          next.delete(trackKey)
                          return next
                        })
                      }
                      showUploadNotice(tt('Albümdeki indirilebilir şarkılar eklendi.', 'Downloadable album tracks were added.'))
                    }}
                    title={tt('Bu albümdeki eksik şarkıların tamamını indir', 'Download all missing tracks from this album')}
                  >
                    <Download size={14} />
                    {tt('Kalanları indir', 'Download remaining')}
                  </button>
                </div>
                {albumInfoYtTracksLoading ? (
                  <p className="about-text">{tt('Albüm şarkıları yükleniyor...', 'Loading album tracks...')}</p>
                ) : (
                  <div className="artist-profile-track-list">
                    {albumInfoYtTracks.length ? (
                      albumInfoYtTracks.map((track) => (
                        <button
                          key={`album-yt-track-${track.id}`}
                          type="button"
                          className="artist-profile-track-row"
                          onClick={async () => {
                            const trackKey = String(track.id || track.url || '')
                            if (!track.url) return
                            if (isTrackAlreadyInLibraryByMeta(track.title, track.artist)) {
                              return
                            }
                            setAlbumInfoDownloadingIds((prev) => {
                              const next = new Set(prev)
                              next.add(trackKey)
                              return next
                            })
                            await handleLinkAdd(
                              {
                                audioUrl: track.url,
                                title: track.title,
                                artist: track.artist,
                              },
                              { keepModalOpen: true, suppressNotice: false },
                            )
                            setAlbumInfoDownloadingIds((prev) => {
                              const next = new Set(prev)
                              next.delete(trackKey)
                              return next
                            })
                          }}
                        >
                          <span className="artist-profile-track-cover">
                            {track.coverUrl ? (
                              <img src={track.coverUrl} alt="" className="track-thumb-image" />
                            ) : (
                              <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                            )}
                          </span>
                          <span className="artist-profile-track-copy">
                            <strong>{track.title}</strong>
                            <small>{track.artist}</small>
                          </span>
                          <span className={`artist-profile-track-action ${isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? 'added' : ''}`}>
                            {isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? (
                              <>
                                <Check size={12} />
                                {t('added', 'Eklendi')}
                              </>
                            ) : albumInfoDownloadingIds.has(String(track.id || track.url || '')) ? (
                              <span className="spinner-dot">●</span>
                            ) : (
                              t('download', 'İndir')
                            )}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="about-text">{tt('Bu albüm için YouTube Music şarkısı bulunamadı.', 'No YouTube Music tracks found for this album.')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      {homeMoodModalOpen ? (
        <MotionDiv
          className="modal-backdrop"
          onClick={() => setHomeMoodModalOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <MotionDiv
            className="modal-card glass album-info-modal"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
          >
            <div className="panel-header">
              <div>
                <p className="eyebrow">Mood playlist</p>
                <h3>{homeMoodModalTitle || 'YouTube Music playlist'}</h3>
                <span className="panel-subtitle">{tt('Moduna göre önerilen liste', 'Mood-based recommended list')}</span>
              </div>
              <button className="mini-button ghost" onClick={() => setHomeMoodModalOpen(false)}>
                <X size={14} />
                {t('close', 'Kapat')}
              </button>
            </div>
            <div className="artist-profile-track-list home-mood-modal-list">
              {homeMoodModalLoading ? <p className="about-text">{tt('Playlist yükleniyor...', 'Loading playlist...')}</p> : null}
              {!homeMoodModalLoading && !homeMoodModalTracks.length ? (
                <p className="about-text">{tt('Bu playlist için şarkı bulunamadı.', 'No songs found for this playlist.')}</p>
              ) : null}
              {homeMoodModalTracks.map((track) => (
                <button
                  key={`mood-track-${track.id}`}
                  type="button"
                  className="artist-profile-track-row"
                  onClick={async () => {
                    if (isTrackAlreadyInLibraryByMeta(track.title, track.artist) || !track.url) {
                      return
                    }
                    const trackKey = String(track.id || track.url || '')
                    setHomeMoodDownloadingIds((prev) => {
                      const next = new Set(prev)
                      next.add(trackKey)
                      return next
                    })
                    await handleLinkAdd(
                      {
                        audioUrl: track.url,
                        title: track.title,
                        artist: track.artist,
                      },
                      { keepModalOpen: true, suppressNotice: true },
                    )
                    setHomeMoodDownloadingIds((prev) => {
                      const next = new Set(prev)
                      next.delete(trackKey)
                      return next
                    })
                  }}
                >
                  <span className="artist-profile-track-cover">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt="" className="track-thumb-image" />
                    ) : (
                      <span className="track-thumb-fallback" style={{ background: gradients[0] }} />
                    )}
                  </span>
                  <span className="artist-profile-track-copy">
                    <strong>{track.title}</strong>
                    <small>{track.artist}</small>
                  </span>
                  <span className={`artist-profile-track-action ${isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? 'added' : ''}`}>
                    {isTrackAlreadyInLibraryByMeta(track.title, track.artist) ? (
                      <>
                        <Check size={12} />
                        {t('loaded', 'Yüklü')}
                      </>
                    ) : homeMoodDownloadingIds.has(String(track.id || track.url || '')) ? (
                      <span className="spinner-dot">●</span>
                    ) : (
                      t('download', 'İndir')
                    )}
                  </span>
                </button>
              ))}
            </div>
          </MotionDiv>
        </MotionDiv>
      ) : null}

      <div className="dashboard">
        <MotionAside
          className="library-panel glass"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="panel-header">
            <div>
              <p className="eyebrow">{t('library', 'Kütüphane')}</p>
              <span className="panel-subtitle">{activeCollectionLabel}</span>
            </div>

            <div className="panel-header-actions">
              <button className="mini-upload" onClick={(event) => { event.stopPropagation(); openAddModal() }}>
                <Plus size={16} />
                {t('add', 'Ekle')}
              </button>
              <button
                className={`mini-button collection-quick-switch ${selectedCollectionId === 'home' ? 'primary' : 'ghost'}`}
                onClick={() => handleCollectionSelect('home')}
                title={t('home', 'Ana menü')}
              >
                <ListMusic size={14} />
                {t('home', 'Ana menü')}
              </button>
            </div>
          </div>

          <div className={`library-body ${playlistRailCollapsed ? 'playlist-rail-collapsed' : ''}`}>
            <aside className={`playlist-rail ${playlistRailCollapsed ? 'collapsed' : ''}`}>
              <div className="playlist-rail-header">
                <h4>{t('playlists', 'Playlistler')}</h4>
                <div className="playlist-rail-header-actions">
                  <button
                    type="button"
                    className="playlist-rail-collapse-toggle"
                    onClick={() => setPlaylistRailCollapsed((prev) => !prev)}
                    title={playlistRailCollapsed ? t('expand', 'Genişlet') : t('collapse', 'Küçült')}
                    aria-label={playlistRailCollapsed ? t('expand', 'Genişlet') : t('collapse', 'Küçült')}
                  >
                    {playlistRailCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                  </button>
                  <button className="mini-upload playlist-create-trigger" onClick={openPlaylistCreator}>
                    <Plus size={16} />
                    {playlistRailCollapsed ? '' : t('create', 'Oluştur')}
                  </button>
                </div>
              </div>

              <div className="library-collections-layout">
                <div className="playlist-rail-list">
                  <div className={`playlist-rail-row playlist-rail-row--all ${selectedCollectionId === 'all' ? 'selected' : ''}`}>
                    <button
                      className="playlist-rail-main"
                      type="button"
                      onClick={() => handleCollectionSelect('all')}
                    >
                      <span className="playlist-rail-cover">
                        <span className="playlist-rail-cover-fallback" style={{ background: playlistColors[0] }}>
                          A
                        </span>
                      </span>
                      <span className="playlist-rail-copy">
                        <strong>{t('allTracks', 'Tüm parçalar')}</strong>
                        <span>{tf('songsCount', { count: tracks.length }, `${tracks.length} şarkı`)}</span>
                      </span>
                    </button>
                  </div>
                  <div className={`playlist-rail-row playlist-rail-row--favorites ${selectedCollectionId === 'favorites' ? 'selected' : ''}`}>
                    <button
                      className="playlist-rail-main"
                      type="button"
                      onClick={() => handleCollectionSelect('favorites')}
                    >
                      <span className="playlist-rail-cover">
                        <span className="playlist-rail-cover-fallback" style={{ background: '#ef4444' }}>
                          ♥
                        </span>
                      </span>
                      <span className="playlist-rail-copy">
                        <strong>{t('favorites', 'Favoriler')}</strong>
                        <span>{tf('songsCount', { count: tracks.filter((track) => track.isFavorite).length }, `${tracks.filter((track) => track.isFavorite).length} şarkı`)}</span>
                      </span>
                    </button>
                  </div>
                  {playlists.length === 0 ? (
                    <div className="menu-empty">{t('noPlaylistYet', 'Henüz playlist yok')}</div>
                  ) : (
                    playlists.map((playlist) => {
                      const isSelected = selectedCollectionId === playlist.id
                      const coverLetter = playlist.name?.trim()?.[0]?.toUpperCase() || 'P'

                      return (
                        <div
                          key={playlist.id}
                          className={`playlist-rail-row ${isSelected ? 'selected' : ''}`}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                          }}
                        >
                          <button
                            className="playlist-rail-main"
                            type="button"
                            onClick={() => handleCollectionSelect(playlist.id)}
                            onContextMenu={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                            }}
                          >
                            <span className="playlist-rail-cover">
                              {playlist.coverUrl ? (
                                <img
                                  src={playlist.coverUrl}
                                  alt={`${playlist.name} ${t('coverAlt', 'kapak')}`}
                                  onContextMenu={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                                  }}
                                />
                              ) : (
                                <span
                                  className="playlist-rail-cover-fallback"
                                  style={{ background: playlist.color || playlistColors[0] }}
                                  onContextMenu={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    openPlaylistContextMenu(playlist.id, { x: event.clientX, y: event.clientY })
                                  }}
                                >
                                  {coverLetter}
                                </span>
                              )}
                            </span>
                                <span className="playlist-rail-copy">
                              <strong>{playlist.name}</strong>
                              <span>{tf('songsCount', { count: playlist.trackIds.length }, `${playlist.trackIds.length} şarkı`)}</span>
                            </span>
                          </button>
                        </div>
                      )
                    })
                  )}
                  {monthlyGeneratedCollections.length ? (
                    <>
                      <div className="playlist-rail-generated-title">{t('specialPlaylists', 'Özel playlistler')}</div>
                      {monthlyGeneratedCollections.map((playlist) => {
                        const isSelected = selectedCollectionId === playlist.id
                        return (
                          <div key={playlist.id} className={`playlist-rail-row ${isSelected ? 'selected' : ''}`}>
                            <button
                              className="playlist-rail-main"
                              type="button"
                              onClick={() => handleCollectionSelect(playlist.id)}
                            >
                              <span className="playlist-rail-cover">
                                <span className="playlist-rail-cover-fallback" style={{ background: '#ffffff', color: '#0a0a0a' }}>
                                  M
                                </span>
                              </span>
                              <span className="playlist-rail-copy">
                                <strong>{playlist.name}</strong>
                                <span>{tf('songsCount', { count: playlist.count }, `${playlist.count} şarkı`)}</span>
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className={`track-column ${selectedCollectionId === 'pool' ? 'pool-collection' : ''}`}>
              {selectedCollectionId !== 'pool' && selectedCollectionId !== 'home' ? (
                <div className="collection-hero glass">
                  <span className="collection-hero-cover">
                    {activeCollectionCover ? (
                      <img src={activeCollectionCover} alt={`${activeCollectionLabel} ${t('coverAlt', 'kapak')}`} />
                    ) : (
                      <span className="collection-hero-fallback" style={{ background: activeCollectionColor }}>
                        {activeCollectionLabel?.trim()?.[0]?.toUpperCase() || 'P'}
                      </span>
                    )}
                  </span>
                  <div className="collection-hero-details">
                    <div className="collection-hero-copy">
                      <p className="eyebrow">{t('selectedCollection', 'Seçili koleksiyon')}</p>
                      <strong>{activeCollectionLabel}</strong>
                      <span>{activeCollectionDescription}</span>
                    </div>
                    <div className="collection-meta-plain">
                      <p><strong>{t('collection', 'Koleksiyon')}:</strong> {tf('trackCount', { count: visibleTracks.length }, `${visibleTracks.length} parca`)}</p>
                      <p><strong>{t('totalDuration', 'Toplam süre')}:</strong> {formatCollectionDuration(selectedCollectionDuration, language)}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedCollectionId === 'home' ? (
                <div className="home-rows">
                  <section className="home-row glass home-latest-release-row">
                    {homeLatestReleaseLoading && !homeLatestRelease ? (
                      <p className="menu-empty">{t('recommendationSearching', 'Öneri aranıyor...')}</p>
                    ) : null}
                    {!homeLatestReleaseLoading && !homeLatestRelease ? (
                      <p className="menu-empty">{t('recommendationNotFound', 'Öneri bulunamadı')}</p>
                    ) : null}
                    {!homeLatestReleaseLoading && homeLatestRelease ? (
                      <div
                        className="home-latest-release-card"
                        style={
                          homeLatestRelease.coverUrl
                            ? {
                              backgroundImage: `linear-gradient(120deg, rgba(8, 10, 16, 0.9), rgba(8, 10, 16, 0.58)), url(${homeLatestRelease.coverUrl})`,
                            }
                            : undefined
                        }
                      >
                        <div className="home-latest-release-right home-latest-release-right--large">
                          {homeLatestRelease.coverUrl ? (
                            <img src={homeLatestRelease.coverUrl} alt={homeLatestRelease.title || t('coverAlt', 'Kapak')} />
                          ) : (
                            <span className="home-row-cover-fallback" style={{ background: '#ffffff', color: '#111' }}>
                              {(homeLatestRelease.title || 'Y').slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="home-latest-release-left">
                          <strong>{homeLatestRelease.title || t('unknownContent', 'Bilinmeyen içerik')}</strong>
                          <span>{homeLatestRelease.artist || t('unknownArtist', 'Bilinmeyen sanatçı')}</span>
                          <div className="home-latest-release-actions">
                            <button
                              type="button"
                              className="mini-button primary"
                              onClick={() =>
                                handleTopbarYouTubeDirectAdd({
                                  id: String(homeLatestRelease.id || ''),
                                  type: 'song',
                                  title: String(homeLatestRelease.title || ''),
                                  artist: String(homeLatestRelease.artist || ''),
                                  thumbnail: String(homeLatestRelease.coverUrl || ''),
                                  url: String(
                                    homeLatestRelease.url
                                    || (homeLatestRelease.id ? `https://music.youtube.com/watch?v=${homeLatestRelease.id}` : ''),
                                  ),
                                })}
                            >
                              {t('download', 'İndir')}
                            </button>
                            <button
                              type="button"
                              className="mini-button ghost"
                              onClick={() =>
                                homeLatestRelease?.url
                                  ? window.novaPlayer?.openExternal?.(homeLatestRelease.url)
                                  : null}
                            >
                              {t('open', 'Aç')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </section>

                  <section className="home-pinned-block glass">
                    <div className="home-recent-layout">
                      <div className="home-pinned-list home-recent-grid" ref={homePinnedRowRef}>
                        {homeRecentTracks.map((track) => (
                          <button
                            key={`home-recent-${track.id}`}
                            type="button"
                            className="home-pinned-item"
                            onClick={() => switchTrack(track, true, { restartIfSame: true })}
                            title={track.title || t('tracks', 'Parça')}
                          >
                            <span className="home-pinned-cover">
                              {getTrackDisplayUrl(track, 'thumb') ? (
                                <img src={getTrackDisplayUrl(track, 'thumb')} alt="" />
                              ) : (
                                <span className="home-row-cover-fallback" style={{ background: track.gradient || playlistColors[0] }}>
                                  {(track.title || '?').slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="home-pinned-copy">
                              <strong>{track.title || t('unknownTrack', 'Bilinmeyen parça')}</strong>
                              <small>{track.artist || t('noArtist', 'Sanatçı yok')}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="home-recent-albums">
                        {homeRecentAlbums.map((track) => (
                          <button
                            key={`home-random-album-${track.id}`}
                            type="button"
                            className="home-pinned-item home-recent-album-item"
                            onClick={() => openAlbumInfo(track, { preferDownloads: true })}
                            title={`${track.album || t('album', 'Albüm')} • ${track.artist || ''}`}
                          >
                            <span className="home-pinned-cover">
                              {getTrackDisplayUrl(track, 'thumb') ? (
                                <img src={getTrackDisplayUrl(track, 'thumb')} alt="" />
                              ) : (
                                <span className="home-row-cover-fallback" style={{ background: track.gradient || playlistColors[0] }}>
                                  {(track.album || '?').slice(0, 1).toUpperCase()}
                                </span>
                              )}
                            </span>
                            <span className="home-pinned-copy">
                              <strong>{track.album || t('album', 'Albüm')}</strong>
                              <small>{track.artist || t('noArtist', 'Sanatçı yok')}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="home-row glass">
                    <div className="home-row-head">
                      <div className="home-row-nav">
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => scrollHomeRowBy('playlists', -1)}
                          disabled={!homeRowScrollState.playlists.canLeft}
                          title={t('scrollLeft', 'Sola kaydır')}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => scrollHomeRowBy('playlists', 1)}
                          disabled={!homeRowScrollState.playlists.canRight}
                          title={t('scrollRight', 'Sağa kaydır')}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="home-row-list" ref={homePlaylistRowRef}>
                      {homePlaylistRows.length ? homePlaylistRows.map((item) => (
                        <button
                          key={`home-playlist-${item.id}`}
                          type="button"
                          className="home-row-card"
                          onClick={() => handleCollectionSelect(item.id)}
                        >
                          <span className="home-row-cover">
                            {item.cover ? (
                              <img src={item.cover} alt="" />
                            ) : (
                              <span className="home-row-cover-fallback" style={{ background: item.color }}>
                                {item.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </span>
                          <strong>{item.name}</strong>
                          <small>{tf('songsCount', { count: item.count }, `${item.count} şarkı`)}</small>
                        </button>
                      )) : <p className="menu-empty">{t('noPlaylistYet', 'Henüz playlist yok')}</p>}
                    </div>
                  </section>

                  <section className="home-row glass">
                    <div className="home-row-head">
                      <div className="home-row-nav">
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => refreshHomeMoodPlaylists()}
                          disabled={homeMoodLoading}
                          title={tt('Playlistleri yenile', 'Refresh playlists')}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => scrollHomeRowBy('mood', -1)}
                          disabled={!homeRowScrollState.mood.canLeft}
                          title={t('scrollLeft', 'Sola kaydır')}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="mini-button ghost"
                          onClick={() => scrollHomeRowBy('mood', 1)}
                          disabled={!homeRowScrollState.mood.canRight}
                          title={t('scrollRight', 'Sağa kaydır')}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="home-row-list home-mood-list" ref={homeMoodRowRef}>
                      {homeMoodLoading ? <p className="menu-empty">{tt('Playlistler yükleniyor...', 'Loading playlists...')}</p> : null}
                      {!homeMoodLoading && !homeMoodPlaylists.length ? (
                        <p className="menu-empty">{tt('Benzer playlist bulunamadı', 'No similar playlist found')}</p>
                      ) : null}
                      {homeMoodPlaylists.map((item) => (
                        <button
                          key={`home-mood-${item.id}`}
                          type="button"
                          className="home-row-card home-mood-card"
                          onClick={() => openHomeMoodPlaylist(item)}
                        >
                          <span className="home-row-cover">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt="" />
                            ) : (
                              <span className="home-row-cover-fallback" style={{ background: '#ffffff', color: '#111' }}>
                                {item.mood?.slice(0, 1) || 'M'}
                              </span>
                            )}
                          </span>
                          <strong>{item.title}</strong>
                          <small>{item.mood} • {item.artist}</small>
                        </button>
                      ))}
                    </div>
                  </section>

                </div>
              ) : null}

              <div className="library-search track-search-top">
                <input
                  type="search"
                  value={trackSearchQuery}
                  onChange={(event) => setTrackSearchQuery(event.target.value)}
                  placeholder={t('searchPlaceholder', 'Şarkı, sanatçı veya albüm ara')}
                />
                {selectedCollectionId === 'pool' ? (
                  <label className="track-search-toggle">
                    <input
                      type="checkbox"
                      checked={hideDownloadedPoolTracks}
                      onChange={(event) => setHideDownloadedPoolTracks(event.target.checked)}
                    />
                    <span>{t('downloadedOnly', 'İndirdiklerimi gizle')}</span>
                  </label>
                ) : null}
              </div>

              <div className={selectedCollectionId === 'pool' ? 'pool-browser-layout' : ''}>
                {selectedCollectionId === 'pool' ? (
                  <aside className="pool-artist-column glass">
                    <div className="pool-artist-head">
                      <p className="eyebrow">{t('poolArtists', 'Sanatçılar')}</p>
                      <strong>{tf('artistCount', { count: poolArtists.length }, `${poolArtists.length} sanatçı`)}</strong>
                      <span>{t('poolArtistHint', 'Havuzdaki parçaları sanatçıya göre filtrele')}</span>
                    </div>
                    <div className="pool-artist-list">
                      <button
                        className={`pool-artist-item ${poolArtistFilter === 'all' ? 'active' : ''}`}
                        type="button"
                        onClick={() => setPoolArtistFilter('all')}
                      >
                        <strong className="pool-artist-name">
                          <span>{t('allArtists', 'Tüm şarkıcılar')}</span>
                        </strong>
                        <span>{tf('trackCount', { count: serverTracks.length }, `${serverTracks.length} parça`)}</span>
                      </button>
                      {poolArtists.map((artistItem) => (
                        <button
                          key={`pool-artist-${artistItem.name}`}
                          className={`pool-artist-item ${poolArtistFilter === artistItem.name ? 'active' : ''}`}
                          type="button"
                          onClick={() => setPoolArtistFilter(artistItem.name)}
                        >
                          <strong className="pool-artist-name">
                            <span>{artistItem.name}</span>
                            {artistItem.addedCount > 0 ? (
                              <span className="pool-added-check" title={tt('Kütüphanende bu sanatçıdan şarkı var', 'You have songs by this artist in your library')}>
                                <Check size={12} />
                              </span>
                            ) : null}
                          </strong>
                          <span>{tf('trackCount', { count: artistItem.count }, `${artistItem.count} parça`)}</span>
                        </button>
                      ))}
                    </div>
                  </aside>
                ) : null}

                <div className={selectedCollectionId === 'pool' ? 'pool-browser-main' : ''}>
                  {selectedCollectionId === 'pool' ? (
                    <div className="pool-browser-summary glass">
                      <div>
                        <span>{t('selectedArtist', 'Seçili sanatçı')}</span>
                        <strong>{poolArtistFilter === 'all' ? t('allArtists', 'Tüm şarkıcılar') : poolArtistFilter}</strong>
                      </div>
                      <div>
                        <span>{t('shownTracks', 'Gösterilen şarkı')}</span>
                        <strong>{tf('trackCount', { count: displayedTracks.length }, `${displayedTracks.length} parça`)}</strong>
                      </div>
                      <div>
                        <span>{t('totalPool', 'Toplam havuz')}</span>
                        <strong>{tf('trackCount', { count: serverTracks.length }, `${serverTracks.length} parça`)}</strong>
                      </div>
                    </div>
                  ) : null}
                  <div className="playlist-section">
                    <div className="playlist-section-header">
                      {selectedCollectionId !== 'home' ? <h4>{t('tracks', 'Parçalar')}</h4> : <span />}
                      <div className="playlist-section-actions">
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={refreshPoolTracksNow}
                            disabled={poolRefreshing || poolBulkDownloading}
                            title={t('refreshPool', 'Müzik havuzunu yenile')}
                          >
                            <RefreshCw size={14} />
                            {poolRefreshing ? tt('Yenileniyor...', 'Refreshing...') : tt('Yenile', 'Refresh')}
                          </button>
                        ) : null}
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={downloadAllPoolTracks}
                            disabled={poolBulkDownloading || poolDownloadingTrackId || downloadablePoolTracks.length === 0}
                            title={tt('Havuzdaki tüm indirilebilir şarkıları indir', 'Download all downloadable pool tracks')}
                          >
                            <Download size={14} />
                            {poolBulkDownloading ? t('downloading', 'İndiriliyor...') : `${t('downloadAll', 'Hepsini indir')} (${downloadablePoolTracks.length})`}
                          </button>
                        ) : null}
                        {selectedCollectionId === 'pool' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={downloadSelectedPoolTracks}
                            disabled={poolBulkDownloading || poolDownloadingTrackId || selectablePoolTracks.length === 0}
                            title={tt('Seçilen şarkıları toplu indir', 'Download selected tracks in bulk')}
                          >
                            <Download size={14} />
                            {poolBulkDownloading
                              ? tt('Toplu indiriliyor...', 'Bulk downloading...')
                              : `${t('downloadSelected', 'Seçileni indir')} (${selectablePoolTracks.length})`}
                          </button>
                        ) : null}
                        {selectedCollectionId !== 'pool' && selectedCollectionId !== 'home' ? (
                          <button
                            className="mini-button playlist-action-button"
                            onClick={openBulkEditor}
                            disabled={!tracks.length}
                            title={t('bulkEditTitle', 'Şarkıları toplu düzenle')}
                          >
                            <Edit3 size={14} />
                            {t('bulkEdit', 'Toplu düzenle')}
                          </button>
                        ) : null}
                        {isPlaylistCollectionSelected ? (
                          <>
                            {isCustomPlaylistSelected ? (
                              <button
                                className="mini-button playlist-action-button"
                                onClick={() => currentPlaylist && openPlaylistEditor(currentPlaylist)}
                                disabled={!currentPlaylist}
                                title={t('editPlaylist', "Playlist'i düzenle")}
                              >
                                <Edit3 size={14} />
                                {t('editPlaylist', "Playlist'i düzenle")}
                              </button>
                            ) : null}
                            {isCustomPlaylistSelected ? (
                              <button
                                className="mini-button playlist-action-button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openPlaylistAddModal()
                                }}
                                disabled={!currentPlaylist}
                                title={t('addSongsToPlaylist', "Playlist'e şarkı ekle")}
                              >
                                <Plus size={14} />
                                {t('addSongsToPlaylist', "Playlist'e şarkı ekle")}
                              </button>
                            ) : null}
                            <button
                              className="mini-button playlist-action-button"
                              onClick={playSelectedCollection}
                              disabled={!visibleTracks.length}
                              title={t('playPlaylistInOrder', 'Playlisti sırayla çal')}
                            >
                              <Play size={14} />
                              {t('play', 'Çal')}
                            </button>
                            <button
                              className="mini-button playlist-action-button"
                              onClick={shufflePlaySelectedCollection}
                              disabled={!visibleTracks.length}
                              title={t('playPlaylistShuffled', 'Playlisti karışık çal')}
                            >
                              <Shuffle size={14} />
                              {t('shufflePlay', 'Karışık çal')}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {selectedCollectionId !== 'home' && tracks.length === 0 ? (
                        <button className="playlist-empty-card" onClick={(event) => { event.stopPropagation(); openAddModal() }}>
                          <h4>{t('noSongsYet', 'Henüz şarkı yok')}</h4>
                          <p>{t('addFileOrDrive', 'Dosya veya Drive bağlantısı ekleyebilirsin.')}</p>
                        </button>
                    ) : selectedCollectionId !== 'home' ? (
                      <div className="playlist-track-hint">
                        <p>{tf('totalTracksReady', { count: tracks.length }, `Toplam ${tracks.length} şarkı hazır. Dosya veya bağlantı eklemek için Ekle butonunu kullan.`)}</p>
                      </div>
                    ) : null}
                  </div>

                  {selectedCollectionId !== 'home' ? (
                  <div
                    ref={trackListViewportRef}
                    className={selectedCollectionId === 'pool' ? 'pool-tracks-scroll' : ''}
                    onScroll={handleTrackListScroll}
                  >
                    {displayedTracks.length === 0 ? (
                      <div className="empty-state compact">
                        <div className="empty-orb" />
                          <h4>{visibleTracks.length === 0 ? t('noTracksYet', 'Henüz parça yok') : t('noResults', 'Sonuç bulunamadı')}</h4>
                        <p>
                          {visibleTracks.length === 0
                            ? t('noTracksHint', 'Dosya ya da link ekleyince burada temiz bir liste halinde görünecek.')
                            : t('noResultsHint', 'Arama veya indirilebilir filtresini değiştirip tekrar dene.')}
                        </p>
                        {visibleTracks.length === 0 && isCustomPlaylistSelected ? (
                          <div className="empty-state-actions">
                            <button
                              type="button"
                              className="mini-button primary"
                              onClick={() => handleCollectionSelect('all')}
                            >
                              {t('goAllTracksAdd', 'Tüm parçalara git ve şarkı ekle')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                    <div className={`track-list ${isHugeTrackList ? 'huge' : ''}`} key={`track-list-${trackListLayoutVersion}`}>
                      {virtualTopSpacer > 0 ? <div style={{ height: `${virtualTopSpacer}px` }} aria-hidden="true" /> : null}
                      {renderedTracks.map((track, index) => {
                const absoluteIndex = virtualStartIndex + index
                const isActive = currentTrack?.id === track.id
              const isEditing = editTargetId === track.id
              const isPoolCollection = selectedCollectionId === 'pool'
              const isMonthlyCollection = selectedCollectionId.startsWith('monthly:')
              const isAlreadyInLibrary = isPoolCollection && isTrackInLocalLibrary(track)
              const localLibraryMatch =
                isPoolCollection && isAlreadyInLibrary
                  ? localLibraryTrackByKey.get(getLocalLibraryMatchKey(track)) || null
                  : null
              const contextMenuTrackId = localLibraryMatch?.id || track.id
              const hasPoolDuration = !isPoolCollection || (Number(track.duration || 0) > 0)
              const canDragReorder = !isMonthlyCollection && track.source !== 'drive' && track.source !== 'shared'
              const isDragged = draggedTrackId === track.id
              const isDropTarget = dragOverTrackId === track.id && draggedTrackId && draggedTrackId !== track.id

                return (
                  <div
                    key={track.id}
                    className={`track-row ${
                      isActive ? 'active' : ''
                    } ${trackMenuId === track.id ? 'menu-open' : ''} ${isDragged ? 'dragging' : ''} ${isDropTarget ? 'drag-over' : ''} ${
                      isPoolCollection ? `pool-track-row ${hasPoolDuration ? 'has-duration' : 'no-duration'}` : ''
                    } ${isPoolCollection && poolSelectedTrackIdSet.has(track.id) ? 'pool-selected' : ''}`}
                    style={{ '--row-index': Math.min(absoluteIndex, 18) }}
                    onClick={(event) => {
                      if (selectedCollectionId !== 'pool') {
                        return
                      }
                      handlePoolTrackRowClick(event, track, absoluteIndex)
                    }}
                    onContextMenu={(event) => {
                      if (isPoolCollection && !isAlreadyInLibrary) {
                        event.preventDefault()
                        event.stopPropagation()
                        return
                      }
                      event.preventDefault()
                      event.stopPropagation()
                      openTrackMenu(contextMenuTrackId, null, { x: event.clientX, y: event.clientY })
                    }}
                    onDragEnter={() => {
                      if (!draggedTrackId || !canDragReorder) {
                        return
                      }
                      setDragOverTrackId(track.id)
                    }}
                    onDragOver={(event) => {
                      if (!draggedTrackId || !canDragReorder) {
                        return
                      }
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      setDragOverTrackId(track.id)
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const droppedId = event.dataTransfer.getData('text/plain') || draggedTrackId
                      reorderTracksByDrag(droppedId, track.id)
                      setDraggedTrackId(null)
                      setDragOverTrackId(null)
                    }}
                    onDragEnd={() => {
                      setDraggedTrackId(null)
                      setDragOverTrackId(null)
                    }}
                    onDoubleClick={() => {
                      if (selectedCollectionId === 'pool') {
                        downloadPoolTrackToLibrary(track)
                        return
                      }

                      if (currentTrackId === track.id) {
                        restartTrack()
                        setIsPlaying(true)
                        return
                      }

                      playTrack(track.id)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        playTrack(track.id)
                      }
                    }}
                  >
                    {isMonthlyCollection ? (
                      <span className="track-rank-badge" aria-label={`${t('order', 'Sıra')} ${absoluteIndex + 1}`}>
                        {absoluteIndex + 1}.
                      </span>
                    ) : (
                      <button
                        className="track-drag-handle"
                        type="button"
                        tabIndex={-1}
                        aria-label={t('dragToSort', 'Sıralamak için sürükle')}
                        title={canDragReorder ? t('dragToSort', 'Sıralamak için sürükle') : t('cannotReorder', 'Bu şarkının sırası değiştirilemez')}
                        disabled={!canDragReorder}
                        onClick={(event) => event.stopPropagation()}
                        draggable={canDragReorder}
                        onDragStart={(event) => {
                          event.stopPropagation()
                          if (!canDragReorder) {
                            event.preventDefault()
                            return
                          }
                          setDraggedTrackId(track.id)
                          setDragOverTrackId(track.id)
                          event.dataTransfer.effectAllowed = 'move'
                          event.dataTransfer.setData('text/plain', track.id)
                        }}
                        onDragEnd={() => {
                          setDraggedTrackId(null)
                          setDragOverTrackId(null)
                        }}
                      >
                        <GripVertical size={14} />
                      </button>
                    )}

                      <button
                        type="button"
                        className="track-thumb"
                        onClick={(event) => {
                          event.stopPropagation()
                          if (selectedCollectionId === 'pool') {
                            downloadPoolTrackToLibrary(track)
                            return
                          }
                          playTrack(track.id)
                        }}
                        title={t('clickCoverToPlay', 'Kapağa tıklayarak oynat')}
                      >
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img
                            src={getTrackDisplayUrl(track, 'thumb')}
                            alt={`${track.title} ${t('coverAlt', 'kapak')}`}
                            className="track-thumb-image"
                            loading="lazy"
                            decoding="async"
                            onError={() => handleTrackCoverImageError(track)}
                          />
                      ) : (
                        <div className="track-thumb-fallback" style={{ background: track.gradient }} />
                      )}
                    </button>

                    <div className="track-info">
                      <div className="track-title-line">
                        <strong>{track.title}</strong>
                        <button
                          type="button"
                          className="track-artist-button track-artist-inline-button"
                          onClick={(event) => {
                            event.stopPropagation()
                            openArtistProfile(track.artist)
                          }}
                          title={tt(`${track.artist} detaylarını aç`, `Open ${track.artist} details`)}
                        >
                          <span className="track-artist-inline">{track.artist}</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        className="track-album-button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openAlbumInfo(track, { preferDownloads: true })
                        }}
                        title={tt(`${track.album || 'Single'} albüm detaylarını aç`, `Open ${track.album || 'Single'} album details`)}
                      >
                        <small className="track-album-inline">{track.album || 'Single'}</small>
                      </button>
                    </div>

                    {hasPoolDuration ? (
                      <div className="track-meta">
                        <span>{formatTime(track.duration)}</span>
                      </div>
                    ) : null}

                     {isPoolCollection ? (
                       <button
                         className={`track-download-button ${isAlreadyInLibrary ? 'added' : ''}`}
                         onClick={(event) => {
                           event.stopPropagation()
                           if (!track.audioUrl || isAlreadyInLibrary) {
                             return
                           }
                           downloadPoolTrackToLibrary(track)
                         }}
                         disabled={Boolean(poolBulkDownloading || poolDownloadingTrackId === track.id || !track.audioUrl || isAlreadyInLibrary)}
                         title={tt(`${track.artist} - ${track.title} için İndir ve Kütüphaneye ekle`, `Download and add ${track.artist} - ${track.title} to library`)}
                         aria-label={t('downloadAndAddToLibrary', 'İndir ve Kütüphaneye ekle')}
                       >
                         {isAlreadyInLibrary ? <Check size={16} /> : <Download size={16} />}
                         <span>
                           {isAlreadyInLibrary
                             ? t('added', 'Eklendi')
                             : poolDownloadingTrackId === track.id
                               ? t('adding', 'Ekleniyor...')
                               : t('downloadAndAddToLibrary', 'İndir ve Kütüphaneye ekle')}
                         </span>
                       </button>
                     ) : null}

                     {!isPoolCollection ? (
                       <button
                         className={`track-menu-trigger ${isEditing ? 'editing' : ''}`}
                         onClick={(event) => {
                           event.stopPropagation()
                           openTrackMenu(track.id, event.currentTarget)
                         }}
                         onDoubleClick={(event) => {
                           event.stopPropagation()
                         }}
                         aria-label={t('trackMenu', 'Parça menüsü')}
                       >
                         <MoreVertical size={16} />
                       </button>
                     ) : null}
                  </div>
                )
                      })}
                      {virtualBottomSpacer > 0 ? <div style={{ height: `${virtualBottomSpacer}px` }} aria-hidden="true" /> : null}
                    </div>
                    )}
                  </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </MotionAside>

        <AnimatePresence initial={false} mode="wait">
        {sidebarPlayerActive ? (
        <MotionSection
          key="sidebar-player-panel"
          className="player-panel glass"
          initial={{ opacity: 0, x: sidebarPlayerSide === 'left' ? -64 : 64, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: sidebarPlayerSide === 'left' ? -38 : 38, y: 54, scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 270, damping: 26, mass: 0.85 }}
        >
          <div className="player-panel-tools">
            <button
              className="icon-button"
              onClick={() => setSidebarPlayerSide((prev) => (prev === 'left' ? 'right' : 'left'))}
              aria-label={sidebarPlayerSide === 'left' ? t('movePlayerRight', 'Playerı sağa al') : t('movePlayerLeft', 'Playerı sola al')}
              title={sidebarPlayerSide === 'left' ? t('movePlayerRight', 'Playerı sağa al') : t('movePlayerLeft', 'Playerı sola al')}
            >
              {sidebarPlayerSide === 'left' ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
            <button
              className="icon-button"
              onClick={openFullscreenTrack}
              aria-label={t('fullscreenEffects', 'Tam ekran')}
              title={t('fullscreenEffects', 'Tam ekran')}
              disabled={!currentTrack}
            >
              <Maximize2 size={15} />
            </button>
            <button
              className={`icon-button ${queueOpen ? 'active' : ''}`}
              onClick={(event) => {
                event.stopPropagation()
                setQueueOpen((prev) => !prev)
              }}
              aria-label={t('queue', 'Sıradaki liste')}
              title={t('queue', 'Sıradaki liste')}
              disabled={!currentTrack}
            >
              <ListOrdered size={15} />
            </button>
            <button
              className={`icon-button ${currentTrack?.isFavorite ? 'active' : ''}`}
              onClick={toggleCurrentTrackFavorite}
              aria-label={t('favorites', 'Favori')}
              title={currentTrack?.isFavorite ? t('removeFavorite', 'Favoriden çıkar') : t('addFavorite', 'Favorilere ekle')}
              disabled={!currentTrack}
            >
              <Heart size={15} className={currentTrack?.isFavorite ? 'active-heart' : ''} />
            </button>
            <button
              className="icon-button"
              onClick={(event) => {
                event.stopPropagation()
                currentTrack && toggleDockPlaylistMenu(event.currentTarget)
              }}
              aria-label={t('addToPlaylist', 'Playliste ekle')}
              title={t('addToPlaylist', 'Playliste ekle')}
              disabled={!currentTrack}
            >
              <ListMusic size={15} />
            </button>
            <button
              className="mini-button ghost player-panel-toggle"
              onClick={() => setSidebarPlayerExpanded(false)}
              aria-label={t('shrinkPlayer', 'Playerı küçült')}
              title={t('shrinkPlayer', 'Playerı küçült')}
            >
              <Minimize2 size={14} />
              {t('collapse', 'Küçült')}
            </button>
          </div>

          <div className="player-now-box">
            <div className="now-playing">
              <AnimatePresence mode="wait">
                <MotionDiv
                  key={currentTrack?.id || 'empty-cover'}
                  ref={coverStageRef}

                  className={`cover-stage ${currentCoverUrl ? 'with-cover' : 'banner-only'}`}
                  style={{
                    background: sidebarPlayerActive ? 'transparent' : currentCoverTone,
                    '--cover-fg': currentCoverColors.fg,
                    '--cover-fg-soft': currentCoverColors.fgSoft,
                    '--cover-fg-muted': currentCoverColors.fgMuted,
                  }}
                  initial={{ opacity: 0.8, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="cover-compact-layout">
                    <div className="cover-art">
                      {currentCoverUrl ? (
                        <img
                          key={`player-cover-${currentTrack?.id || 'none'}-${playerCoverRefreshKey}`}
                          className="cover-image"
                          src={currentCoverUrl}
                          alt={`${currentTrack?.title || t('tracks', 'Parça')} ${t('coverAlt', 'kapak')}`}
                          onError={() => handleTrackCoverImageError(currentTrack)}
                        />
                      ) : (
                        <div className="track-thumb-fallback" style={{ background: currentTrack?.gradient || gradients[0] }} />
                      )}
                    </div>
                  </div>
                </MotionDiv>
              </AnimatePresence>

              <div className="player-track-summary">
                <div className="player-track-title-line">
                  <strong>{currentTrackDisplayTitle}</strong>
                </div>
                <div className="player-track-artist-line">
                  <button
                    type="button"
                    className="track-artist-button player-track-artist-inline"
                    onClick={() => openArtistProfile(currentTrack?.artist || '')}
                    disabled={!currentTrack?.artist}
                    title={currentTrack?.artist ? tt(`${currentTrack.artist} detaylarını aç`, `Open ${currentTrack.artist} details`) : t('artistInfo', 'Sanatçı bilgisi')}
                  >
                    {currentTrack?.artist || t('artistInfo', 'Sanatçı bilgisi')}
                  </button>
                </div>
                <button
                  type="button"
                  className="player-track-album-button"
                  onClick={() => openAlbumInfo(currentTrack, { preferDownloads: true })}
                  disabled={!currentTrack}
                  title={currentTrack?.album ? tt(`${currentTrack.album} albüm detayları`, `${currentTrack.album} album details`) : t('albumDetails', 'Albüm detayları')}
                >
                  <small className="player-track-album-line">{currentTrack?.album || 'Single'}</small>
                </button>
              </div>

              <div className="playback-sequence-card">
                <div
                  ref={playbackSequenceRef}
                  className="playback-sequence-list"
                  onPointerDown={handlePlaybackSequencePointerDown}
                  onPointerMove={handlePlaybackSequencePointerMove}
                  onPointerUp={handlePlaybackSequencePointerEnd}
                  onPointerCancel={handlePlaybackSequencePointerEnd}
                >
                  {playbackPreviewTracks.length ? (
                    playbackPreviewTracks.map((track, index) => {
                      const isCurrent = track?.id === currentTrackId
                      return (
                        <button
                          key={`${track?.id || 'empty'}-${index}`}
                          type="button"
                          className={`playback-sequence-item ${isCurrent ? 'active' : ''}`}
                          onClick={(event) => {
                            if (playbackSequenceDragRef.current.moved) {
                              event.preventDefault()
                              return
                            }
                            if (!track?.id || track.id === currentTrackId) {
                              return
                            }
                            switchTrack(track, true, {
                              enforceCooldown: false,
                              collectionId:
                                playbackCollectionId ||
                                (selectedCollectionId === 'pool' || selectedCollectionId === 'server'
                                  ? 'all'
                                  : selectedCollectionId),
                            })
                          }}
                          title={`${track?.title || t('tracks', 'Parça')} - ${track?.artist || ''}`}
                          disabled={!track?.id || isCurrent}
                        >
                          <span className="playback-sequence-cover">
                            {getTrackDisplayUrl(track, 'thumb') ? (
                              <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="track-thumb-image" />
                            ) : (
                              <span className="playlist-menu-cover-fallback" style={{ background: track?.gradient || currentThemeColor }}>
                                <ListMusic size={11} />
                              </span>
                            )}
                          </span>
                        </button>
                      )
                    })
                  ) : (
                    <p className="queue-empty">{t('queueReadyHint', 'Sıra hazır olduğunda burada görünecek.')}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="player-about-block">
              <div className="player-info-tabs">
                <button
                  className={`mini-button ${rightPanelTab === 'artist' ? 'primary' : 'ghost'}`}
                  type="button"
                  onClick={() => setRightPanelTab('artist')}
                >
                  {t('artistInfo', 'Sanatçı bilgisi')}
                </button>
                <button
                  className={`mini-button ${rightPanelTab === 'lyrics' ? 'primary' : 'ghost'}`}
                  type="button"
                  onClick={() => setRightPanelTab('lyrics')}
                >
                  {t('lyrics', 'Sözler')}
                </button>
              </div>

              <div className="player-info-content">
                {rightPanelTab === 'artist' ? (
                  <div className="player-artist-block">
                    <p className="about-title">{t('about', 'Hakkında')}</p>
                    {artistFactsLoading ? (
                      <p className="about-text">{t('artistInfoLoading', 'Sanatçı bilgisi çekiliyor...')}</p>
                    ) : artistFactLine ? (
                      <p className="about-text">{artistFactLine}</p>
                    ) : (
                      <p className="about-text">{t('artistInfoNotFound', 'Sanatçı bilgisi bulunamadı.')}</p>
                    )}
                    {artistFacts?.summary ? <p className="about-summary">{artistFacts.summary}</p> : null}
                    <div className="artist-photo">
                      {artistFacts?.photoUrl ? (
                        <img
                          src={artistFacts.photoUrl}
                          alt={`${currentTrack?.artist || t('artist', 'Sanatçı')} ${t('artistImageAlt', 'görseli')}`}
                          onError={(event) => {
                            const fallback = getTrackDisplayUrl(currentTrack, 'cover')
                            if (fallback && event.currentTarget.src !== fallback) {
                              event.currentTarget.src = fallback
                              return
                            }
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="artist-photo-fallback">
                          <UserRound size={20} />
                          <span>{t('noArtistImage', 'Sanatçı görseli yok')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="player-lyrics-block">
                    <p className="about-title">{t('lyrics', 'Sözler')}</p>
                    {lyricsLoading ? <p className="about-text">{t('lyricsLoading', 'Sözler yükleniyor...')}</p> : null}
                    {!lyricsLoading && lyricsText ? renderLyricsContent('player-lyrics-text', { visibleWindow: 18 }) : null}
                    {!lyricsLoading && !lyricsText ? (
                      <div className="player-lyrics-empty">
                        <p className="about-text">
                          {LYRICS_TEMP_DISABLED ? t('lyricsDisabledNotice', LYRICS_TEMP_DISABLED_NOTICE) : (lyricsError || t('lyricsNotFound', 'Sözler bulunamadı.'))}
                        </p>
                        {!LYRICS_TEMP_DISABLED ? (
                          <div className="editor-actions">
                            <button className="mini-button ghost" onClick={() => lyricsFileInputRef.current?.click()}>
                              <Upload size={14} />
                              {t('uploadTxt', 'TXT yükle')}
                            </button>
                            <button className="mini-button ghost" onClick={handleRetryLyricsSearch}>
                              {t('retrySearch', 'Tekrar ara')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="player-controls-box">
            <div className="control-row">
              <button
                className={`icon-button shuffle-toggle ${shuffleEnabled ? 'active' : ''}`}
                onClick={toggleShuffleMode}
                aria-label={t('shuffle', 'Karıştır')}
                title={shuffleEnabled ? t('shuffleOnTitle', 'Karıştır açık (kapat)') : t('shuffleOffTitle', 'Karıştır aç')}
              >
                <Shuffle size={18} />
              </button>
              <button className="icon-button" onClick={restartTrack} aria-label={t('restart', 'Başa al')} title={t('restartTrack', 'Şarkıyı başa sar')}>
                <Rewind size={18} />
              </button>

              <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? t('pause', 'Duraklat') : t('play', 'Oynat')} title={isPlaying && currentTrack ? t('pausePlayback', 'Çalmayı duraklat') : t('playTrack', 'Şarkıyı oynat')}>
                {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <button className="icon-button" onClick={stepTrack} aria-label={t('next', 'Sonraki')} title={t('nextTrack', 'Sonraki şarkıya geç')}>
                <Forward size={18} />
              </button>
              <button
                className={`icon-button repeat-toggle ${repeatEnabled ? 'active' : ''}`}
                onClick={toggleRepeatMode}
                aria-label={t('repeatOne', 'Aynı şarkıyı tekrarla')}
                title={repeatEnabled ? t('repeatOnTitle', 'Tekrar açık (kapat)') : t('repeatOffTitle', 'Tekrar aç')}
              >
                <Repeat size={18} />
              </button>
            </div>

            <div className="progress-block">
              <input
                className="range range-progress"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(progress, duration || 0)}
                onChange={handleSeek}
                disabled={!currentTrack}
              />
              <div className="time-row">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="volume-row">
              <Volume2 size={18} />
              <input
                className="range"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
              <span className="volume-percent-label">{`${Math.round((Number(volume) || 0) * 100)}%`}</span>
            </div>
          </div>

          <div className="editor-panel">
            <div className="panel-header">
              <div>
                  <p className="eyebrow">{t('editing', 'Düzenleme')}</p>
                <h3>
                  <ImageIcon size={18} />
                  {t('trackInfo', 'Parça bilgisi')}
                </h3>
              </div>
              <div className="editor-actions">
                <button className="mini-button ghost" onClick={closeEditor}>
                  <X size={14} />
                  {t('close', 'Kapat')}
                </button>
                <button className="mini-button" onClick={openCoverPicker} disabled={!editingTrack}>
                  <ImageIcon size={14} />
                  {t('coverAlt', 'Kapak')}
                </button>
                <button className="mini-button primary" onClick={handleSaveTrackChanges} disabled={!editDraft}>
                  <Save size={14} />
                  {t('save', 'Kaydet')}
                </button>
              </div>
            </div>

            {editDraft && editingTrack ? (
              <div className="editor-grid">
                <div className="editor-cover-wrap">
                  <button
                    type="button"
                    className="editor-cover editor-cover-button"
                    onClick={() => setCoverMenuOpen((prev) => !prev)}
                  >
                    {getTrackCoverUrl(editingTrack, pendingCover) ? (
                      <img
                        src={getTrackCoverUrl(editingTrack, pendingCover)}
                        alt={t('coverPreview', 'Kapak önizleme')}
                        className="editor-cover-image"
                        draggable={false}
                      />
                    ) : (
                      <div className="editor-cover-fallback" style={{ background: editingTrack.gradient }}>
                        <ImageIcon size={26} />
                      </div>
                    )}
                  </button>
                  {coverMenuOpen ? (
                    <div className="editor-cover-menu">
                      <button type="button" className="menu-item" onClick={openCoverPicker}>
                        <ImageIcon size={14} />
                        {t('changeCover', 'Kapağı değiştir')}
                      </button>
                      <button type="button" className="menu-item danger" onClick={requestCoverRemoval}>
                        <Trash2 size={14} />
                        {t('removeCover', 'Kapağı sil')}
                      </button>
                    </div>
                  ) : null}
                </div>

                <label className="field">
                  <span>{t('trackTitle', 'Şarkı adı')}</span>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(event) => handleEditChange('title', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>
                    <UserRound size={14} />
                  {t('artist', 'Sanatçı')}
                  </span>
                  <input
                    type="text"
                    value={editDraft.artist}
                    onChange={(event) => handleEditChange('artist', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>{t('album', 'Albüm')}</span>
                  <input
                    type="text"
                    value={editDraft.album || 'Single'}
                    onChange={(event) => handleEditChange('album', event.target.value)}
                    placeholder={t('albumPlaceholder', 'Albüm adı (yoksa Single)')}
                  />
                </label>

                <div className="cover-meta">
                  <span>{t('coverFile', 'Kapak dosyası')}</span>
                  <strong>
                    {coverRemovalRequested
                      ? t('willRemove', 'Kaldırılacak')
                      : pendingCover?.coverName || editingTrack.coverName || t('notSelected', 'Seçilmedi')}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="editor-empty">
                {t('chooseTrackToEdit', 'Bir parçayı seçip sağ üstteki düzenle butonuyla değişiklik yapabilirsin')}
              </div>
            )}
          </div>
        </MotionSection>
        ) : null}
        </AnimatePresence>

      <AnimatePresence initial={false} mode="wait">
      {!sidebarPlayerActive ? (
      <MotionFooter
        key="bottom-player-dock"
        ref={bottomDockRef}
        className={`player-dock glass ${bottomDockVisible ? '' : 'dock-auto-hidden'}`.trim()}
        style={themeVars}
        onMouseEnter={() => {
          setDockPointerInside(true)
          setDockProximityVisible(true)
        }}
        onMouseLeave={() => {
          setDockPointerInside(false)
        }}
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 44, x: -24, scale: 0.985 }}
        animate={{ opacity: bottomDockVisible ? 1 : 0.08, y: bottomDockVisible ? 0 : 90, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, x: 52, scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.84 }}
      >
        <div className="dock-track">
          <div
            className="dock-thumb"
            onClick={scrollToCoverStage}
            role="button"
            tabIndex={0}
          >
            {getTrackDisplayUrl(currentTrack, 'thumb') ? (
              <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt={`${currentTrack.title} ${t('coverAlt', 'kapak')}`} className="track-thumb-image" />
            ) : (
              <div className="track-thumb-fallback" style={{ background: currentTrack?.gradient || gradients[0] }} />
            )}
          </div>

          <div
            className="dock-meta"
            onClick={scrollToCoverStage}
            role="button"
            tabIndex={0}
          >
            <div className="dock-meta-row">
              <strong>{currentTrack?.title || tt('Bir parça seç', 'Choose a track')}</strong>
              <div className="dock-actions">
                <button
                  className={`dock-icon-button ${currentTrack?.isFavorite ? 'active' : ''} ${dockFavoritePulseId === currentTrack?.id ? 'favorite-pulse' : ''}`}
                  onClick={(event) => { event.stopPropagation(); toggleCurrentTrackFavorite() }}
                  aria-label={t('favorites', 'Favori')}
                >
                  <Heart size={16} className={currentTrack?.isFavorite ? 'active-heart' : ''} />
                </button>
                <button
                  className="dock-icon-button"
                  onClick={(event) => { event.stopPropagation(); currentTrack && toggleDockPlaylistMenu(event.currentTarget) }}
                  aria-label={t('addToPlaylist', 'Playliste ekle')}
                >
                  <ListMusic size={16} />
                </button>
                <button
                  className="dock-icon-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!currentTrack) {
                      return
                    }
                    openTrackMenu(currentTrack.id, event.currentTarget)
                  }}
                  onDoubleClick={(event) => event.stopPropagation()}
                  disabled={!currentTrack}
                  aria-label={t('trackMenu', 'Parça menüsü')}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
            <span>{currentTrack?.artist || t('artistInfo', 'Sanatçı bilgisi')}</span>
          </div>
        </div>

        <div className="dock-center">
          <div className="dock-controls">
            <button className={`icon-button shuffle-toggle ${shuffleEnabled ? 'active' : ''}`} onClick={toggleShuffleMode} aria-label={t('shufflePlay', 'Karışık çal')} title={shuffleEnabled ? tt('Karışık çalma açık (kapat)', 'Shuffle is on (turn off)') : tt('Karışık çalmayı aç', 'Turn shuffle on')}>
              <Shuffle size={18} />
            </button>

            <button className="icon-button" onClick={restartTrack} aria-label={t('restart', 'Başa al')} title={t('restartTrack', 'Şarkıyı başa sar')}>
              <Rewind size={18} />
            </button>

            <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? t('pause', 'Duraklat') : t('play', 'Oynat')} title={isPlaying && currentTrack ? t('pausePlayback', 'Çalmayı duraklat') : t('playTrack', 'Şarkıyı oynat')}>
              {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button className="icon-button" onClick={stepTrack} aria-label={t('next', 'Sonraki')} title={t('nextTrack', 'Sonraki şarkıya geç')}>
              <Forward size={18} />
            </button>

            <button className={`icon-button repeat-toggle ${repeatEnabled ? 'active' : ''}`} onClick={toggleRepeatMode} aria-label={tt('Tekrarla', 'Repeat')} title={repeatEnabled ? tt('Tekrarlama açık (kapat)', 'Repeat is on (turn off)') : tt('Şarkıyı tekrarlamayı aç', 'Turn repeat on')}>
              <Repeat size={18} />
            </button>
          </div>

          <div className="dock-progress dock-progress--compact">
            <div className="dock-progress-row">
              <span className="time-badge time-badge--start">{formatTime(progress)}</span>
              <input
                className="range range-progress"
                type="range"
                min="0"
                max={duration || 0}
                step="0.1"
                value={Math.min(progress, duration || 0)}
                onChange={handleSeek}
                disabled={!currentTrack}
              />
              <span className="time-badge time-badge--end">{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="dock-right">
          <div className="dock-utility-row">
            <button
              className={`dock-icon-button ${queueOpen ? 'active' : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setQueueOpen((prev) => !prev)
              }}
              disabled={!currentTrack}
              aria-label={t('queue', 'Sıradaki liste')}
            >
              <ListOrdered size={14} />
            </button>
            <button
              className={`dock-icon-button dock-lyrics-button ${lyricsOpen ? 'active' : ''}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                setLyricsOpen((prev) => !prev)
              }}
              disabled={!currentTrack}
              aria-label="Lyrics"
            >
              <Mic2 size={14} />
            </button>
            <button
              className="dock-icon-button dock-fullscreen-button"
              type="button"
              onClick={openFullscreenTrack}
              disabled={!currentTrack}
              aria-label={tt('Tam ekran', 'Fullscreen')}
            >
              <Maximize2 size={14} />
            </button>
            {windowCanUseSidebarPlayer && !sidebarPlayerActive ? (
              <button
                className="dock-icon-button"
                type="button"
                onClick={() => {
                  if (!windowCanUseSidebarPlayer) {
                    return
                  }
                  setSidebarPlayerExpanded(true)
                }}
                aria-label={t('openRightPlayer', 'Sağ playerı aç')}
                title={t('openRightPlayer', 'Sağ playerı aç')}
              >
                <Maximize2 size={14} />
              </button>
            ) : null}
            <div className="volume-row dock-volume-compact">
              <Volume2 size={18} />
              <input
                className="range range-compact"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
              <span className="volume-percent-label">{`${Math.round((Number(volume) || 0) * 100)}%`}</span>
            </div>
          </div>
        </div>
      </MotionFooter>
      ) : null}
      </AnimatePresence>

      {showScrollTopButton ? (
        <button
          type="button"
          className="scroll-top-fab"
          style={scrollTopButtonLeft ? { left: scrollTopButtonLeft } : undefined}
          onClick={scrollAllListsToTop}
          aria-label={t('toTop', 'En üste çık')}
          title={t('toTop', 'En üste çık')}
        >
          <ChevronUp size={18} />
          {t('toTop', 'En üste çık')}
        </button>
      ) : null}

      {fullscreenTrackOpen && currentTrack ? createPortal(
        <div
          className="fullscreen-track-backdrop"
          onClick={closeFullscreenTrack}
          onMouseMove={revealFullscreenControls}
          onMouseDown={(event) => {
            if (event.button === 0 || event.button === 2) {
              revealFullscreenControls()
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault()
            revealFullscreenControls()
          }}
        >
          <div
            className={`fullscreen-track-panel ${effectiveFullscreenEffectsEnabled ? '' : 'fullscreen-effects-off'}`.trim()}
            style={{
              background: effectiveFullscreenEffectsEnabled ? fullscreenGradient.background : currentCoverTone,
              '--cover-fg': fullscreenCoverColors.fg,
              '--cover-fg-soft': fullscreenCoverColors.fgSoft,
              '--cover-fg-muted': fullscreenCoverColors.fgMuted,
              '--fullscreen-control-bg': fullscreenControlBg,
              '--fullscreen-control-border': fullscreenControlBorder,
              '--fullscreen-control-fg': fullscreenCoverColors.fg,
              '--fullscreen-control-fg-soft': fullscreenCoverColors.fgSoft,
              '--fullscreen-control-fg-muted': fullscreenCoverColors.fgMuted,
              '--audio-level': Number.isFinite(fullscreenAudioLevel) ? fullscreenAudioLevel : 0,
              '--fullscreen-orb-a': fullscreenGradient.orbA,
              '--fullscreen-orb-b': fullscreenGradient.orbB,
              '--fullscreen-orb-c': fullscreenGradient.orbC,
            }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => {
              if (event.button === 0 || event.button === 2) {
                revealFullscreenControls()
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              revealFullscreenControls()
            }}
          >
            {effectiveFullscreenEffectsEnabled ? (
              <div className="fullscreen-audio-ambient" aria-hidden>
                <MotionDiv
                  className="fullscreen-ambient-blob blob-a"
                  animate={{ x: [0, 26, -20, 0], y: [0, -18, 14, 0], scale: [1, 1.08, 0.95, 1] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                />
                <MotionDiv
                  className="fullscreen-ambient-blob blob-b"
                  animate={{ x: [0, -24, 18, 0], y: [0, 16, -12, 0], scale: [1, 0.94, 1.08, 1] }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                />
                <MotionDiv
                  className="fullscreen-ambient-blob blob-c"
                  animate={{ x: [0, 16, -14, 0], y: [0, -12, 10, 0], scale: [1, 1.06, 0.96, 1] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                />
                <span className="fullscreen-audio-wash" />
                <span className="fullscreen-audio-orb orb-a" />
                <span className="fullscreen-audio-orb orb-b" />
                <span className="fullscreen-audio-orb orb-c" />
                <span className="fullscreen-audio-grid" />
                <span className="fullscreen-audio-grain" />
              </div>
            ) : null}
            <button className="fullscreen-track-close" type="button" onClick={closeFullscreenTrack} aria-label={t('close', 'Kapat')}>
              <Minimize2 size={16} />
            </button>
            <AnimatePresence mode="wait">
              <MotionDiv
                key={currentTrack.id}
                className={`fullscreen-track-scene ${lyricsOpen ? 'with-lyrics' : ''}`.trim()}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 1.012 }}
                transition={{ duration: 0.34, ease: 'easeOut' }}
              >
                <div className="fullscreen-track-primary">
                  <div className="fullscreen-track-cover">
                    {getTrackCoverUrl(currentTrack) ? (
                      <img src={getTrackCoverUrl(currentTrack)} alt={t('coverPreview', 'Kapak önizleme')} />
                    ) : (
                      <div className="fullscreen-track-fallback" style={{ background: currentTrack.gradient || currentThemeColor }} />
                    )}
                  </div>
                  <div className="fullscreen-track-copy">
                    <h2 className={fullscreenTitle.className} style={fullscreenTitle.style}>{fullscreenTitle.text || tt('Bir parça seç', 'Choose a track')}</h2>
                    <p>{currentTrack.artist}</p>
                    {effectiveFullscreenEffectsEnabled ? (
                      <div className="fullscreen-audio-visualizer" aria-hidden>
                        {Array.from({ length: 12 }).map((_, index) => (
                          <span key={`viz-${index}`} style={{ '--bar-index': index }} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                {lyricsOpen ? (
                  <div className="fullscreen-inline-lyrics">
                    <div className="fullscreen-inline-lyrics-body">
                      {lyricsLoading ? <p>{t('lyricsLoading', 'Sözler yükleniyor...')}</p> : null}
                      {!lyricsLoading && lyricsText
                        ? renderLyricsContent('fullscreen-lyrics-text', { interactive: parsedLyrics.hasTiming, visibleWindow: 10 })
                        : null}
                      {!lyricsLoading && !lyricsText ? (
                        <div className="player-lyrics-empty">
                          <p>{lyricsError || t('lyricsNotFound', 'Sözler bulunamadı.')}</p>
                          <div className="editor-actions">
                            <button className="mini-button ghost" onClick={() => lyricsFileInputRef.current?.click()}>
                              <Upload size={14} />
                              {t('uploadTxt', 'TXT yükle')}
                            </button>
                            <button className="mini-button ghost" onClick={handleRetryLyricsSearch}>
                              {t('retrySearch', 'Tekrar ara')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </MotionDiv>
            </AnimatePresence>

            {fullscreenQueueOpen ? (
            <div className="fullscreen-queue-panel">
              <div className="queue-panel-head">
                <div>
                  <p className="eyebrow">{t('upNext', 'Sıradaki')}</p>
                  <strong>{t('queueTitle', 'Çalma listesi')}</strong>
                </div>
              </div>

              <div className="queue-now-playing">
                <span className="queue-label">{t('nowPlaying', 'Şu anda çalan')}</span>
                <div className="queue-item">
                  <span className="queue-item-cover">
                    {getTrackDisplayUrl(currentTrack, 'thumb') ? (
                      <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt="" className="playlist-menu-cover-image" />
                    ) : (
                      <span className="playlist-menu-cover-fallback" style={{ background: currentTrack.gradient || currentThemeColor }}>
                        <ListMusic size={12} />
                      </span>
                    )}
                  </span>
                  <span className="queue-item-copy">
                    <strong>{currentTrack.title}</strong>
                    <small>{currentTrack.artist}</small>
                  </span>
                </div>
              </div>

              <div className="queue-list fullscreen-queue-list">
                {upcomingPlaybackTracks.length ? (
                  upcomingPlaybackTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`queue-item queue-item-reorderable ${queueDraggedTrackId === track.id ? 'dragging' : ''} ${queueDragOverTrackId === track.id ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setQueueDraggedTrackId(track.id)
                        setQueueDragOverTrackId(track.id)
                        event.dataTransfer.setData('text/plain', track.id)
                        event.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnter={() => {
                        if (!queueDraggedTrackId || queueDraggedTrackId === track.id) {
                          return
                        }
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDragOver={(event) => {
                        if (!queueDraggedTrackId || queueDraggedTrackId === track.id) {
                          return
                        }
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const droppedId = event.dataTransfer.getData('text/plain')
                        reorderUpcomingQueueByDrag(droppedId, track.id)
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                      onDragEnd={() => {
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                    >
                      <span className="queue-item-drag-handle">
                        <GripVertical size={12} />
                      </span>
                      <span className="queue-item-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="queue-item-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="queue-empty">{t('noNextTrack', 'Sıradaki parça yok.')}</p>
                )}
              </div>
            </div>
            ) : null}

            <div className={`fullscreen-track-controls ${fullscreenControlsVisible ? 'visible' : ''}`}>
              <div className="fullscreen-track-controls-bar">
                <div className="fullscreen-track-controls-row">
                  <div className="fullscreen-track-controls-left-spacer" aria-hidden />
                  <div className="fullscreen-track-main-controls">
                    <button className={`icon-button shuffle-toggle ${shuffleEnabled ? 'active' : ''}`} onClick={toggleShuffleMode} aria-label={t('shufflePlay', 'Karışık çal')} title={shuffleEnabled ? tt('Karışık çalma açık (kapat)', 'Shuffle is on (turn off)') : tt('Karışık çalmayı aç', 'Turn shuffle on')}>
                      <Shuffle size={18} />
                    </button>
                    <button className="icon-button" onClick={restartTrack} aria-label={t('restart', 'Başa al')} title={t('restartTrack', 'Şarkıyı başa sar')}>
                      <Rewind size={18} />
                    </button>
                    <button className="play-button" onClick={togglePlayback} aria-label={isPlaying && currentTrack ? t('pause', 'Duraklat') : t('play', 'Oynat')} title={isPlaying && currentTrack ? t('pausePlayback', 'Çalmayı duraklat') : t('playTrack', 'Şarkıyı oynat')}>
                      {isPlaying && currentTrack ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="icon-button" onClick={stepTrack} aria-label={t('next', 'Sonraki')} title={t('nextTrack', 'Sonraki şarkıya geç')}>
                      <Forward size={18} />
                    </button>
                    <button className={`icon-button repeat-toggle ${repeatEnabled ? 'active' : ''}`} onClick={toggleRepeatMode} aria-label={tt('Tekrarla', 'Repeat')} title={repeatEnabled ? tt('Tekrarlama açık (kapat)', 'Repeat is on (turn off)') : tt('Şarkıyı tekrarlamayı aç', 'Turn repeat on')}>
                      <Repeat size={18} />
                    </button>
                  </div>
                  <div className="fullscreen-track-side-actions">
                    <button
                      type="button"
                      className={`icon-button ${dockPlaylistMenuOpen ? 'active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleDockPlaylistMenu(event.currentTarget)
                      }}
                      aria-label={t('addToPlaylist', 'Playliste ekle')}
                      title={t('addToPlaylist', 'Playliste ekle')}
                    >
                      <ListMusic size={18} />
                    </button>
                    <button
                      type="button"
                      className={`icon-button ${lyricsOpen ? 'active' : ''}`}
                      onClick={() => setLyricsOpen((prev) => !prev)}
                      aria-label={t('toggleLyrics', 'Şarkı sözlerini aç/kapat')}
                      title={t('lyrics', 'Şarkı sözleri')}
                    >
                      <Mic2 size={18} />
                    </button>
                    <button
                      type="button"
                      className={`icon-button ${fullscreenQueueOpen ? 'active' : ''}`}
                      onClick={() => setFullscreenQueueOpen((prev) => !prev)}
                      aria-label={t('toggleQueue', 'Sıradaki listeyi aç/kapat')}
                      title={t('queue', 'Sıradaki liste')}
                    >
                      <ListOrdered size={18} />
                    </button>
                    <div className="fullscreen-track-volume-control">
                      <Volume2 size={16} />
                      <input
                        className="range range-compact"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        aria-label={tt('Ses seviyesi', 'Volume')}
                      />
                    </div>
                  </div>
                </div>
                <div className="fullscreen-track-progress">
                  <span className="time-badge time-badge--start">{formatTime(progress)}</span>
                  <input
                    className="range range-progress"
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={Math.min(progress, duration || 0)}
                    onChange={handleSeek}
                    disabled={!currentTrack}
                  />
                  <span className="time-badge time-badge--end">{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      <AnimatePresence>
        {bulkEditOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBulkEditor}
          >
            <MotionDiv
              className="modal-card glass bulk-edit-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{tt('Toplu düzenleme', 'Bulk editing')}</p>
                  <h3>
                    <Edit3 size={18} />
                    {t('bulkEditTitle', 'Şarkıları toplu düzenle')}
                  </h3>
                  <span className="panel-subtitle">
                    {t('bulkEditHint', 'İsim, sanatçı ve albüm bilgisini düzenle. Kapağa tıklayıp değiştir veya sil.')}
                  </span>
                </div>
                <div className="editor-actions">
                  <button
                    className="mini-button"
                    onClick={undoBulkEdits}
                    disabled={bulkEditSaving || !bulkEditInitialDrafts.length}
                  >
                    <RotateCcw size={14} />
                    {tt('Geri al', 'Undo')}
                  </button>
                  <button className="mini-button ghost" onClick={closeBulkEditor} disabled={bulkEditSaving}>
                    <X size={14} />
                    Kapat
                  </button>
                  <button
                    className="mini-button primary"
                    onClick={() => saveBulkTrackChanges().catch(() => {})}
                    disabled={bulkEditSaving || (!bulkEditDrafts.length && !bulkEditInitialDrafts.length)}
                  >
                    <Save size={14} />
                    {bulkEditSaving ? t('saving', 'Kaydediliyor...') : t('saveAll', 'Tümünü kaydet')}
                  </button>
                </div>
              </div>

              <input
                ref={bulkCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={handleBulkCoverSelect}
              />

              <div className="bulk-edit-list">
                {bulkEditDrafts.map((draft) => {
                  const sourceTrack = trackByIdMap.get(draft.id)
                  if (!sourceTrack) {
                    return null
                  }

                  const previewCover = draft.coverPreviewUrl || getTrackDisplayUrl(sourceTrack, 'thumb')
                  const isCoverMenuOpen = bulkCoverMenuTrackId === draft.id

                  return (
                    <div key={`bulk-edit-${draft.id}`} className="bulk-edit-row">
                      <div className="bulk-edit-cover-wrap">
                        <button
                          type="button"
                          className="bulk-edit-cover bulk-edit-cover-button"
                          onClick={() => setBulkCoverMenuTrackId((prev) => (prev === draft.id ? null : draft.id))}
                          aria-label={t('coverOptions', 'Kapak seçenekleri')}
                          title={t('coverOptions', 'Kapak seçenekleri')}
                        >
                          {previewCover ? (
                            <img
                              src={previewCover}
                              alt={`${draft.title || sourceTrack.title} ${t('coverAlt', 'kapak')}`}
                              className="track-thumb-image"
                            />
                          ) : (
                            <div className="track-thumb-fallback" style={{ background: sourceTrack.gradient }} />
                          )}
                        </button>
                        {isCoverMenuOpen ? (
                          <div className="bulk-cover-menu">
                            <button type="button" className="menu-item" onClick={() => openBulkCoverPicker(draft.id)}>
                              <ImageIcon size={14} />
                              {t('changeCover', 'Kapağı değiştir')}
                            </button>
                            <button type="button" className="menu-item danger" onClick={() => removeBulkCover(draft.id)}>
                              <Trash2 size={14} />
                              {t('removeCover', 'Kapağı sil')}
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <label className="field">
                        <span>{t('trackTitle', 'Şarkı adı')}</span>
                        <input
                          type="text"
                          value={draft.title}
                          onChange={(event) => handleBulkEditChange(draft.id, 'title', event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>{t('artist', 'Sanatçı')}</span>
                        <input
                          type="text"
                          value={draft.artist}
                          onChange={(event) => handleBulkEditChange(draft.id, 'artist', event.target.value)}
                        />
                      </label>

                      <label className="field">
                        <span>{t('album', 'Albüm')}</span>
                        <input
                          type="text"
                          value={draft.album}
                          onChange={(event) => handleBulkEditChange(draft.id, 'album', event.target.value)}
                          placeholder="Single"
                        />
                      </label>
                      <button
                        type="button"
                        className="mini-button danger bulk-row-delete"
                        onClick={() => removeBulkDraft(draft.id)}
                        disabled={bulkEditSaving}
                        title={t('deleteInBulk', 'Bu şarkıyı toplu kayıtta sil')}
                      >
                        <Trash2 size={14} />
                        {t('deleteAction', 'Sil')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {editDraft && editingTrack ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditor}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                <p className="eyebrow">{t('editing', 'Düzenleme')}</p>
                  <h3>
                    <ImageIcon size={18} />
                  {t('trackInfo', 'Parça bilgisi')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closeEditor}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                  <button className="mini-button" onClick={openCoverPicker} disabled={!editingTrack}>
                    <ImageIcon size={14} />
                    {t('coverAlt', 'Kapak')}
                  </button>
                  <button className="mini-button primary" onClick={handleSaveTrackChanges} disabled={!editDraft}>
                    <Save size={14} />
                    {t('save', 'Kaydet')}
                  </button>
                </div>
              </div>

              <div className="editor-grid">
                <div className="editor-cover-wrap">
                  <button
                    type="button"
                    className="editor-cover editor-cover-button"
                    onClick={() => setCoverMenuOpen((prev) => !prev)}
                  >
                    {getTrackCoverUrl(editingTrack, pendingCover) ? (
                      <img
                        src={getTrackCoverUrl(editingTrack, pendingCover)}
                        alt={t('coverPreview', 'Kapak önizleme')}
                        className="editor-cover-image"
                        draggable={false}
                      />
                    ) : (
                      <div className="editor-cover-fallback" style={{ background: editingTrack.gradient }}>
                        <ImageIcon size={26} />
                      </div>
                    )}
                  </button>
                  {coverMenuOpen ? (
                    <div className="editor-cover-menu">
                      <button type="button" className="menu-item" onClick={openCoverPicker}>
                        <ImageIcon size={14} />
                        {t('changeCover', 'Kapağı değiştir')}
                      </button>
                      <button type="button" className="menu-item danger" onClick={requestCoverRemoval}>
                        <Trash2 size={14} />
                        {t('removeCover', 'Kapağı sil')}
                      </button>
                    </div>
                  ) : null}
                </div>

                <label className="field">
                  <span>{t('trackTitle', 'Parça adı')}</span>
                  <input
                    type="text"
                    value={editDraft.title}
                    onChange={(event) => handleEditChange('title', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>
                    <UserRound size={14} />
                  {t('artist', 'Sanatçı')}
                  </span>
                  <input
                    type="text"
                    value={editDraft.artist}
                    onChange={(event) => handleEditChange('artist', event.target.value)}
                  />
                </label>

                <label className="field">
                  <span>{t('album', 'Albüm')}</span>
                  <input
                    type="text"
                    value={editDraft.album || 'Single'}
                    onChange={(event) => handleEditChange('album', event.target.value)}
                    placeholder={t('albumPlaceholder', 'Albüm adı (yoksa Single)')}
                  />
                </label>

                <div className="cover-meta">
                  <span>{t('coverFile', 'Kapak dosyası')}</span>
                  <strong>
                    {coverRemovalRequested
                      ? t('willRemove', 'Kaldırılacak')
                      : pendingCover?.coverName || editingTrack.coverName || t('notSelected', 'Seçilmedi')}
                  </strong>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {creatingPlaylist ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistCreator}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                ref={playlistCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={(event) => handlePlaylistCoverSelect(event, 'create')}
              />
              <input
                ref={playlistTxtInputRef}
                className="hidden-input"
                type="file"
                accept=".txt,text/plain"
                onChange={importPlaylistFromTxt}
              />
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist</p>
                  <h3>
                    <ListMusic size={18} />
                    {tt('Yeni playlist', 'New playlist')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistCreator}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                  <button className="mini-button primary" onClick={createPlaylistFromDraft} disabled={!playlistNameDraft.trim() || playlistTxtImporting}>
                    <Plus size={14} />
                  {t('create', 'Oluştur')}
                  </button>
                </div>
              </div>

              <div className="playlist-create-row">
                <div className="playlist-editor-cover">
                  {playlistCoverDraft ? (
                    <img src={playlistCoverDraft} alt={tt('Playlist kapak resmi önizleme', 'Playlist cover preview')} className="editor-cover-image" />
                  ) : (
                    <div className="editor-cover-fallback" style={{ background: playlistColorDraft }}>
                      <ListMusic size={26} />
                    </div>
                  )}
                </div>
                <div className="playlist-fields-stack">
                  <label className="field">
                    <span>{t('playlistName', 'Playlist adı')}</span>
                    <input
                      type="text"
                      value={playlistNameDraft}
                      onChange={(event) => setPlaylistNameDraft(event.target.value)}
                      placeholder={t('playlistNamePlaceholder', 'Örneğin: Gece listesi')}
                    />
                  </label>
                  <label className="field">
                    <span>{t('description', 'Açıklama')}</span>
                    <input
                      type="text"
                      value={playlistDescriptionDraft}
                      onChange={(event) => setPlaylistDescriptionDraft(event.target.value)}
                      placeholder={t('playlistDescriptionPlaceholder', 'Playlist açıklaması')}
                    />
                  </label>
                </div>
              </div>

              <div className="playlist-cover-controls">
                <div className="cover-meta">
                  <span>{t('coverImage', 'Kapak görseli')}</span>
                  <strong>{playlistCoverDraft ? t('selected', 'Seçildi') : t('notSelected', 'Seçilmedi')}</strong>
                </div>

                <button className="mini-button" onClick={() => playlistCoverInputRef.current?.click()}>
                  <ImageIcon size={14} />
                  {t('addCover', 'Kapak ekle')}
                </button>
              </div>

              <div className="playlist-cover-controls">
                <div className="cover-meta">
                  <span>{tt('TXT ile playlist aktar', 'Import playlist from TXT')}</span>
                  <strong>
                    {playlistTxtFileName
                      ? `${playlistTxtFileName}${playlistTxtEntriesDraft.length ? ` • ${tt(`${playlistTxtEntriesDraft.length} satır hazır`, `${playlistTxtEntriesDraft.length} rows ready`)}` : ''}${playlistTxtImportedTrackIds.length ? ` • ${tf('trackCount', { count: playlistTxtImportedTrackIds.length }, `${playlistTxtImportedTrackIds.length} parça`)} ${tt('eklendi', 'added')}` : ''}`
                      : t('notSelected', 'Seçilmedi')}
                  </strong>
                </div>

                <button
                  className="mini-button"
                  onClick={() => playlistTxtInputRef.current?.click()}
                  disabled={playlistTxtImporting}
                >
                  <FileUp size={14} />
                  {playlistTxtImporting ? t('importing', 'Aktarılıyor...') : t('txtSelectImport', 'TXT seç ve aktar')}
                </button>
              </div>

              <div className="color-picker">
                <span>{tt('Renk', 'Color')}</span>
                <div className="color-swatch-row">
                  {playlistColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch ${playlistColorDraft === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setPlaylistColorDraft(color)}
                      aria-label={`${tt('Renk', 'Color')} ${color}`}
                    />
                  ))}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {playlistTxtReviewOpen ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlaylistTxtReviewOpen(false)}
          >
            <MotionDiv
              className="modal-card glass playlist-txt-review-modal"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{t('txtImportReview', 'TXT Aktarım Kontrolü')}</p>
                  <h3>
                    <ListMusic size={18} />
                    {t('addedSongs', 'Eklenen şarkılar')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={() => setPlaylistTxtReviewOpen(false)}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                </div>
              </div>
              <div className="playlist-txt-review-list">
                {playlistTxtReviewItems.length ? playlistTxtReviewItems.map((item) => {
                  const linkedTrack = tracks.find((track) => track.id === item.trackId)
                  const cover = linkedTrack ? getTrackDisplayUrl(linkedTrack, 'thumb') : ''
                  const isPreviewing = playlistTxtPreviewingTrackId === item.trackId
                  return (
                    <div className="playlist-txt-review-item" key={item.id}>
                      <span className="playlist-txt-review-cover">
                        {cover ? <img src={cover} alt="" /> : <span>{(item.trackTitle || '?').slice(0, 1).toUpperCase()}</span>}
                      </span>
                      <span className="playlist-txt-review-copy">
                        <strong>{item.trackTitle}</strong>
                        <small>{item.trackArtist}</small>
                      </span>
                      <button
                        type="button"
                        className={`mini-button ghost ${isPreviewing ? 'active' : ''}`}
                        onClick={() => previewPlaylistTxtTrack(item.trackId)}
                      >
                        <Play size={14} />
                        {tt('5 sn dinle', 'Preview 5 sec')}
                      </button>
                      <button
                        type="button"
                        className="mini-button ghost danger"
                        onClick={() => {
                          removeTrackFromPlaylistById(playlistTxtImportPlaylistId, item.trackId)
                          setPlaylistTxtImportedTrackIds((prev) => prev.filter((id) => id !== item.trackId))
                          setPlaylistTxtReviewItems((prev) => prev.filter((row) => row.id !== item.id))
                          if (playlistTxtPreviewingTrackId === item.trackId) {
                            stopPlaylistTxtPreview()
                          }
                        }}
                        title={t('removeFromPlaylist', 'Bu şarkıyı playlistten çıkar')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                }) : (
                  <p className="menu-empty">{t('emptyImportReview', 'Henüz eklenen şarkı yok. Aktarım başlayınca burada canlı görünür.')}</p>
                )}
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}

        {editingPlaylistId ? (
          <MotionDiv
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylistEditor}
          >
            <MotionDiv
              className="modal-card glass"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                ref={playlistEditCoverInputRef}
                className="hidden-input"
                type="file"
                accept="image/*"
                onChange={(event) => handlePlaylistCoverSelect(event, 'edit')}
              />
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Playlist</p>
                  <h3>
                    <ListMusic size={18} />
                {t('editPlaylistTitle', 'Playlist düzenle')}
                  </h3>
                </div>
                <div className="editor-actions">
                  <button className="mini-button ghost" onClick={closePlaylistEditor}>
                    <X size={14} />
                    {t('close', 'Kapat')}
                  </button>
                  <button
                    className="mini-button primary"
                    onClick={savePlaylistChanges}
                    disabled={!playlistEditDraft.trim()}
                  >
                    <Save size={14} />
                    {t('save', 'Kaydet')}
                  </button>
                </div>
              </div>

              <div className="playlist-create-row">
                <div className="playlist-editor-cover">
                  {playlistEditCoverDraft ? (
                    <img
                      src={playlistEditCoverDraft}
                      alt={tt('Playlist kapak resmi önizleme', 'Playlist cover preview')}
                      className="editor-cover-image"
                    />
                  ) : (
                    <div className="editor-cover-fallback" style={{ background: playlistEditColorDraft }}>
                      <ListMusic size={26} />
                    </div>
                  )}
                </div>
                <div className="playlist-fields-stack">
                  <label className="field">
                    <span>{t('playlistName', 'Playlist adı')}</span>
                    <input
                      type="text"
                      value={playlistEditDraft}
                      onChange={(event) => setPlaylistEditDraft(event.target.value)}
                      autoFocus
                    />
                  </label>
                  <label className="field">
                    <span>{t('description', 'Açıklama')}</span>
                    <input
                      type="text"
                      value={playlistEditDescriptionDraft}
                      onChange={(event) => setPlaylistEditDescriptionDraft(event.target.value)}
                      placeholder={t('playlistDescriptionPlaceholder', 'Playlist açıklaması')}
                    />
                  </label>
                </div>
              </div>

              <div className="playlist-cover-controls">
                <div className="cover-meta">
                  <span>{t('coverImage', 'Kapak görseli')}</span>
                  <strong>{playlistEditCoverDraft ? t('selected', 'Seçildi') : t('notSelected', 'Seçilmedi')}</strong>
                </div>

                <button className="mini-button" onClick={() => playlistEditCoverInputRef.current?.click()}>
                  <ImageIcon size={14} />
                  {t('addCover', 'Kapak ekle')}
                </button>
              </div>

              <div className="color-picker">
                <span>{tt('Renk', 'Color')}</span>
                <div className="color-swatch-row">
                  {playlistColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`color-swatch ${playlistEditColorDraft === color ? 'selected' : ''}`}
                      style={{ background: color }}
                      onClick={() => setPlaylistEditColorDraft(color)}
                      aria-label={`${tt('Renk', 'Color')} ${color}`}
                    />
                  ))}
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
        ) : null}
      </AnimatePresence>
      </div>

      {dockPlaylistMenuOpen && playlistMenuTrackId && playlistMenuPosition
        ? createPortal(
            <div
              className={`dock-playlist-menu dock-playlist-menu--portal ${fullscreenTrackOpen ? 'dock-playlist-menu--fullscreen' : ''}`}
              style={playlistMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const activeTrack = allTracks.find((track) => track.id === playlistMenuTrackId)

                return playlists.length === 0 ? (
                  <div className="menu-empty">{t('noPlaylistYet', 'Henüz playlist yok')}</div>
                ) : (
                  playlists.map((playlist) => {
                    const inPlaylist = activeTrack ? playlist.trackIds.includes(activeTrack.id) : false
                    return (
                      <button
                        key={playlist.id}
                        className={`menu-item playlist-menu-entry ${inPlaylist ? 'selected' : ''}`}
                        onClick={() => activeTrack && toggleTrackPlaylist(playlist.id, activeTrack.id)}
                      >
                        <span className="playlist-menu-cover">
                          {playlist.coverUrl ? (
                            <img src={playlist.coverUrl} alt="" className="playlist-menu-cover-image" />
                          ) : (
                            <span
                              className="playlist-menu-cover-fallback"
                              style={{ background: playlist.color || currentThemeColor }}
                            >
                              <ListMusic size={12} />
                            </span>
                          )}
                        </span>
                        <span className="playlist-menu-copy">
                          <strong>{playlist.name}</strong>
                    <small>{tf('songsCount', { count: playlist.trackIds.length }, `${playlist.trackIds.length} şarkı`)}</small>
                        </span>
                        <Check size={14} className={inPlaylist ? 'visible' : 'hidden-check'} />
                      </button>
                    )
                  })
                )
              })()}
            </div>,
            document.body,
          )
        : null}

      {lyricsOpen && !fullscreenTrackOpen
        ? createPortal(
            <div
              className={`lyrics-panel ${fullscreenTrackOpen ? 'lyrics-panel--fullscreen' : ''} ${fullscreenTrackOpen && fullscreenQueueOpen ? 'lyrics-panel--with-queue' : ''}`}
              style={{ right: 16 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="lyrics-panel-head">
                <div>
                  <p className="eyebrow">Lyrics</p>
                  <strong>{currentTrack?.title || t('noSong', 'Şarkı yok')}</strong>
                  <span>{currentTrack?.artist || ''}</span>
                </div>
                <button
                  className="dock-icon-button"
                  type="button"
                  onClick={() => setLyricsOpen(false)}
                  aria-label={tt('Lyrics kapat', 'Close lyrics')}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="lyrics-panel-body">
                {lyricsLoading ? <p>{t('lyricsLoading', 'Sözler yükleniyor...')}</p> : null}
                {!lyricsLoading && lyricsText ? renderLyricsContent('', { visibleWindow: 18 }) : null}
                {!lyricsLoading && !lyricsText ? (
                  <div className="player-lyrics-empty">
                    <p>{lyricsError || t('lyricsNotFound', 'Sözler bulunamadı.')}</p>
                    <div className="editor-actions">
                      <button className="mini-button ghost" onClick={() => lyricsFileInputRef.current?.click()}>
                        <Upload size={14} />
                        {t('uploadTxt', 'TXT yükle')}
                      </button>
                      <button className="mini-button ghost" onClick={handleRetryLyricsSearch}>
                        {t('retrySearch', 'Tekrar ara')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}

      {queueOpen
        ? createPortal(
            <div
              className="queue-panel"
              style={{
                right: sidebarPlayerActive
                  ? (lyricsOpen
                    ? 'calc(var(--right-player-width) + 452px)'
                    : 'calc(var(--right-player-width) + 16px)')
                  : (lyricsOpen ? 452 : 16),
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="queue-panel-head">
                <div>
                  <p className="eyebrow">{t('upNext', 'Sıradaki')}</p>
                  <strong>{t('queueTitle', 'Çalma listesi')}</strong>
                </div>
                <button
                  className="dock-icon-button"
                  type="button"
                  onClick={() => setQueueOpen(false)}
                  aria-label={t('closeQueuePanel', 'Sıradaki paneli kapat')}
                >
                  <X size={14} />
                </button>
              </div>

              {currentTrack ? (
                <div className="queue-now-playing">
                  <span className="queue-label">{t('nowPlaying', 'Şu anda çalan')}</span>
                  <div className="queue-item">
                    <span className="queue-item-cover">
                      {getTrackDisplayUrl(currentTrack, 'thumb') ? (
                        <img src={getTrackDisplayUrl(currentTrack, 'thumb')} alt="" className="playlist-menu-cover-image" />
                      ) : (
                        <span className="playlist-menu-cover-fallback" style={{ background: currentTrack.gradient || currentThemeColor }}>
                          <ListMusic size={12} />
                        </span>
                      )}
                    </span>
                    <span className="queue-item-copy">
                      <strong>{currentTrack.title}</strong>
                      <small>{currentTrack.artist}</small>
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="queue-list">
                {upcomingPlaybackTracks.length ? (
                  upcomingPlaybackTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className={`queue-item queue-item-reorderable ${queueDraggedTrackId === track.id ? 'dragging' : ''} ${queueDragOverTrackId === track.id && queueDraggedTrackId !== track.id ? 'drag-over' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setQueueDraggedTrackId(track.id)
                        setQueueDragOverTrackId(track.id)
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', track.id)
                      }}
                      onDragEnter={() => {
                        if (!queueDraggedTrackId) {
                          return
                        }
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDragOver={(event) => {
                        if (!queueDraggedTrackId) {
                          return
                        }
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'move'
                        setQueueDragOverTrackId(track.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        const droppedId = event.dataTransfer.getData('text/plain') || queueDraggedTrackId
                        reorderUpcomingQueueByDrag(droppedId, track.id)
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                      onDragEnd={() => {
                        setQueueDraggedTrackId(null)
                        setQueueDragOverTrackId(null)
                      }}
                    >
                      <span className="queue-item-drag-handle" title={t('dragQueue', 'Sırayı değiştirmek için sürükle')}>
                        <GripVertical size={14} />
                      </span>
                      <span className="queue-item-cover">
                        {getTrackDisplayUrl(track, 'thumb') ? (
                          <img src={getTrackDisplayUrl(track, 'thumb')} alt="" className="playlist-menu-cover-image" />
                        ) : (
                          <span className="playlist-menu-cover-fallback" style={{ background: track.gradient || currentThemeColor }}>
                            <ListMusic size={12} />
                          </span>
                        )}
                      </span>
                      <span className="queue-item-copy">
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="queue-empty">{t('noMoreQueue', 'Sırada başka şarkı yok.')}</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {trackMenuId && trackMenuPosition
        ? createPortal(
            <div
              className="track-menu track-menu--portal"
              style={trackMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const track = allTracks.find((item) => item.id === trackMenuId)
                if (!track) {
                  return null
                }

                return (
                  <>
                    {track.source !== 'drive' && track.source !== 'shared' ? (
                      <button
                        className="menu-item"
                        onClick={() => {
                          openEditor(track)
                          setTrackMenuId(null)
                          setTrackMenuPosition(null)
                        }}
                      >
                        <ImageIcon size={14} />
                      {t('edit', 'Düzenle')}
                      </button>
                    ) : null}
                    <button className="menu-item" onClick={() => toggleFavorite(track.id)}>
                      <Heart size={14} className={track.isFavorite ? 'active-heart' : ''} />
                      {track.isFavorite ? t('removeFavorite', 'Favoriden çıkar') : t('favorite', 'Favorile')}
                    </button>
                    <button className="menu-item" onClick={() => togglePinned(track.id)}>
                      <Pin size={14} />
                      {track.isPinned ? t('unpin', 'Sabitlemeyi kaldır') : t('pin', 'Sabitle')}
                    </button>
                    <button className="menu-item" onClick={() => searchYouTube(track)}>
                      <Youtube size={14} />
                      {t('youtubeSearch', "YouTube'da ara")}
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        copyTrackShareLink(track)
                        setTrackMenuId(null)
                        setTrackMenuPosition(null)
                      }}
                    >
                      <Link2 size={14} />
                      {t('copyShareLink', 'Paylaşım linkini kopyala')}
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        queueTrackAsNext(track.id)
                        setTrackMenuId(null)
                        setTrackMenuPosition(null)
                      }}
                    >
                      <Forward size={14} />
                      {t('setAsNext', 'Bir sonraki olarak ayarla')}
                    </button>
                    <button className="menu-item" onClick={(event) => openTrackPlaylistMenu(track.id, event.currentTarget)}>
                      <ListMusic size={14} />
                      {t('addToPlaylist', 'Playliste ekle')}
                    </button>
                    {track.source === 'drive' || track.source === 'shared' || track.source === 'pool' ? (
                      <button
                        className="menu-item"
                        onClick={() => {
                          downloadPoolTrackToLibrary(track)
                          setTrackMenuId(null)
                          setTrackMenuPosition(null)
                        }}
                      >
                        <Download size={14} />
                        {t('downloadAndAddToLibrary', 'İndir ve kütüphaneye ekle')}
                      </button>
                    ) : null}
                    {track.source !== 'drive' && track.source !== 'shared' ? (
                      <button className="menu-item danger" onClick={() => requestDeleteTrack(track.id)}>
                        <Trash2 size={14} />
                        {t('deleteAction', 'Sil')}
                      </button>
                    ) : null}
                  </>
                )
              })()}
            </div>,
            document.body,
          )
        : null}

      {playlistContextMenuId && playlistContextMenuPosition
        ? createPortal(
            <div
              className="track-menu track-menu--portal playlist-context-menu"
              style={playlistContextMenuPosition}
              onClick={(event) => event.stopPropagation()}
            >
              {(() => {
                const playlist = playlists.find((item) => item.id === playlistContextMenuId)
                if (!playlist) {
                  return null
                }
                return (
                  <>
                    <button
                      className="menu-item"
                      onClick={() => {
                        openPlaylistEditor(playlist)
                        setPlaylistContextMenuId(null)
                        setPlaylistContextMenuPosition(null)
                      }}
                    >
                      <Edit3 size={14} />
                      {t('edit', 'Düzenle')}
                    </button>
                    <button
                      className="menu-item danger"
                      onClick={() => {
                        requestDeletePlaylist(playlist.id)
                        setPlaylistContextMenuId(null)
                        setPlaylistContextMenuPosition(null)
                      }}
                    >
                      <Trash2 size={14} />
                      {t('deleteAction', 'Sil')}
                    </button>
                  </>
                )
              })()}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default App





























