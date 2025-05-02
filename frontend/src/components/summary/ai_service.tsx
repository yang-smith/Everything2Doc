/**
 * AI 服务
 * 提供与 AI 模型交互的基本功能
 */

// 配置信息 - 使用 NEXT_PUBLIC 环境变量
const API_URL = "https://openrouter.ai/api/v1/chat/completions"
// API 密钥从环境变量中获取
const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "sk-or-v1-666"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://test_img.com"
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "test_img"

// 修复非 ASCII 字符问题
const encodedSiteName = encodeURIComponent(SITE_NAME)

// 聊天记录转日报的详细 prompt
const PROMPT_SUMMARY_CONTENT = `
你是一位精通信息提炼与叙事的资深写作师，擅长将零散对话转化为连贯清晰的日报。

# 任务定义
从提供的聊天记录中提取关键信息、事件和洞见，创建一份内容丰富、结构清晰的日报文档，帮助读者快速了解对话中发生的重要事项。

# 内容筛选标准
1. **事实优先**：客观事实、决策和结论是核心
2. **时序重要性**：按时间顺序或逻辑关系组织信息
3. **信息密度**：保留高价值密度的内容，舍弃重复和冗余
4. **上下文完整**：确保关键信息有足够上下文支持理解
5. **多方视角**：在争议点呈现不同意见及其支持度

# 结构化方法
1. **整体框架**：
   1. 摘要（100字以内简述核心内容）
   2. 基本信息（日期（如果不确定，写未知），消息数量，活跃用户数量。）
   3. 今日讨论热点
      包含讨论主题、内容、关键词（1-5个）、参与讨论者
      按照热度排序，热度高的排在前面
   4. 实用的干货教程/方法论/重要资讯
      包含主题、分享者、详细内容说明
   5. 金句
      包含金句和金句来源
   6. 群内数据可视化 
      话题数据可视化
   7. 话痨榜单

3. **视觉增强**：
   - 关键数据使用表格呈现
   - 复杂关系考虑使用简明图表
   - 适量使用表情符号增强阅读体验
   - 重要信息使用加粗、引用等格式突出

# 语言风格
- 清晰简洁，避免模糊表达
- 参考输入内容的语言风格
- 保留原始内容中有特色的表达方式和金句
- 适当使用比喻和类比来解释复杂概念
- 句式多样化，避免连续使用相同结构

# 输入内容
{chat_records}

# 输出格式
使用以下固定格式输出内容：

\`
<title>
每日社群精华摘要
</title>

<summary>
[100字以内的摘要，概述当日讨论核心内容和热点]
</summary>

<basic info>
日期：[年-月-日]
消息数量：[消息总数]
活跃用户：[用户数量]
</basic info>

<hot discussions>
讨论主题：[讨论主题1]
内容：[主要讨论内容、具体论点和反驳，呈现不同观点及其支持度，包含讨论中出现的具体数据、案例和经验（如有）。重新组织内容呈现以方便读者阅读]
关键词：[关键词1、关键词2、关键词3...]
参与讨论者：[用户1、用户2、用户3...]
消息数量：[相关消息数]

讨论主题：[讨论主题2]
内容：[主要讨论内容、具体论点和反驳，呈现不同观点及其支持度，包含讨论中出现的具体数据、案例和经验（如有）。重新组织内容呈现以方便读者阅读]
关键词：[关键词1、关键词2、关键词3...]
参与讨论者：[用户1、用户2、用户3...]
消息数量：[相关消息数]

[可根据实际情况添加更多讨论主题]
</hot discussions>

<tutorials>
主题：[教程/方法论主题1]
分享者：[分享者名称]
详细内容：[提取完整的步骤流程（如有），保留原始分享者提供的细节，包含具体工具、技术和方法的详情，提取分享的背景和适用场景，记录实际案例和效果数据（如有）。重新组织内容呈现以方便读者阅读]

主题：[教程/方法论主题2]
分享者：[分享者名称]
详细内容：[提取完整的步骤流程（如有），保留原始分享者提供的细节，包含具体工具、技术和方法的详情，提取分享的背景和适用场景，记录实际案例和效果数据（如有）。重新组织内容呈现以方便读者阅读]

[可根据实际情况添加更多教程]
</tutorials>

<quotes>
金句：[值得记录的金句1]
金句来源：[发言者]

金句：[值得记录的金句2]
金句来源：[发言者]

[可根据实际情况添加更多金句]
</quotes>

<data visualization>
话题：[话题1]:[比例1],[话题2]:[比例2],[话题3]:[比例3],[话题4]:[比例4]
</data visualization>

<talkative ranking>
[用户1]：[发言数量]
[用户2]：[发言数量]
[用户3]：[发言数量]
[用户4]：[发言数量]
[用户5]：[发言数量]
</talkative ranking>\`

确保严格保持上述格式，根据聊天记录中的实际内容填充每个部分。如果某些部分缺乏足够信息，可保留基本结构但内容可以简化。直接输出最终文档，不要添加额外解释。
`

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatCompletionResponse {
  id: string
  choices: {
    message: Message
    finish_reason: string
    index: number
  }[]
  model: string
  created: number
}

/**
 * 发送聊天请求到 OpenRouter API
 */
export async function sendChatRequest(
  messages: Message[],
  model = "openai/gpt-4o",
  temperature = 0.7,
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error("未配置 OpenRouter API 密钥")
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": encodedSiteName,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`)
    }

    const data: ChatCompletionResponse = await response.json()
    return data.choices[0]?.message.content || ""
  } catch (error) {
    console.error("OpenRouter API 请求错误:", error)
    throw error
  }
}

/**
 * 发送流式聊天请求到 OpenRouter API
 * @param messages 消息数组
 * @param onChunk 接收每个文本块的回调函数
 * @param model 模型名称
 * @param temperature 温度参数
 * @returns 完整的响应文本
 */
export async function sendStreamingChatRequest(
  messages: Message[],
  onChunk: (chunk: string) => void,
  model = "google/gemini-2.0-flash-lite-001",
  temperature = 0.7,
): Promise<string> {
  try {
    if (!API_KEY) {
      throw new Error("未配置 OpenRouter API 密钥")
    }

    // 确保所有头信息值仅包含ISO-8859-1字符
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": SITE_URL,
      "Content-Type": "application/json",
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true,
      }),
    })

    if (!response.ok) {
      // 优化错误处理
      try {
        const errorData = await response.json()
        throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`)
      } catch (e) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("响应体不可读")
    }

    const decoder = new TextDecoder()
    let buffer = ""
    let fullText = ""

    try {
      // 使用更高效的处理方式
      const processLines = () => {
        let lineEnd
        while ((lineEnd = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, lineEnd).trim()
          buffer = buffer.slice(lineEnd + 1)

          if (!line || !line.startsWith("data: ")) continue

          const data = line.slice(6)
          if (data === "[DONE]") return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
              fullText += content
            }
          } catch (e) {
            // 忽略无效的 JSON，但记录日志以便调试
            console.debug("无法解析流式响应行:", line)
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        processLines()
      }

      // 处理缓冲区中可能剩余的数据
      if (buffer.trim()) {
        buffer += "\n"
        processLines()
      }
    } finally {
      reader.cancel()
    }

    return fullText
  } catch (error) {
    console.error("OpenRouter 流式 API 请求错误:", error)
    // 向上层传递错误，以便UI可以适当处理
    throw error
  }
}

/**
 * 将聊天记录转换为日报摘要
 * @param chatContent 聊天记录内容
 * @returns 生成的日报摘要
 */
export async function convertChatToReport(chatContent: string): Promise<string> {
  try {
    const prompt = PROMPT_SUMMARY_CONTENT.replace("{chat_records}", chatContent)

    const messages: Message[] = [{ role: "user", content: prompt }]

    return await sendChatRequest(messages, "openai/gpt-4o", 0.7)
  } catch (error) {
    console.error("转换聊天记录错误:", error)
    throw new Error("无法生成日报摘要，请稍后再试")
  }
}

/**
 * 流式将聊天记录转换为日报摘要
 * @param chatContent 聊天记录内容
 * @param onChunk 接收每个文本块的回调函数
 * @returns 生成的完整日报摘要
 */
export async function streamingConvertChatToReport(
  chatContent: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
  try {
    const prompt = PROMPT_SUMMARY_CONTENT.replace("{chat_records}", chatContent)

    const messages: Message[] = [{ role: "user", content: prompt }]

    return await sendStreamingChatRequest(messages, onChunk, "google/gemini-2.0-flash-lite-001", 0.7)
  } catch (error) {
    console.error("流式转换聊天记录错误:", error)
    throw new Error("无法生成日报摘要，请稍后再试")
  }
}
