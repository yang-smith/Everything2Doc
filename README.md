# Everything2Doc
turn chat records to docs
各种群聊的聊天记录里面包含着很多有价值的信息，但是这些信息是碎片化的，难以被利用。
该工具可以将群聊的聊天记录转换为结构化的文档，方便后续的利用。

技术方式
1. AI对话使用者，了解使用者的需求
2. 使用者提供群聊的聊天记录
3. AI根据聊天记录状况和使用者需求，生成一个预备生成文档的结构
4. 使用者确认文档结构
5. AI根据文档结构，拆分任务，并分配给不同的AI
6. 各个AI根据任务要求，完成任务
7. 各个AI完成任务后，将结果返回给组长AI
8. 组长AI根据各个AI的结果，生成最终的文档

技术栈
使用nextjs作为前端，使用openai的api作为AI对话的api，python作为后端
以网页的形式
