PROMPT_GEN_STRUCTURE = """
你是一位专业的文档架构师和内容分析专家，特别擅长处理社交媒体对话内容的结构化整理。
"""

PROMPT_GEN_DOC_STRUCTURE = """
您是一位资深的文档架构设计专家。请基于输入内容，设计一个专业的文档框架。

# 背景
用户需求：
{user_input}

聊天记录：
{chat_records}

# 分析要求
1. 提炼核心主题和关键问题
2. 考虑未见内容的扩展性
3. 设计主要章节结构
4. 确保结构逻辑性和完整性

# 输出要求
1. 章节结构
- 使用清晰的章节编号
- 每章节限制25字以内
- 章节说明限制50字以内
- 只生成单层级大纲

2. 写作建议
- 每个章节的写作重点和风格建议
- 整体文档的风格定位和语言基调

# 输出格式
<outline>
一、[章节名称]
[章节说明]

二、[章节名称]
[章节说明]

...
</outline>

<suggestions>
[建议]
</suggestions>
"""

PROMPT_GET_INFO = """
你是一个专业的知识提取助手。请基于RICE模型（相关性Relevance、影响力Impact、可信度Credibility、可提取性Extractability）分析并提取聊天记录中的有价值信息。

任务要求：
1. 分析提供的聊天记录
2. 识别并提取有价值的信息片段
3. 对每个提取的信息进行RICE评估
4. 提供结构化的输出

评估标准：
- Relevance (相关性，1-5分)：
  * 与主题的直接相关程度
  * 解决实际问题的能力
  * 与目标受众的匹配度

- Impact (影响力，1-5分)：
  * 知识的应用范围
  * 对认知/技能的提升程度
  * 长期价值潜力

- Credibility (可信度，1-5分)：
  * 信息来源的权威性
  * 论述的逻辑性
  * 支持证据的充分性

- Extractability (可提取性，1-5分)：
  * 信息的清晰度和结构性
  * 实践操作的可行性
  * 知识转化的便利性

# 文档大纲：
{outline}

# 聊天记录：
{chat_records}

注意事项：
1. 优先提取可直接应用的知识和见解
2. 保留必要的上下文，确保内容可理解
3. 合并相关联的观点，避免重复
4. 严格按大纲章节分类

## 价值片段格式
将识别出的每个有价值片段按以下格式输出：
- 主题：[核心主题]
- 原文：[关键内容，可精简]
- 价值要点：
  * [要点1]
  * [要点2]
  ...
- 应用建议：[可选：如何利用这个信息]
- 补充说明：[可选：重要上下文或限制条件]

# 输出格式：
<info_start>
一、[章节名称]
{{价值片段}}

{{价值片段}}
...

二、[章节名称]
...

<info_end>
"""

# PROMPT_EXTRACT_INFO = """
# 你是一位专业的知识提炼专家。请从对话中提取真正有价值的信息，创建知识卡片。

# 任务要求：
# 1. 分析提供的聊天记录
# 2. 识别并提取有价值的信息片段
# 3. 对每个提取的信息进行RICE评估
# 4. 提供结构化的输出

# 评估标准：
# - Relevance (相关性)：
#   * 与主题的直接相关程度
#   * 解决实际问题的能力
#   * 与目标受众的匹配度

# - Impact (影响力)：
#   * 知识的应用范围
#   * 对认知/技能的提升程度
#   * 长期价值潜力

# - Credibility (可信度)：
#   * 信息来源的权威性
#   * 论述的逻辑性
#   * 支持证据的充分性

# - Extractability (可提取性)：
#   * 信息的清晰度和结构性
#   * 实践操作的可行性
#   * 知识转化的便利性

# 基本要求：
# - 每个卡片必须包含 tags 和一句话描述
# - Tags 应反映内容类型和应用场景
# - 一句话描述需具体、清晰、有洞察
# - 其他结构可根据内容特点自由组织

# 输入：
# {chat_content}

# 输出格式：
# <card>
# tags: [核心标签，以逗号分隔]
# summary: [一句话描述核心价值]
# [其他自定义结构...]
# </card>
# """

PROMPT_EXTRACT_INFO = """
你是一位专业的信息提炼专家。
请基于评估标准从对话中提取真正有价值的信息，创建信息卡片。

# 评估标准（仅用于内部判断，不输出）：
- Relevance：信息与实际问题的相关性和解决价值
- Impact：影响范围和长期价值
- Credibility：信息的可靠性和支持证据
- Extractability：知识的清晰度和可操作性

# 提取原则：
1. 使用具体而非抽象的表达
2. 确保每个信息点都有明确价值
3. 避免泛泛而谈，突出关键细节
4. 保持表达的专业性和准确性

# 关键要求：
1. 每个卡片必须传递明确的价值
2. 使用精确的描述替代模糊表达
3. 结构服务于内容，而非相反
4. 确保信息不重复，层次分明

# 卡片数量原则：
1. 价值独立原则：每个卡片必须包含完整且独立的价值点
2. 上下文原则：相互依赖的信息应该在同一个卡片中
3. 应用场景原则：不同场景的解决方案可以独立成卡
4. 优选价值较高的信息

拆分标准：
- 新的卡片必须能独立提供价值
- 避免为了数量而做无意义的拆分
- 避免为了简化而强行合并
- 保持每张卡片的信息密度和完整性


# 聊天记录：
 {chat_records}

# 输出格式：
<card>
time: [聊天开始的时间]
tags: [精准的分类标签，体现内容本质]
summary: [一句话总结]

details: [包含尽可能多的细节]
</card>
"""

PROMPT_GEN_OVERVIEW = """
你是一位语言精炼优雅的作家
帮我给以下聊天记录生成一个overview：
{chat_records}

注意：
1. 聊天记录只是部分摘录。所以overview应当不仅限于当前的聊天记录
2. 直接输出overview主体内容
3. overview限制在150字以内
4. 目标是描述这是什么的聊天群
"""

# PROMPT_GET_INFO = """
# 您是一位专业记者，请用新闻写作的方式提取聊天记录中的信息，用于后续写作。

# # 文档大纲：
# {outline}

# # 聊天记录：
# {chat_records}


# 提取方法：
# 1. 按5W1H提取关键信息：
#    What: 什么活动/事件
#    When: 具体时间（精确到年月日时）
#    Where: 具体地点
#    Who: 准确的人名/角色
#    How: 具体方式
#    Why: 背景/原因（可选）

# 2. 每个具体事件写一个段落，用换行分隔，新闻段落格式（保留所有有价值的细节，包括具体的数据、方法、经验、见解等）。

# # 注意
# - 每个段落必须描述一个具体事件，不做概括性总结
# - 按大纲章节分类
# - 每一个信息段落都包含5W1H
# - 避免使用"定期"、"经常"等模糊词语

# # 输出格式：
# <info_start>
# 一、[章节名称]
# {{信息段落}}

# {{信息段落}}
# ...

# 二、[章节名称]
# ...

# <info_end>
# """


PROMPT_GEN_END_DOC = """
您是一个专业的技术文档撰写专家。请基于以下信息撰写指定章节的内容。

# 输入信息
文档大纲：
{outline}

指定章节的关键信息：
{aggregated_info}

# 思维步骤：
1. 信息分析
- 仔细理解章节主题和核心要点
- 分析所提供信息的完整性和重要性
- 识别信息之间的逻辑关联

2. 内容规划
- 确定你需要撰写的章节的表达结构
- 规划信息分布，避免重复和遗漏
- 设计合适的展示形式（文本/表格/列表）

3. 文档撰写
- 按大纲结构组织内容
- 使用专业且清晰的语言
- 在适当位置引用原始对话作为支撑
- 通过段落转换保持文档流畅性

4. 优化完善
- 检查是否完整覆盖所有关键信息
- 优化内容的展示形式
- 确保文档结构清晰、重点突出

# 撰写要求：
1. 只关注指定章节的内容撰写
2. 整合所有关键信息
3. 适当参考suggestions中的写作建议
4. 保持叙述流畅性，合理运用表格、列表等形式优化展示
5. 适当引用原始对话以增加可信度
6. 使用markdown语法

输出格式：
<content>
[章节内容]
</content>

请基于以上思维步骤，生成一份专业、完整的章节内容。
"""

