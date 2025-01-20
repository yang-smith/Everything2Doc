import { ChatContent } from '@/components/cards/chat-content'
import { Timeline } from '@/components/cards/timeline'
import { RecommendedActions } from '@/components/cards/recommended-actions'
const chatData = [
  {
    date: 'Today',
    messages: [
      {
        id: '1',
        content: 'React Server Components represent a new paradigm in React development, allowing components to run exclusively on the server. This reduces bundle size and improves performance by moving heavy computation to the server side.',
        timestamp: '10:00',
        hasQuote: false
      },
      {
        id: '2',
        content: 'Here\'s a detailed walkthrough of Server Component implementation. Server Components can access backend resources directly, handle large dependencies, and keep sensitive data on the server.',
        timestamp: '10:15',
        hasQuote: true
      },
      {
        id: '3',
        content: 'Let\'s explore the data fetching patterns in React Server Components. We\'ll cover fetch, cache, and revalidation strategies for optimal performance.',
        timestamp: '10:30',
        hasQuote: false
      },
      {
        id: '4',
        content: 'Performance optimization is crucial. Here are some tips for optimizing Server Components, including proper caching strategies and bundle size reduction techniques.',
        timestamp: '10:45',
        hasQuote: false
      },
      {
        id: '5',
        content: 'Finally, let\'s look at some advanced patterns and real-world examples of React Server Components in production applications.',
        timestamp: '11:00',
        hasQuote: true
      }
    ]
  },
  {
    date: 'Yesterday',
    messages: [
      {
        id: '6',
        content: 'Introduction to React Server Components and their benefits in modern web development.',
        timestamp: '15:30',
        hasQuote: false
      }
    ]
  }
]

const timelineData = [
  {
    id: '1',
    timestamp: '2024-03-30T14:50:00',
    tags: ['Web3', 'DAO', '社区活动'],
    summary: '余村数字游民社区举办Web3和DAO主题分享会',
    details: [
      '活动时间：2024年3月30日下午2:50',
      '地点：乡音小酒馆（图书馆附近）',
      '主题：Web3、DAO和公共物品',
      '主讲人：Cikey、定慧和Slow，来自不同属性DAO的共创者和投资人',
      '活动提供免费软饮，参与者可以散步欣赏余村美景'
    ],
    supplement: '活动由姚姚组织，庆祝她来村8个月，参与者包括多位社区成员和Web3爱好者',
    category: 'concept' as const,
    type: 'major' as const
  },
  {
    id: '2',
    timestamp: '2024-03-30T15:15:00',
    tags: ['生活', '美食', '社区活动'],
    summary: '余村第一届美食节筹备会议',
    details: [
      '时间：4月15日周六',
      '地点：村委会会议室',
      '讨论内容：活动流程、场地安排、食材采购',
      '预计参与商家：10家本地特色小吃'
    ],
    supplement: '这是余村首次举办美食节，旨在促进社区交流和本地美食文化推广',
    category: 'concept' as const,
    type: 'major' as const
  },
  {
    id: '3',
    timestamp: '2024-03-30T15:30:00',
    tags: ['技术', '工作坊', '编程'],
    summary: 'Python编程工作坊系列活动启动',
    details: [
      '每周三晚上7点-9点',
      '地点：创客空间',
      '面向对象：编程初学者',
      '课程内容：Python基础、数据分析、网络爬虫',
      '讲师：社区内专业程序员志愿者'
    ],
    supplement: '工作坊采用实践教学方式，配备一对一辅导',
    category: 'concept' as const,
    type: 'major' as const
  },
  {
    id: '4',
    timestamp: '2024-03-30T15:45:00',
    tags: ['环保', '可持续发展', '社区建设'],
    summary: '余村垃圾分类新规实施情况讨论',
    details: [
      '第一阶段实施效果评估',
      '居民参与度统计：80%以上家庭参与',
      '存在问题：分类标准不清晰',
      '下一步计划：加强宣传教育'
    ],
    supplement: '环保志愿者团队将定期进行入户指导',
    category: 'concept' as const,
    type: 'major' as const
  },
  {
    id: '5',
    timestamp: '2024-03-30T16:00:00',
    tags: ['艺术', '展览', '文化活动'],
    summary: '余村艺术家作品展筹备工作',
    details: [
      '展览时间：5月1日-5月7日',
      '地点：文化中心展厅',
      '展出作品：油画、水彩、摄影、装置艺术',
      '特别活动：艺术家现场创作',
      '观众互动：艺术工作坊'
    ],
    supplement: '这是余村首次举办综合性艺术展，展现社区艺术家的创作力',
    category: 'concept' as const,
    type: 'major' as const
  }
]

const timelineSummary = {
  totalTime: '45分钟',
  messageCount: 12,
  description: '这是一份关于余村社区在地群聊天的聊天记录，大家主要在其中讨论活动等等'
}

export default function Page() {
  return (
    <>
      <div className="max-w-[55%] flex flex-col rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex-1 overflow-auto">
          <Timeline data={timelineData} summary={timelineSummary} />
        </div>
      </div>
      <div className="flex-1 min-w-0 flex flex-col rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
        <main className="flex-1 overflow-auto">
          <RecommendedActions/>
        </main>
      </div>
    </>
  )
}

