import { create } from 'zustand'
import type { TtsVoice } from './api/speech.js'
import { normalizeLocation, type UserLocation } from './location.js'

export type Locale = 'zh-CN' | 'en-US'
export type ApiProvider = 'deepseek' | 'openai'

/** 主题偏好；默认跟随系统 */
export type ThemePreference = 'light' | 'dark' | 'system'

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

/** 本机设置，存 localStorage：接口、API Key、语言、主题、位置、朗读音色与对话开关 */
type Settings = {
  apiProvider: ApiProvider
  /** DeepSeek API Key，保留原有存储键以兼容旧版本 */
  apiKey: string | null
  openaiApiKey: string | null
  openaiBaseUrl: string
  openaiModel: string
  locale: Locale
  themePreference: ThemePreference
  location: UserLocation | null
  ttsVoice: TtsVoice
  thinking: boolean
  search: boolean
  siderCollapsed: boolean
}

const KEYS = {
  apiProvider: 'chat-demo:api-provider',
  apiKey: 'chat-demo:api-key',
  openaiApiKey: 'chat-demo:openai-api-key',
  openaiBaseUrl: 'chat-demo:openai-base-url',
  openaiModel: 'chat-demo:openai-model',
  locale: 'chat-demo:locale',
  location: 'chat-demo:location',
  themePreference: 'chat-demo:theme-preference',
  ttsVoice: 'chat-demo:tts-voice',
  thinking: 'chat-demo:thinking',
  search: 'chat-demo:search',
  siderCollapsed: 'chat-demo:sider-collapsed',
} as const

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // 存储不可用时只在内存中生效
  }
}

/** 位置选择模式跟随浏览器语言，与应用内选择的界面语言无关。 */
export const isChineseBrowser = (): boolean =>
  (typeof navigator === 'undefined' ? 'zh' : navigator.language).toLowerCase().startsWith('zh')

const initialLocale = (): Locale => {
  const saved = read(KEYS.locale)
  if (saved === 'zh-CN' || saved === 'en-US') {
    return saved
  }
  return isChineseBrowser() ? 'zh-CN' : 'en-US'
}

const initialLocation = (): UserLocation | null => {
  try {
    const location = normalizeLocation(JSON.parse(read(KEYS.location) ?? 'null'))
    if (!location) {
      return null
    }
    return isChineseBrowser()
      ? location.region === 'CN' && location.province
        ? location
        : null
      : { region: location.region }
  } catch {
    return null
  }
}

/** 未保存过时跟随系统 */
const initialThemePreference = (): ThemePreference => {
  const saved = read(KEYS.themePreference)
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

/** 未保存过时使用服务端默认音色 stella（海星） */
const initialTtsVoice = (): TtsVoice => (read(KEYS.ttsVoice) === 'tide' ? 'tide' : 'stella')

export const useSettings = create<Settings>(() => ({
  // 这个衍生版本默认使用 OpenAI 兼容接口；切回 DeepSeek 后仍保留各自独立的 Key。
  apiProvider: read(KEYS.apiProvider) === 'deepseek' ? 'deepseek' : 'openai',
  apiKey: read(KEYS.apiKey),
  openaiApiKey: read(KEYS.openaiApiKey),
  openaiBaseUrl: read(KEYS.openaiBaseUrl) ?? DEFAULT_OPENAI_BASE_URL,
  openaiModel: read(KEYS.openaiModel) ?? DEFAULT_OPENAI_MODEL,
  locale: initialLocale(),
  location: initialLocation(),
  themePreference: initialThemePreference(),
  ttsVoice: initialTtsVoice(),
  thinking: read(KEYS.thinking) === 'true',
  search: read(KEYS.search) === 'true',
  siderCollapsed: read(KEYS.siderCollapsed) === 'true',
}))

export const getActiveApiKey = (
  settings: Pick<Settings, 'apiProvider' | 'apiKey' | 'openaiApiKey'>
) => (settings.apiProvider === 'openai' ? settings.openaiApiKey : settings.apiKey)

export const hasApiConfiguration = (settings: Settings) =>
  Boolean(
    getActiveApiKey(settings)?.trim() &&
    (settings.apiProvider === 'deepseek' ||
      (settings.openaiBaseUrl.trim() && settings.openaiModel.trim()))
  )

export const setApiProvider = (apiProvider: ApiProvider) => {
  write(KEYS.apiProvider, apiProvider)
  useSettings.setState({ apiProvider })
}

export const setLocale = (locale: Locale) => {
  write(KEYS.locale, locale)
  useSettings.setState({ locale })
}

export const setLocation = (value: UserLocation | null) => {
  const location = normalizeLocation(value)
  write(KEYS.location, location ? JSON.stringify(location) : null)
  useSettings.setState({ location })
}

export const setThemePreference = (themePreference: ThemePreference) => {
  write(KEYS.themePreference, themePreference)
  useSettings.setState({ themePreference })
}

export const setTtsVoice = (ttsVoice: TtsVoice) => {
  write(KEYS.ttsVoice, ttsVoice)
  useSettings.setState({ ttsVoice })
}

export const setApiKey = (apiKey: string | null) => {
  write(KEYS.apiKey, apiKey)
  useSettings.setState({ apiKey })
}

export const setOpenAiApiKey = (openaiApiKey: string | null) => {
  write(KEYS.openaiApiKey, openaiApiKey)
  useSettings.setState({ openaiApiKey })
}

export const setOpenAiBaseUrl = (openaiBaseUrl: string) => {
  write(KEYS.openaiBaseUrl, openaiBaseUrl)
  useSettings.setState({ openaiBaseUrl })
}

export const setOpenAiModel = (openaiModel: string) => {
  write(KEYS.openaiModel, openaiModel)
  useSettings.setState({ openaiModel })
}

export const setThinking = (thinking: boolean) => {
  write(KEYS.thinking, String(thinking))
  useSettings.setState({ thinking })
}

export const setSearch = (search: boolean) => {
  write(KEYS.search, String(search))
  useSettings.setState({ search })
}

export const setSiderCollapsed = (siderCollapsed: boolean) => {
  write(KEYS.siderCollapsed, String(siderCollapsed))
  useSettings.setState({ siderCollapsed })
}
