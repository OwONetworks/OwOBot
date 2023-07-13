import axios from "axios"

interface PixivIllust {
  id: string;
  title: string;
  type: string;
  image_urls: {
    square_medium: string;
    medium: string;
    large: string;
  };
  caption: string;
  restrict: string;
  user: {
    id: string;
    name: string;
    account: string;
    profile_image_urls: {
      medium: string;
    };
    is_followed: boolean;
  };
  tags: {
    name: string;
    translated_name: string;
  }[];
  tools: unknown[];
  create_date: string;
  page_count: string;
  width: string;
  height: string;
  sanity_level: number;
  x_restrict: string;
  series: unknown;
  meta_single_page: {
    original_image_url?: string
  };
  meta_pages: {
    image_urls: {
      square_medium: string;
      medium: string;
      large: string;
      original: string;
    };
  }[]
  total_view: number;
  total_bookmarks: number;
  is_bookmarked: false;
  visible: true;
  is_muted: false;
}

export const search = async (keyword: string) => {
  const illusts = [];
  const state = {
    keyword: keyword,
    page: 1,
  };

  while (illusts.length < 5) {
    const resp = await axios.get(encodeURI(`https://api.obfs.dev/api/pixiv/search?word=${state.keyword}&page=${state.page}`));
    const illusts_: PixivIllust[] = resp.data.illusts;

    for (const item of illusts_) {
      // 跳过涩图
      if (item.sanity_level >= 3) continue
      if (item.total_view < 300) continue
      if (item.total_bookmarks < 150) continue

      illusts.push(item)
    }

    state.page += 1

    if (state.page > 3) break
  }

  return illusts
};

export const downloadImage = async (url: string) => {
  const resp = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(resp.data)
}