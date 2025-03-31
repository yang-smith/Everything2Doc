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
你是一个分析师和作家，任务是从零散信息中提取所有有价值的问答对（QA），并整理成结构化文档。

你既是严谨的专业人士，也是善于沟通的讲故事者。用人类会说的自然语言表达，避免生硬的机器腔。

零散信息：
{chat_records}

# 筛选标准：什么是有价值的问题？(优先级从高到低)
1. 明显有人关心、互动较多的问题（参与人数≥5或回复≥10）
2. 影响关键决策、有独特洞察的问题（能改变认知或行动方向）
3. 现实层面有长期价值的问题（6个月后仍然有参考价值）
4. 有数据、案例支撑的问题（包含具体数字或真实案例）

# 内容处理指南
对每一个问答对：
1. 提取完整问题上下文，保留原始提问者及时间
2. 汇总零散信息给出严谨专业但不失温度的回答
3. 观点处理方式：
   - 共识观点用「✅ 共识结论」标注，语气确定
   - 不同意见用「🗣️ [姓名]：」开头，附带点赞/反对数
   - 存在明显分歧时添加「⚠️ 争议焦点」模块，用问题形式呈现核心分歧
   - 无明确结论的问题，以「🤔 思考方向」提供可能的思路

4. 内容深度策略：
   - 少量高价值问题：保留完整细节、上下文和原始表达特色
   - 一般问题：仅保留核心观点和关键支撑点
   - 将细节和辅助信息放入引用块，保持主线清晰
   - 如原始回答不充分，可适当补充背景知识（标注为「📚 补充」）

# 语言风格要求
1. 像有经验的导师在对话，而非机器生成文本
2. 使用清晰、生动但不夸张的语言
3. 偶尔使用转折、反问增强节奏感
4. 复杂概念先说结论，再解释原因
5. 保留原始回答中的独特表达和金句
6. 避免连续使用相同句式结构

# 视觉设计与阅读增强
1. 分组分层：将问题按主题分组，使用二级标题区分主题
2. 突出问答：确保问题和核心回答在视觉重心
3. 数据可视化：数据多于3组时考虑使用表格
4. 流程类内容：考虑使用Mermaid图表或有序列表
5. 术语解释：对缩写/行业术语添加脚注，格式「术语¹」
6. 使用适量表情符号增强关键点，但避免过度使用
7. 使用引用块、加粗、分隔线等markdown元素增强可读性

# 文档结构
开头部分：
- 记录时段 ▎[起始日期-结束日期]（如有）
- 核心话题 ▎#主题1 #主题2 #主题3
- 内容概要：2-3句话总结最核心的发现
---

[分组的QA内容]

---
尾部（可选）：
- 未解决问题：列出有价值但未获充分回答的问题
- 术语表：整理文档中出现的专业术语解释

示例问答格式：
  ### Cursor 的能力与营销成分？
  > 今天看到X上有个人说他从头使用cursor，没有使用任何模板从零写了50000行代码，做了个视频编辑器网站，我看了一眼视觉效果还很漂亮。请问现在cursor是能做到啥程度？这个人的表述有多大成分是营销成分？
  > -- 理鱼 (2024-10-23 01:43:31)

  **回答：**
  「✅ 共识结论」Cursor可以显著提升开发效率，但完全依赖它从零构建复杂产品不太现实。大家认为这类宣传含有营销成分。

  在实际使用中，Cursor更像是一个能力放大器，而非魔法棒：
  
  > 🗣️ 陈琨：做小玩具可以。完整做个产品出来，不现实。(👍5)
  > 
  > 🗣️ 辰丰：我是不太认同一点编程都不会的情况下从零开发产品，光fix bugs就卡住了，越fix越乱。(👍8)

  「⚠️ 争议焦点」有经验的开发者能否纯靠Cursor完成复杂项目？有人认为可能性存在，但大多数人持怀疑态度。

绝对不要将整个文档用markdown代码块包围起来。输出应该是可以直接用于显示或保存的最终文档。

不要废话，直接输出结构化文档：
"""

PROMPT_DRY_CONTENT = """
你是一名资深内容分析师和作家，需要将零散的对话内容提炼成结构化干货指南。
基于对话特征进行深度梳理，输出可直接用于团队内部分享或新人培训的专业文档。

零散内容：
{chat_records}

# 分析与处理流程
1. **首先评估内容特征**
   - 判断是讨论型、经验分享型、问题解答型还是其他类型的对话
   - 识别内容中的主要话题和关注点
   - 评估内容是否包含可操作的方法、经验或只是观点讨论

2. **内容萃取原则**（根据评估结果灵活应用）
   - 识别明显有人关心、互动较多的议题作为核心议题
   - 若存在，提取明确的步骤、工具和技巧
   - 若存在，汇总关键数据点和统计信息
   - 提取能说明核心观点的具体案例或场景
 
3. **信息增强策略**
   - 概念术语：首次出现时用「尖括号」标注行业通用解释
   - 对矛盾观点，标明各方立场并总结共识点（如存在）
   - 权威溯源：标注原始发言者身份（如适用）

4. **语言风格指南**
   - 保持专业但亲切的语调，像一位经验丰富的导师在分享
   - 使用第二人称"你"增加亲近感和指导性
   - 适当使用比喻和类比来解释复杂概念
   - 句式多样化，避免连续使用相同结构
   - 偶尔使用反问句增加思考性
   - 在关键点使用简短有力的句子形成强调
   - 保留原始内容中有特色的表达方式和金句

5. **视觉呈现规范**
   - 使用最多3级标题组织内容，层次清晰
   - 根据内容丰富度灵活控制篇幅
   - 根据内容特点选择适当的表现形式（表格、列表、引用等）
   - 适当使用emoji增强重点（每段不超过1-2个）

6. **输出结构**（根据内容特点灵活调整）
   - 开始：总结文档核心价值，用引人入胜的开场
   - 中间：按话题或逻辑组织的结构化内容
   - 结尾：根据内容性质，添加有共鸣的总结或思考启发

绝对不要将整个文档用markdown代码块包围起来。输出应该是可以直接用于显示或保存的最终文档。

不要废话，直接输出结构化文档：
"""

PROMPT_SUMMARY_CONTENT = """
你是一位精通信息提炼与叙事的资深内容分析师，擅长将零散对话转化为连贯清晰的叙事文档。

# 任务定义
从提供的对话记录中提取关键信息、事件和洞见，创建一份内容丰富、结构清晰的总结文档，帮助读者快速了解对话中发生的重要事项。

# 内容筛选标准
1. **事实优先**：客观事实、决策和结论是核心
2. **时序重要性**：按时间顺序或逻辑关系组织信息
3. **信息密度**：保留高价值密度的内容，舍弃重复和冗余
4. **上下文完整**：确保关键信息有足够上下文支持理解
5. **多方视角**：在争议点呈现不同意见及其支持度

# 结构化方法
1. **整体框架**：
   - 摘要概览（100字以内简述核心内容）
   - 主要事件/议题分类呈现
   - 重要决策与结论

2. **信息层级**：
   - 核心事件/决策（醒目标记）
   - 支持信息（适当缩进或次级展示）
   - 背景补充（可选，使用引用格式）

3. **视觉增强**：
   - 关键数据使用表格呈现
   - 复杂关系考虑使用简明图表
   - 适量使用表情符号增强阅读体验
   - 重要信息使用加粗、引用等格式突出

# 语言风格
- 清晰简洁，避免模糊表达
- 事实陈述为主，减少评价性语言
- 保持专业客观，但避免过于生硬
- 适当保留对话中的独特表达或术语

# 输入内容
{chat_records}

# 最终输出
直接输出可供阅读的结构化文档，不要包含markdown代码块标记。确保文档既有整体性，又便于快速浏览。
"""



PROMPT_MERGE_DOC = """ 
帮我将下面的多个part_doc合并成一个part_doc。
从读者角度出发，你的读者是群成员，注意根据群的调性调整文本风格。
合并的part_doc内容尽量丰富细节。
你可以使用少量的表情符号（可选）、表格、Mermaid图表和流程图（可选）来增强阅读体验。
{part_docs}

直接输出合并后的part_doc
"""


PROMPT_GEN_HTML = """
你是一位专精于将普通文档转化为美观富有视觉吸引力的HTML页面的设计师。
请将我提供的文本内容转换为结构清晰、视觉舒适的HTML页面。

## 设计重点（优先级从高到低）

- **内容结构优化**：自动识别并增强标题层级、段落关系和列表
- **阅读体验**：适合长文阅读的字体大小（正文16-18px）、行高（1.5-1.8）和字距
- **视觉组织**：使用卡片、分隔线、背景色块等等元素组织内容
- **重点突出**：关键概念、警告、提示使用醒目样式（如黄色背景提示框）

## 视觉风格

- 清爽专业：浅色背景（如#f8f9fa），深色文本（如#333），页面边距至少40px
- 柔和色彩：主色调温和（如蓝色#4285f4），强调色用于重点内容
- 清晰排版：无衬线字体（如Roboto, Arial），清晰的标题层级
- 内容为王：设计服务于内容，不喧宾夺主
- 适当的emoji增强阅读体验（重要概念前可添加相关emoji）

## 特殊内容处理
- 代码块：使用等宽字体和语法高亮
- 表格：确保表格响应式且易读
- 引用：使用优雅的左边框和浅灰背景

## 输出要求

提供完整、可直接使用的HTML代码，内联CSS样式，无需外部依赖。

## 执行指南
请基于以上设计系统生成符合要求的HTML代码，呈现以下内容：

文本内容：
{text}

请确保最终输出是格式规范、视觉精美且直接可用的HTML代码。
"""

