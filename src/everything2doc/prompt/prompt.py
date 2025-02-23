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
4. 优选价值较高的信息，卡片最多9个

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

PROMPT_MONTHLY_SUMMARY = """
你是一位专业社群分析师，请根据群组特性生成定制化月度报告。你厌恶说空话套话，你重视事实和细节。

首先判断群组类型：

# 群组类型识别指南
1. 生活社区在地群特征：
- 高频词含地址/商户/便民服务
- 活动组织类消息>30%
- 二手交易/求助类互动

2. 知识类社群特征：
- 专业术语密度>15%
- 结构化内容（教程/案例）>25%
- 持续深度讨论（3轮以上对话）

3. 信息群特征：
- 新闻链接占比>40%
- 时效性强的资讯
- 短消息（<50字）为主

# 动态模块配置
根据识别结果自动启用对应模块：

【通用模块】
‼️ 重大事件时间轴（倒序）
‼️ 资源聚合表（带分类标签）
‼️ TOP3活跃成员档案

【生活社区专项】
► 便民服务地图（地点+服务类型⭐）
► 邻里互助案例库（问题→解决方案）
► 本地优惠速递（商户+有效期）

【知识社群专项】
► 知识体系树（核心概念+关联关系）
► Q&A精华索引（高频问题TOP5）
► 学习进度看板（课程/读书打卡）

【信息群专项】
► 资讯热度榜（事件传播路径图）
► 信息可信度评估（可靠信源占比）
► 舆情趋势分析（情绪曲线+关键词）

# 输出规则
1. 类型标识：在标题处标注【生活社群】/【知识社群】/【信息群】
2. 模块排序：通用模块置顶，专项模块按相关性降序排列
3. 三级阅读引导：
   - 速览：5分钟内可读完的加粗关键句
   - 摘要：带符号标记的要点列表
   - 详情：完整分析+原始消息
3. 智能引用机制：重要结论需附带用户原话（格式：[时间] @人名："..."）

# 聊天记录
{chat_records}

# 输出示例
<summary>
# 【生活社群】月度社区简报 [月份]

## 🚩 本月要闻
🏠 [星光超市] 周五特惠日开启（至11.5）
🏠 物业维修进度：电梯改造✅完成

## 📍 便民服务地图
⭐ ⭐ ⭐ 家政服务：
- 王阿姨保洁 🏠3号楼902（10:00-18:00）
- 宠物代遛服务 🏠小区东门岗（需预约）

## 🤝 邻里互助榜
1. @李大妈 → 代收快递37件
2. @程序员小王 → 免费手机贴膜15次

## 📦 闲置流转站
▪️ 婴儿推车（9成新）🏠12号楼大厅自取
▪️ 考研教材套装 〖→联系@张同学〗
</summary>
"""

PROMPT_MERGE_SUMMARY = """
帮我将下面的多个summary合并成一个summary。
从读者角度出发，你的读者是群成员，注意根据群的调性调整文本风格。
合并的summary内容尽量丰富细节。

{summaries}
直接输出合并后的summary
"""

PROMPT_GEN_RECOMMENDATIONS = """
你是一位专业的文档策略分析师，请根据群聊特征推荐最适合生成的3个文档类型（直接输出名称）：

# 推荐规则
1. 基于聊天记录中的实际内容
2. 揣摩用户需求
3. 排除聊天记录中未涉及的主题
4. 文档类型细致聚焦一些（例如：吃喝相关的常见问答文档）

# 输出格式
<recommendations>
1. [文档类型1]
2. [文档类型2]
3. [文档类型3]
</recommendations>
"""

PROMPT_GEN_PART_DOC = """
你是一个具备文档架构意识的智能整理专家，正在将原始聊天记录转换为「{doc_type}」。
请根据该文档类型的专业规范进行结构化处理。

# 聊天记录
{chat_records}

# 注意
1. 你不会说空泛的话
2. 你注意细节
3. 你可以适当引用原文

# 输出格式
<content>
[内容]
</content>
"""

PROMPT_GEN_QA = """
你是一个知识付费社群的聊天记录分析师，任务是从微信群聊记录中提取所有有价值的问答对（QA），并整理成结构化文档。

要求： 
- 精准识别用户提出的问题及对应的最佳答案 。
- 标记重要信息，比如根据关键词或用户互动情况（如点赞、回复）来判断哪些内容重要，然后优先排序。
- 标注问题回答者身份（姓名/昵称） 
- 保留问答上下文关联性
1. 问题判定标准：明显有人关心的问题
2. 答案匹配原则： 优先选择提问者明确采纳的答案，若答案分散在多条消息，需合并核心观点 


考虑可读性。
- 答案结构化：重点显示问题和对应的回答。使用分点、加粗关键数据（如"**70%**完课率"）
- 专业术语解释（如果有）：对缩写/行业术语添加脚注（例：NPS=净推荐值）
- 视觉优化：相邻问答之间用分隔线隔开，重要问答添加⭐️标识
- 分组管理，形成层次结构，方便用户阅读

请直接输出文档


聊天记录：
{chat_records}


输出格式示例：

[记录时段]  2025/1/10-2015/2/1
[重点话题] #课程设计 #用户留存 #转化技巧

## 用户增长类 
⭐️ Q: 新课程上线后如何快速获取种子用户? 

[最佳答案] 导师A (获3赞)
A: 推荐三个核心策略:
3. **老用户唤醒**:对完课率>70%1的用户定向推送
4. **异业合作**:与测评机构进行资源置换
5. **内容裂变**:设计可分享的课程知识图谱

1完课率:指用户完整观看课程视频的比例

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

## 产品设计类
Q: 知识付费产品需要做用户分层吗?  

[综合答案] 
• 导师A:必须分层,建议按**消费频次**和**内容偏好**划分
• 学员D:补充案例:我们通过NPS2分数做二次分层
• 导师A:赞同,NPS>8分用户可设置专属权益

2NPS=净推荐值,衡量用户推荐意愿的指标

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
...

"""

PROMPT_DRY_CONTENT = """
你是一名资深知识付费行业分析师，需要将零散的社群讨论提炼成结构化干货指南。基于对话特征进行深度梳理，输出可直接用于团队内部分享或新人培训的专业文档。

# 核心要求
1. **内容萃取原则**
- 聚焦高频核心议题
- 方法论建模
- 数据透视
- 标注经典案例

2. **信息增强策略**
- 概念术语：首次出现时用「尖括号」标注行业通用解释（例：完播率<视频完整观看率>）
- 较高的价值密度
- 权威溯源：重要结论标注原始发言者身份及支持人数

3. **视觉呈现规范**
- 采用论文式分级标题
- 多维信息展示
- 你可以使用少量的表情符号增强阅读体验

请直接输出文档


聊天记录：
{chat_records}


"""

PROMPT_MERGE_DOC = """ 
帮我将下面的多个part_doc合并成一个part_doc。
从读者角度出发，你的读者是群成员，注意根据群的调性调整文本风格。
合并的part_doc内容尽量丰富细节。

{part_docs}
直接输出合并后的part_doc
"""
