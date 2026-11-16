import { create } from 'zustand'
import { verifyOpenAiApiKey } from './api/client.js'

type OpenAiModelsState = {
  models: string[]
  loading: boolean
  error: string | null
}

/** 临时模型列表，不写入 localStorage；Key 验证成功后也会直接填充这里。 */
export const useOpenAiModels = create<OpenAiModelsState>(() => ({
  models: [],
  loading: false,
  error: null,
}))

let refreshSequence = 0

export const setOpenAiModels = (models: string[]) => {
  refreshSequence += 1
  useOpenAiModels.setState({ models, loading: false, error: null })
}

export const clearOpenAiModels = () => {
  refreshSequence += 1
  useOpenAiModels.setState({ models: [], loading: false, error: null })
}

export const refreshOpenAiModels = async (apiKey: string, baseUrl: string) => {
  const sequence = ++refreshSequence
  useOpenAiModels.setState({ loading: true, error: null })
  try {
    const models = await verifyOpenAiApiKey(apiKey, baseUrl)
    if (sequence === refreshSequence) {
      useOpenAiModels.setState({ models, loading: false })
    }
  } catch (error) {
    if (sequence === refreshSequence) {
      useOpenAiModels.setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
