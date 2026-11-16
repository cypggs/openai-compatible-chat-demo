import { create } from 'zustand'
import { hasApiConfiguration, useSettings } from '../../services/settings.js'

/** 设置弹窗的分组：通用设置 / 数据管理 */
export type SettingsSection = 'general' | 'data'

/** 设置弹窗：侧边栏底部、没有 API Key 时的操作与 401 提示都可以打开；section 为打开时选中的分组 */
export const useSettingsDialog = create(() => ({
  open: false,
  section: 'general' as SettingsSection,
}))

export const openSettings = (section: SettingsSection) =>
  useSettingsDialog.setState({ open: true, section })

export const closeSettings = () => useSettingsDialog.setState({ open: false })

/** 缺少当前接口所需的 URL、模型或 Key 时，打开对应设置。 */
export const ensureApiKey = () => {
  if (hasApiConfiguration(useSettings.getState())) {
    return true
  }
  openSettings('data')
  return false
}
