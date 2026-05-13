#!/usr/bin/env python3
import json
import sys
import unicodedata

# Ensure UTF-8 encoding for stdout
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from ytmusicapi import YTMusic
except Exception as exc:
    try:
        error_msg = str(exc)[:200]
        print(json.dumps({"ok": False, "error": f"ytmusicapi import failed: {error_msg}"}))
    except Exception:
        print(json.dumps({"ok": False, "error": "ytmusicapi import failed"}))
    sys.exit(0)


def safe_text(value):
    return str(value or "").strip()


def norm(value):
    base = safe_text(value).lower()
    base = (
        base.replace("ı", "i")
        .replace("İ", "i")
        .replace("ş", "s")
        .replace("ğ", "g")
        .replace("ç", "c")
        .replace("ö", "o")
        .replace("ü", "u")
    )
    base = unicodedata.normalize("NFKD", base)
    return "".join(ch for ch in base if not unicodedata.combining(ch))


def artist_match(left, right):
    l = norm(left)
    r = norm(right)
    if not l or not r:
        return False
    return l == r or l in r or r in l


def tokenize(value):
    return [part for part in norm(value).replace("-", " ").split() if part]


def artist_match_relaxed(left, right):
    if artist_match(left, right):
        return True
    l_tokens = tokenize(left)
    r_tokens = tokenize(right)
    if not l_tokens or not r_tokens:
        return False
    shared = set(l_tokens) & set(r_tokens)
    return len(shared) >= 1


def is_single_ep(title=""):
    t = norm(title)
    return (" single" in f" {t} ") or (" ep" in f" {t} ")


def list_artist_names(row):
    names = []
    for artist in (row.get("artists") or []):
        name = safe_text((artist or {}).get("name"))
        if name:
            names.append(name)
    alt = safe_text(row.get("artist") or row.get("author"))
    if alt:
        names.append(alt)
    subtitle = safe_text(row.get("subtitle"))
    if subtitle:
        # e.g. "Radiohead • Album • 2003"
        for part in subtitle.split("•"):
            part_text = safe_text(part)
            if part_text:
                names.append(part_text)
    seen = set()
    unique = []
    for item in names:
        key = norm(item)
        if key and key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


def row_belongs_to_artist(row, artist_name):
    artists = list_artist_names(row)
    if not artists:
        return False
    return any(artist_match_relaxed(item, artist_name) for item in artists)


def classify_release(row, title=""):
    row_type = norm(row.get("type"))
    if "single" in row_type or "ep" in row_type:
        return "single"
    if "album" in row_type:
        return "album"
    return "single" if is_single_ep(title) else "album"


def format_lrc_timestamp(ms_value):
    try:
        total_ms = max(0, int(ms_value or 0))
    except Exception:
        total_ms = 0
    total_seconds = total_ms // 1000
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    centiseconds = (total_ms % 1000) // 10
    return f"{minutes:02d}:{seconds:02d}.{centiseconds:02d}"


def serialize_lyrics_payload(raw_lyrics):
    if not isinstance(raw_lyrics, dict):
        return ""
    lyrics = raw_lyrics.get("lyrics")
    if isinstance(lyrics, str):
        return lyrics.strip()
    if isinstance(lyrics, list):
        lines = []
        for item in lyrics:
            text = safe_text(getattr(item, "text", "") or (item.get("text") if isinstance(item, dict) else ""))
            if not text:
                continue
            start = getattr(item, "start_time", None)
            if start is None and isinstance(item, dict):
                start = item.get("start_time")
            if start is None:
                lines.append(text)
            else:
                lines.append(f"[{format_lrc_timestamp(start)}]{text}")
        return "\n".join(lines).strip()
    return ""


def best_artist_hit(artist_hits, artist_name):
    target = norm(artist_name)
    best = None
    best_score = -1
    for hit in artist_hits or []:
        name = safe_text(hit.get("artist") or hit.get("title"))
        n = norm(name)
        if not n:
            continue
        score = 0
        if n == target:
            score += 100
        elif n.startswith(target) or target.startswith(n):
            score += 70
        elif target in n or n in target:
            score += 48
        if " - topic" in n:
            score -= 12
        if len(n) > 0:
            score -= abs(len(n) - len(target)) * 0.15
        if score > best_score:
            best = hit
            best_score = score
    return best or (artist_hits[0] if artist_hits else {})


def main():
    raw = sys.stdin.read() or "{}"
    try:
        payload = json.loads(raw)
    except Exception as e:
        print(json.dumps({"ok": False, "error": f"invalid-json: {str(e)[:100]}"}))
        return

    action = safe_text(payload.get("action"))
    query = safe_text(payload.get("query"))
    limit = int(payload.get("limit") or 12)
    search_filter = safe_text(payload.get("filter") or "all").lower()
    artist_name = safe_text(payload.get("artistName"))
    album_id = safe_text(payload.get("albumId"))
    playlist_id = safe_text(payload.get("playlistId"))
    seed_artists = [safe_text(item) for item in (payload.get("artists") or []) if safe_text(item)]
    owned_signatures = set(
        norm(safe_text(item))
        for item in (payload.get("ownedSignatures") or [])
        if safe_text(item)
    )

    try:
        ytm = YTMusic()
    except Exception as exc:
        try:
            error_msg = str(exc)[:200]
            print(json.dumps({"ok": False, "error": f"ytmusic init failed: {error_msg}"}))
        except Exception:
            print(json.dumps({"ok": False, "error": "ytmusic init failed"}))
        sys.stdout.flush()
        return

    try:
        if action == "search":
            if not query:
                print(json.dumps({"ok": True, "items": []}))
                return
            search_limit = max(1, min(limit, 24))
            rows = []
            album_rows = []
            artist_rows = []
            podcast_rows = []

            try:
                if search_filter in ("all", "songs", "music"):
                    search_result = ytm.search(query, filter="songs", limit=search_limit)
                    rows = search_result if isinstance(search_result, list) else []
            except Exception:
                rows = []
            
            try:
                if search_filter in ("all", "albums"):
                    search_result = ytm.search(query, filter="albums", limit=max(1, min(max(4, search_limit // 2), 14)))
                    album_rows = search_result if isinstance(search_result, list) else []
            except Exception:
                album_rows = []
            
            try:
                if search_filter in ("all", "artists"):
                    search_result = ytm.search(query, filter="artists", limit=max(1, min(max(3, search_limit // 3), 10)))
                    artist_rows = search_result if isinstance(search_result, list) else []
            except Exception:
                artist_rows = []
            
            try:
                playlist_rows = []
                if search_filter in ("all", "playlists"):
                    search_result = ytm.search(query, filter="playlists", limit=max(1, min(max(4, search_limit // 2), 16)))
                    playlist_rows = search_result if isinstance(search_result, list) else []
            except Exception:
                playlist_rows = []
            
            try:
                if search_filter in ("podcasts",):
                    podcast_seed_rows = ytm.search(query, limit=search_limit)
                    podcast_seed_rows = podcast_seed_rows if isinstance(podcast_seed_rows, list) else []
                    podcast_rows = [
                        row for row in podcast_seed_rows
                        if "podcast" in norm(row.get("category") or row.get("resultType") or row.get("title"))
                    ]
            except Exception:
                podcast_rows = []
            items = []
            for row in rows:
                video_id = safe_text(row.get("videoId"))
                title = safe_text(row.get("title"))
                artists = row.get("artists") or []
                artist = safe_text(artists[0].get("name")) if artists else ""
                thumbnails = row.get("thumbnails") or []
                thumb = safe_text(thumbnails[-1].get("url")) if thumbnails else ""
                album = row.get("album") or {}
                album_name = safe_text(album.get("name"))
                duration = row.get("duration_seconds") or 0
                items.append(
                    {
                        "type": "song",
                        "id": video_id or f"{title}-{artist}",
                        "title": title,
                        "artist": artist,
                        "duration": int(duration or 0),
                        "url": f"https://music.youtube.com/watch?v={video_id}" if video_id else "",
                        "thumbnail": thumb,
                        "album": album_name,
                        "source": "ytmusicapi",
                    }
                )
            for row in album_rows:
                browse_id = safe_text(row.get("browseId"))
                title = safe_text(row.get("title"))
                artists = row.get("artists") or []
                artist = safe_text(artists[0].get("name")) if artists else ""
                thumbnails = row.get("thumbnails") or []
                thumb = safe_text(thumbnails[-1].get("url")) if thumbnails else ""
                if not browse_id or not title:
                    continue
                items.append(
                    {
                        "type": "album",
                        "id": browse_id,
                        "albumId": browse_id,
                        "title": title,
                        "artist": artist,
                        "duration": 0,
                        "url": "",
                        "thumbnail": thumb,
                        "album": title,
                        "source": "ytmusicapi",
                    }
                )
            for row in playlist_rows:
                browse_id = safe_text(row.get("browseId"))
                title = safe_text(row.get("title"))
                if not browse_id or not title:
                    continue
                thumbs = row.get("thumbnails") or []
                thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                author = safe_text(row.get("author") or row.get("artist") or row.get("subtitle"))
                items.append(
                    {
                        "type": "playlist",
                        "id": browse_id,
                        "playlistId": browse_id,
                        "title": title,
                        "artist": author or "YouTube Music",
                        "thumbnail": thumb,
                        "source": "ytmusicapi",
                    }
                )
            for row in artist_rows:
                browse_id = safe_text(row.get("browseId"))
                title = safe_text(row.get("artist") or row.get("title"))
                thumbnails = row.get("thumbnails") or []
                thumb = safe_text(thumbnails[-1].get("url")) if thumbnails else ""
                if not title:
                    continue
                items.append(
                    {
                        "type": "artist",
                        "id": browse_id or f"artist-{title}",
                        "artistId": browse_id,
                        "title": title,
                        "artist": title,
                        "duration": 0,
                        "url": "",
                        "thumbnail": thumb,
                        "album": "",
                        "source": "ytmusicapi",
                    }
                )
            for row in podcast_rows:
                browse_id = safe_text(row.get("browseId"))
                title = safe_text(row.get("title"))
                if not title:
                    continue
                author = safe_text(row.get("author") or row.get("artist"))
                thumbnails = row.get("thumbnails") or []
                thumb = safe_text(thumbnails[-1].get("url")) if thumbnails else ""
                items.append(
                    {
                        "type": "podcast",
                        "id": browse_id or f"podcast-{title}",
                        "title": title,
                        "artist": author or "Podcast",
                        "duration": 0,
                        "url": "",
                        "thumbnail": thumb,
                        "album": "",
                        "source": "ytmusicapi",
                    }
                )
            print(json.dumps({"ok": True, "items": items}))
            sys.stdout.flush()
            return

        if action == "artist_albums":
            if not artist_name:
                print(json.dumps({"ok": True, "albums": [], "singles": [], "topSongs": []}))
                return
            artist_hits = ytm.search(artist_name, filter="artists", limit=8)
            if not artist_hits:
                broad_hits = ytm.search(artist_name, limit=12)
                artist_hits = [
                    row for row in broad_hits
                    if safe_text(row.get("browseId")) and (norm(row.get("resultType")) in ("artist", "profile") or norm(row.get("category")) == "artists")
                ]
                if not artist_hits:
                    print(json.dumps({"ok": True, "albums": [], "singles": [], "topSongs": []}))
                    return
            artist = best_artist_hit(artist_hits, artist_name)
            browse_id = safe_text(artist.get("browseId"))
            if not browse_id:
                print(json.dumps({"ok": True, "albums": [], "singles": [], "topSongs": []}))
                return
            detail = ytm.get_artist(browse_id)
            albums = []
            singles = []
            top_songs = []
            songs_block = detail.get("songs") or {}
            for row in (songs_block.get("results") or [])[:20]:
                video_id = safe_text(row.get("videoId"))
                title = safe_text(row.get("title"))
                artists = row.get("artists") or []
                row_artist = safe_text(artists[0].get("name")) if artists else artist_name
                thumbs = row.get("thumbnails") or []
                thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                duration = row.get("duration_seconds") or 0
                if not video_id or not title:
                    continue
                top_songs.append(
                    {
                        "id": video_id,
                        "title": title,
                        "artist": row_artist,
                        "duration": int(duration or 0),
                        "url": f"https://music.youtube.com/watch?v={video_id}",
                        "thumbnail": thumb,
                        "album": "",
                    }
                )

            if not top_songs:
                try:
                    song_rows = ytm.search(artist_name, filter="songs", limit=24)
                    for row in song_rows:
                        video_id = safe_text(row.get("videoId"))
                        title = safe_text(row.get("title"))
                        artists = row.get("artists") or []
                        row_artist = safe_text(artists[0].get("name")) if artists else artist_name
                        if not video_id or not title:
                            continue
                        if not artist_match_relaxed(row_artist, artist_name):
                            continue
                        thumbs = row.get("thumbnails") or []
                        thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                        duration = row.get("duration_seconds") or 0
                        top_songs.append(
                            {
                                "id": video_id,
                                "title": title,
                                "artist": row_artist,
                                "duration": int(duration or 0),
                                "url": f"https://music.youtube.com/watch?v={video_id}",
                                "thumbnail": thumb,
                                "album": safe_text((row.get("album") or {}).get("name")),
                            }
                        )
                        if len(top_songs) >= 25:
                            break
                except Exception:
                    pass

            def collect_release_block(block_key, target):
                block = detail.get(block_key) or {}
                rows = list(block.get("results") or [])
                params = safe_text(block.get("params"))
                if params and hasattr(ytm, "get_artist_albums"):
                    try:
                        extended = ytm.get_artist_albums(browse_id, params, limit=220)
                        if isinstance(extended, dict):
                            extended_rows = extended.get("results") or []
                            if extended_rows:
                                rows = extended_rows
                        elif isinstance(extended, list) and extended:
                            rows = extended
                    except Exception:
                        pass
                if len(rows) < 20:
                    try:
                        fq = f"{artist_name} {'ep single' if block_key == 'singles' else 'album'}"
                        search_rows = ytm.search(fq, filter="albums", limit=70)
                        if isinstance(search_rows, list) and search_rows:
                            rows.extend(search_rows)
                    except Exception:
                        pass

                seen = set()
                for rel in rows:
                    rid = safe_text(rel.get("browseId"))
                    rtitle = safe_text(rel.get("title"))
                    thumbs = rel.get("thumbnails") or []
                    cover = safe_text(thumbs[-1].get("url")) if thumbs else ""
                    if not rid or not rtitle:
                        continue
                    if not row_belongs_to_artist(rel, artist_name):
                        continue
                    release_kind = classify_release(rel, rtitle)
                    if block_key == "albums" and release_kind != "album":
                        continue
                    if block_key == "singles" and release_kind != "single":
                        continue
                    key = (rid, rtitle.lower())
                    if key in seen:
                        continue
                    seen.add(key)
                    target.append(
                        {
                            "id": rid,
                            "title": rtitle,
                            "coverUrl": cover,
                            "artist": artist_name,
                        }
                    )

            collect_release_block("albums", albums)
            collect_release_block("singles", singles)

            if not albums and not singles:
                try:
                    fallback_rows = ytm.search(artist_name, filter="albums", limit=120)
                    seen_fb = set()
                    for rel in fallback_rows:
                        rid = safe_text(rel.get("browseId"))
                        rtitle = safe_text(rel.get("title"))
                        if not rid or not rtitle:
                            continue
                        if not row_belongs_to_artist(rel, artist_name):
                            continue
                        key = (rid, rtitle.lower())
                        if key in seen_fb:
                            continue
                        seen_fb.add(key)
                        thumbs = rel.get("thumbnails") or []
                        cover = safe_text(thumbs[-1].get("url")) if thumbs else ""
                        bucket = singles if classify_release(rel, rtitle) == "single" else albums
                        bucket.append(
                            {
                                "id": rid,
                                "title": rtitle,
                                "coverUrl": cover,
                                "artist": artist_name,
                            }
                        )
                except Exception:
                    pass

            print(json.dumps({"ok": True, "albums": albums, "singles": singles, "topSongs": top_songs}))
            return

        if action == "album_tracks":
            if not album_id:
                print(json.dumps({"ok": True, "tracks": []}))
                return
            album = ytm.get_album(album_id)
            tracks = []
            for row in album.get("tracks") or []:
                video_id = safe_text(row.get("videoId"))
                title = safe_text(row.get("title"))
                artists = row.get("artists") or []
                artist = safe_text(artists[0].get("name")) if artists else safe_text(album.get("artist"))
                thumbs = row.get("thumbnails") or album.get("thumbnails") or []
                thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                duration = row.get("duration_seconds") or 0
                tracks.append(
                    {
                        "id": video_id or f"{title}-{artist}",
                        "title": title,
                        "artist": artist,
                        "duration": int(duration or 0),
                        "url": f"https://music.youtube.com/watch?v={video_id}" if video_id else "",
                        "thumbnail": thumb,
                        "album": safe_text(album.get("title")),
                    }
                )
            print(json.dumps({"ok": True, "tracks": tracks}))
            return

        if action == "mood_playlists":
            mood_queries = [
                ("Enerji", "best workout gym motivation playlist"),
                ("Sakin", "chill focus calm playlist"),
                ("Gece", "night drive synthwave playlist"),
                ("Mutlu", "happy upbeat pop playlist"),
                ("Hüzün", "sad emotional ballad playlist"),
            ]
            playlists = []
            seen = set()
            for mood_name, mood_query in mood_queries:
                try:
                    rows = ytm.search(mood_query, filter="playlists", limit=5)
                except Exception:
                    rows = []
                for row in rows or []:
                    pid = safe_text(row.get("browseId"))
                    title = safe_text(row.get("title"))
                    if not pid or not title:
                        continue
                    key = pid.lower()
                    if key in seen:
                        continue
                    seen.add(key)
                    thumbs = row.get("thumbnails") or []
                    thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                    author = safe_text(row.get("author") or row.get("artist") or row.get("subtitle"))
                    playlists.append(
                        {
                            "id": pid,
                            "playlistId": pid,
                            "title": title,
                            "artist": author or "YouTube Music",
                            "thumbnail": thumb,
                            "mood": mood_name,
                            "url": f"https://music.youtube.com/playlist?list={pid}",
                            "source": "ytmusicapi",
                        }
                    )
                    break
            print(json.dumps({"ok": True, "playlists": playlists}))
            return

        if action == "playlist_tracks":
            if not playlist_id:
                print(json.dumps({"ok": True, "tracks": []}))
                return
            playlist = ytm.get_playlist(playlist_id, limit=220)
            tracks = []
            for row in (playlist.get("tracks") or []):
                video_id = safe_text(row.get("videoId"))
                title = safe_text(row.get("title"))
                if not title:
                    continue
                artists = row.get("artists") or []
                artist = safe_text(artists[0].get("name")) if artists else safe_text(row.get("artist")) or "Unknown Artist"
                thumbs = row.get("thumbnails") or playlist.get("thumbnails") or []
                thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                duration = row.get("duration_seconds") or 0
                tracks.append(
                    {
                        "id": video_id or f"{title}-{artist}",
                        "title": title,
                        "artist": artist,
                        "duration": int(duration or 0),
                        "url": f"https://music.youtube.com/watch?v={video_id}" if video_id else "",
                        "thumbnail": thumb,
                        "album": safe_text((row.get("album") or {}).get("name")) or "Single",
                    }
                )
            print(json.dumps({"ok": True, "tracks": tracks, "title": safe_text(playlist.get("title"))}))
            return

        if action == "lyrics":
            title = safe_text(payload.get("title"))
            artist = safe_text(payload.get("artist"))
            video_id = safe_text(payload.get("videoId"))
            if not video_id and (not title or not artist):
                print(json.dumps({"ok": False, "lyrics": "", "error": "missing-title-or-artist"}))
                return

            if not video_id:
                try:
                    rows = ytm.search(f"{artist} {title}", filter="songs", limit=6)
                except Exception:
                    rows = []
                best_row = None
                best_score = -1
                title_key = norm(title)
                artist_key = norm(artist)
                for row in rows or []:
                    row_title = safe_text(row.get("title"))
                    row_artists = row.get("artists") or []
                    row_artist = safe_text(row_artists[0].get("name")) if row_artists else ""
                    row_video_id = safe_text(row.get("videoId"))
                    if not row_video_id:
                        continue
                    score = 0
                    row_title_key = norm(row_title)
                    row_artist_key = norm(row_artist)
                    if row_title_key == title_key:
                        score += 100
                    elif title_key and (title_key in row_title_key or row_title_key in title_key):
                        score += 55
                    if artist_key and (artist_key == row_artist_key or artist_key in row_artist_key or row_artist_key in artist_key):
                        score += 90
                    elif artist_match_relaxed(row_artist, artist):
                        score += 48
                    if score > best_score:
                        best_score = score
                        best_row = row
                if best_row:
                    video_id = safe_text(best_row.get("videoId"))

            if not video_id:
                print(json.dumps({"ok": False, "lyrics": "", "error": "song-not-found"}))
                return

            lyrics_browse_id = ""
            try:
                watch = ytm.get_watch_playlist(videoId=video_id, limit=1)
                lyrics_browse_id = safe_text((watch or {}).get("lyrics"))
            except Exception:
                lyrics_browse_id = ""

            if not lyrics_browse_id:
                print(json.dumps({"ok": False, "lyrics": "", "error": "lyrics-not-found"}))
                return

            lyrics_text = ""
            lyrics_source = ""
            try:
                timed = ytm.get_lyrics(lyrics_browse_id, timestamps=True)
                lyrics_text = serialize_lyrics_payload(timed)
                lyrics_source = safe_text((timed or {}).get("source"))
            except Exception:
                lyrics_text = ""

            if not lyrics_text:
                try:
                    plain = ytm.get_lyrics(lyrics_browse_id, timestamps=False)
                    lyrics_text = serialize_lyrics_payload(plain)
                    lyrics_source = safe_text((plain or {}).get("source"))
                except Exception:
                    lyrics_text = ""

            if lyrics_text:
                print(json.dumps({"ok": True, "lyrics": lyrics_text, "source": lyrics_source or "ytmusicapi"}))
            else:
                print(json.dumps({"ok": False, "lyrics": "", "error": "lyrics-not-found"}))
            return

        if action == "similar_playlists":
            # Build recommendations from listener library artists.
            if not seed_artists:
                print(json.dumps({"ok": True, "playlists": []}))
                return
            unique_artists = []
            seen_artists = set()
            for artist in seed_artists:
                key = norm(artist)
                if not key or key in seen_artists:
                    continue
                seen_artists.add(key)
                unique_artists.append(artist)
                if len(unique_artists) >= 6:
                    break

            playlists = []
            seen_playlists = set()
            playlist_artist_match_cache = {}

            def playlist_contains_artist(playlist_id, artist_name):
                artist_key = norm(artist_name)
                if not playlist_id or not artist_key:
                    return False
                cache_key = f"{playlist_id}::{artist_key}"
                if cache_key in playlist_artist_match_cache:
                    return playlist_artist_match_cache[cache_key]
                try:
                    playlist_detail = ytm.get_playlist(playlist_id, limit=35)
                except Exception:
                    playlist_artist_match_cache[cache_key] = False
                    return False
                for track_row in (playlist_detail.get("tracks") or []):
                    candidate_artists = []
                    for artist_row in (track_row.get("artists") or []):
                        candidate_artists.append(safe_text(artist_row.get("name")))
                    candidate_artists.append(safe_text(track_row.get("artist")))
                    for candidate_artist in candidate_artists:
                        candidate_key = norm(candidate_artist)
                        if candidate_key and (candidate_key == artist_key or artist_key in candidate_key or candidate_key in artist_key):
                            playlist_artist_match_cache[cache_key] = True
                            return True
                playlist_artist_match_cache[cache_key] = False
                return False

            for artist in unique_artists:
                queries = [
                    (f"{artist} best songs playlist", artist),
                    (f"{artist} mix playlist", artist),
                ]
                for query_text, mood_name in queries:
                    try:
                        rows = ytm.search(query_text, filter="playlists", limit=8)
                    except Exception:
                        rows = []
                    for row in rows or []:
                        pid = safe_text(row.get("browseId"))
                        title = safe_text(row.get("title"))
                        if not pid or not title:
                            continue
                        key = pid.lower()
                        if key in seen_playlists:
                            continue
                        if not playlist_contains_artist(pid, artist):
                            continue
                        seen_playlists.add(key)
                        thumbs = row.get("thumbnails") or []
                        thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                        author = safe_text(row.get("author") or row.get("artist") or row.get("subtitle"))
                        playlists.append(
                            {
                                "id": pid,
                                "playlistId": pid,
                                "title": title,
                                "artist": author or "YouTube Music",
                                "thumbnail": thumb,
                                "mood": mood_name,
                                "url": f"https://music.youtube.com/playlist?list={pid}",
                                "source": "ytmusicapi",
                            }
                        )
                        if len(playlists) >= 20:
                            break
                    if len(playlists) >= 20:
                        break
                if len(playlists) >= 20:
                    break
            print(json.dumps({"ok": True, "playlists": playlists}))
            return

        if action == "latest_release_for_artists":
            if not seed_artists:
                print(json.dumps({"ok": True, "item": None}))
                return

            candidates = []
            seen_seed = set()
            artist_seeds = []
            for name in seed_artists:
                key = norm(name)
                if not key or key in seen_seed:
                    continue
                seen_seed.add(key)
                artist_seeds.append(name)
                if len(artist_seeds) >= 8:
                    break

            def parse_year(value):
                text = safe_text(value)
                digits = "".join(ch for ch in text if ch.isdigit())
                if len(digits) >= 4:
                    try:
                        return int(digits[:4])
                    except Exception:
                        return 0
                return 0

            for artist_name in artist_seeds:
                try:
                    artist_hits = ytm.search(artist_name, filter="artists", limit=6)
                except Exception:
                    artist_hits = []
                if not artist_hits:
                    continue
                artist_hit = best_artist_hit(artist_hits, artist_name)
                browse_id = safe_text(artist_hit.get("browseId"))
                if not browse_id:
                    continue
                try:
                    detail = ytm.get_artist(browse_id)
                except Exception:
                    continue

                for block_key, kind in (("albums", "album"), ("singles", "album")):
                    block = detail.get(block_key) or {}
                    rows = list(block.get("results") or [])
                    params = safe_text(block.get("params"))
                    if params and hasattr(ytm, "get_artist_albums"):
                        try:
                            extended = ytm.get_artist_albums(browse_id, params, limit=120)
                            if isinstance(extended, dict):
                                rows = list(extended.get("results") or rows)
                            elif isinstance(extended, list) and extended:
                                rows = extended
                        except Exception:
                            pass
                    for rel in rows:
                        rid = safe_text(rel.get("browseId"))
                        title = safe_text(rel.get("title"))
                        if not rid or not title:
                            continue
                        if not row_belongs_to_artist(rel, artist_name):
                            continue
                        thumbs = rel.get("thumbnails") or []
                        cover = safe_text(thumbs[-1].get("url")) if thumbs else ""
                        year = parse_year(rel.get("year") or rel.get("releaseDate") or rel.get("subtitle"))
                        candidates.append(
                            {
                                "kind": kind,
                                "id": rid,
                                "title": title,
                                "artist": artist_name,
                                "coverUrl": cover,
                                "releaseDate": safe_text(rel.get("year") or rel.get("releaseDate") or ""),
                                "year": int(year or 0),
                            }
                        )

                # fallback to songs if nothing captured for this artist
                if not any(norm(c.get("artist")) == norm(artist_name) for c in candidates):
                    try:
                        songs = ytm.search(artist_name, filter="songs", limit=8)
                    except Exception:
                        songs = []
                    for row in songs:
                        video_id = safe_text(row.get("videoId"))
                        title = safe_text(row.get("title"))
                        if not video_id or not title:
                            continue
                        artists = row.get("artists") or []
                        row_artist = safe_text(artists[0].get("name")) if artists else artist_name
                        if not artist_match_relaxed(row_artist, artist_name):
                            continue
                        thumbs = row.get("thumbnails") or []
                        cover = safe_text(thumbs[-1].get("url")) if thumbs else ""
                        candidates.append(
                            {
                                "kind": "song",
                                "id": video_id,
                                "title": title,
                                "artist": row_artist,
                                "coverUrl": cover,
                                "releaseDate": "",
                                "year": 0,
                                "url": f"https://music.youtube.com/watch?v={video_id}",
                            }
                        )
                        break

            if not candidates:
                print(json.dumps({"ok": True, "item": None}))
                return

            candidates.sort(
                key=lambda item: (
                    int(item.get("year") or 0),
                    1 if item.get("kind") == "album" else 0,
                ),
                reverse=True,
            )
            print(json.dumps({"ok": True, "item": candidates[0]}))
            return

        if action == "random_missing_song_for_artists":
            if not seed_artists:
                print(json.dumps({"ok": True, "item": None}))
                return

            artist_seeds = []
            seen_seed = set()
            for name in seed_artists:
                key = norm(name)
                if not key or key in seen_seed:
                    continue
                seen_seed.add(key)
                artist_seeds.append(name)
                if len(artist_seeds) >= 10:
                    break

            candidates = []
            for artist_name in artist_seeds:
                try:
                    rows = ytm.search(artist_name, filter="songs", limit=24)
                except Exception:
                    rows = []
                for row in rows:
                    video_id = safe_text(row.get("videoId"))
                    title = safe_text(row.get("title"))
                    if not video_id or not title:
                        continue
                    artists = row.get("artists") or []
                    row_artist = safe_text(artists[0].get("name")) if artists else artist_name
                    if not artist_match_relaxed(row_artist, artist_name):
                        continue
                    sig = norm(f"{row_artist}|||{title}")
                    if sig and sig in owned_signatures:
                        continue
                    thumbs = row.get("thumbnails") or []
                    thumb = safe_text(thumbs[-1].get("url")) if thumbs else ""
                    duration = row.get("duration_seconds") or 0
                    album = safe_text((row.get("album") or {}).get("name"))
                    candidates.append(
                        {
                            "kind": "song",
                            "id": video_id,
                            "title": title,
                            "artist": row_artist,
                            "coverUrl": thumb,
                            "duration": int(duration or 0),
                            "album": album or "Single",
                            "url": f"https://music.youtube.com/watch?v={video_id}",
                        }
                    )
            if not candidates:
                print(json.dumps({"ok": True, "item": None}))
                return

            # Deterministic-ish random per day to avoid flicker every render.
            day_seed = sum(ord(ch) for ch in safe_text(payload.get("seed") or ""))
            index = day_seed % len(candidates) if len(candidates) else 0
            print(json.dumps({"ok": True, "item": candidates[index]}))
            return

        print(json.dumps({"ok": False, "error": f"unsupported-action:{action}"}))
    except Exception as exc:
        # Ensure safe error string that can be JSON serialized
        try:
            error_str = str(exc)[:500]  # Limit length to prevent huge error strings
        except Exception:
            error_str = "unknown-error"
        
        # Additional safeguards for encoding issues
        try:
            error_str = error_str.encode('utf-8').decode('utf-8')
        except Exception:
            error_str = repr(exc)[:200]  # Use repr as fallback
        
        print(json.dumps({"ok": False, "error": error_str}))


if __name__ == "__main__":
    main()
