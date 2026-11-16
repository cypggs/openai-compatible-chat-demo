import { useId } from 'react'
import { Button } from '../base/Button.js'
import { Select } from '../base/Select.js'
import {
  setApiProvider,
  setOpenAiBaseUrl,
  setOpenAiModel,
  useSettings,
  type ApiProvider,
} from '../../services/settings.js'
import {
  clearOpenAiModels,
  refreshOpenAiModels,
  useOpenAiModels,
} from '../../services/openaiModels.js'
import { useTranslate } from '../../i18n/index.js'
import styles from './Settings.module.css'

/** 接口类型、OpenAI 地址及可拉取的模型 ID；配置仅保存在当前浏览器。 */
export const ApiProviderField = () => {
  const t = useTranslate()
  const provider = useSettings((state) => state.apiProvider)
  const baseUrl = useSettings((state) => state.openaiBaseUrl)
  const model = useSettings((state) => state.openaiModel)
  const apiKey = useSettings((state) => state.openaiApiKey)
  const models = useOpenAiModels((state) => state.models)
  const loading = useOpenAiModels((state) => state.loading)
  const modelsError = useOpenAiModels((state) => state.error)
  const modelInputId = useId()
  const modelListId = useId()

  return (
    <div className={styles.cell}>
      <div className={styles.providerSettings}>
        <div className={styles.providerRow}>
          <div className={styles.label}>{t('apiProvider')}</div>
          <Select<ApiProvider>
            ariaLabel={t('apiProvider')}
            className={styles.providerSelect}
            value={provider}
            options={[
              { value: 'openai', label: t('apiProviderOpenAi') },
              { value: 'deepseek', label: t('apiProviderDeepSeek') },
            ]}
            onChange={setApiProvider}
          />
        </div>
        {provider === 'openai' ? (
          <>
            <label className={styles.configField}>
              <span>{t('openAiBaseUrl')}</span>
              <input
                className={styles.configInput}
                type="url"
                value={baseUrl}
                placeholder="https://api.openai.com/v1"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => {
                  clearOpenAiModels()
                  setOpenAiBaseUrl(event.target.value)
                }}
              />
            </label>
            <div className={styles.configField}>
              <label htmlFor={modelInputId}>{t('openAiModel')}</label>
              <div className={styles.modelInputRow}>
                <input
                  id={modelInputId}
                  className={styles.configInput}
                  type="text"
                  list={modelListId}
                  value={model}
                  placeholder="gpt-4o-mini"
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(event) => setOpenAiModel(event.target.value)}
                />
                <Button
                  variant="outlined"
                  size="m"
                  className={styles.fetchModels}
                  disabled={!apiKey || loading}
                  onClick={() => void refreshOpenAiModels(apiKey ?? '', baseUrl)}
                >
                  {t(loading ? 'openAiFetchingModels' : 'openAiFetchModels')}
                </Button>
              </div>
              <datalist id={modelListId}>
                {models.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </div>
            {models.length > 0 ? (
              <div className={styles.description}>
                {t('openAiModelsLoaded', { count: models.length })}
              </div>
            ) : null}
            {modelsError ? (
              <div className={styles.error}>
                {t('openAiModelsFailed', { message: modelsError })}
              </div>
            ) : null}
            <div className={styles.description}>{t('openAiConfigDescription')}</div>
          </>
        ) : null}
      </div>
    </div>
  )
}
