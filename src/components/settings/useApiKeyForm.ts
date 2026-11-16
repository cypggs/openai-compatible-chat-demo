import { useEffect, useState } from 'react'
import { ApiError, verifyApiKey, verifyOpenAiApiKey } from '../../services/api/client.js'
import { classifyApiError } from '../../services/api/errors.js'
import { setApiKey, setOpenAiApiKey, setOpenAiModel, useSettings } from '../../services/settings.js'
import { setOpenAiModels } from '../../services/openaiModels.js'
import { useTranslate } from '../../i18n/index.js'

/** 按当前接口用 GET /models 校验 Key；DeepSeek 与 OpenAI 兼容服务的 Key 分开保存。 */
export const useApiKeyForm = (onSaved?: () => void) => {
  const t = useTranslate()
  const provider = useSettings((state) => state.apiProvider)
  const baseUrl = useSettings((state) => state.openaiBaseUrl)
  const [value, setValue] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [failure, setFailure] = useState<{ cause: unknown } | null>(null)

  useEffect(() => {
    setValue('')
    setFailure(null)
  }, [provider])

  const cause = failure?.cause
  const error =
    failure === null
      ? null
      : classifyApiError(cause) === 'unauthorized'
        ? t('apiKeyInvalid')
        : classifyApiError(cause) === 'network'
          ? t('commonNetworkErrorToast')
          : t('apiKeyVerificationFailed', {
              message:
                cause instanceof ApiError && cause.localMessage
                  ? t(cause.localMessage.key, cause.localMessage.params)
                  : cause instanceof Error
                    ? cause.message
                    : String(cause),
            })

  const submit = async () => {
    const apiKey = value.trim()
    if (!apiKey || verifying) {
      return
    }
    const selectedProvider = provider
    setVerifying(true)
    setFailure(null)
    try {
      if (selectedProvider === 'openai') {
        const models = await verifyOpenAiApiKey(apiKey, baseUrl)
        setOpenAiModels(models)
        const currentModel = useSettings.getState().openaiModel
        if (models.length > 0 && !models.includes(currentModel)) {
          setOpenAiModel(models[0])
        }
        setOpenAiApiKey(apiKey)
      } else {
        await verifyApiKey(apiKey)
        setApiKey(apiKey)
      }
      setValue('')
      onSaved?.()
    } catch (e) {
      setFailure({ cause: e })
    } finally {
      setVerifying(false)
    }
  }

  return { value, setValue, verifying, error, submit }
}
