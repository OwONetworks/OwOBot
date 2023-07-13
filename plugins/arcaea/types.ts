interface AccountInfo {
  code: string,
  name: string,
  user_id: number,
  is_mutual: boolean,
  is_char_uncapped_override: boolean,
  is_char_uncapped: boolean,
  is_skill_sealed: boolean,
  rating: number,
  join_date: number,
  character: number
}

interface SongInfo {
  name_en: string,
  name_jp: string,
  artist: string,
  bpm: string,
  bpm_base: number,
  set: string,
  set_friendly: string,
  time: number,
  side: number,
  world_unlock: boolean,
  remote_download: boolean,
  bg: string,
  date: number,
  version: string,
  difficulty: number,
  rating: number,
  note: number,
  chart_designer: string,
  jacket_designer: string,
  jacket_override: boolean,
  audio_override: boolean
}

interface RecentScore {
  score: number,
  health: number,
  rating: number,
  song_id: string,
  modifier: number,
  difficulty: number,
  clear_type: number,
  best_clear_type: number,
  time_played: number,
  near_count: number,
  miss_count: number,
  perfect_count: number,
  shiny_perfect_count: number
}

interface Record {
  score: number,
  health: number,
  rating: number,
  song_id: string,
  modifier: number,
  difficulty: number,
  clear_type: number,
  best_clear_type: number,
  time_played: number,
  near_count: number,
  miss_count: number,
  perfect_count: number,
  shiny_perfect_count: number
}

export interface UserInfo {
  status: number;
  content: {
    account_info: AccountInfo,
    recent_score: RecentScore[],
    songinfo: SongInfo[]
  }
}

export interface Best30 {
  status: number;
  content: {
    best30_avg: number,
    recent10_avg: number,
    account_info: AccountInfo,
    best30_list: Record[],
    best30_songinfo: SongInfo[],
    recent_score: RecentScore[],
    recent_songinfo: SongInfo[]
  }
}

export interface Best {
  status: number;
  content: {
    account_info: AccountInfo,
    record: Record,
    songinfo: SongInfo,
    recent_score: RecentScore,
    recent_songinfo: SongInfo
  }
}

export interface SongList {
  status: number;
  content: {
    songs: {
      song_id: string,
      difficulties: SongInfo[],
      alias: string[]
    }[]
  }
}

export interface SongDetail {
  status: number;
  content: {
    song_id: string,
    difficulties: SongInfo[],
    alias: string[]
  }
}