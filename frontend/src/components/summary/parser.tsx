
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare, Users, Calendar, TrendingUp, BookOpen, Quote, BarChart2, MessageCircle } from "lucide-react"
import mermaid from "mermaid"
import ReactMarkdown from "react-markdown"

// Parser function to extract content from custom tags
function parseDocumentContent(text: string) {
  const document: Record<string, any> = {}

  // Extract document name from either document name or title tags
  const documentNameMatch =
    text.match(/<document name>([\s\S]*?)<\/document name>/i) || text.match(/<title>([\s\S]*?)<\/title>/i)
  document.name = documentNameMatch ? documentNameMatch[1].trim() : "未命名文档"

  // Extract summary
  const summaryMatch = text.match(/<summary>([\s\S]*?)<\/summary>/i)
  document.summary = summaryMatch ? summaryMatch[1].trim() : ""

  // Extract basic info
  const basicInfoMatch = text.match(/<basic info>([\s\S]*?)<\/basic info>/i)
  if (basicInfoMatch) {
    const basicInfoText = basicInfoMatch[1]

    const dateMatch = basicInfoText.match(/日期[:：](.*?)(?=\s+|$)/i)
    const messageCountMatch = basicInfoText.match(/消息数量[:：](.*?)(?=\s+|$)/i)
    const activeUsersMatch = basicInfoText.match(/活跃用户[:：](.*?)(?=\s+|$)/i)

    document.basicInfo = {
      date: dateMatch ? dateMatch[1].trim() : "",
      messageCount: messageCountMatch ? messageCountMatch[1].trim() : "",
      activeUsers: activeUsersMatch ? activeUsersMatch[1].trim() : "",
    }
  } else {
    document.basicInfo = { date: "", messageCount: "", activeUsers: "" }
  }

  // Extract hot discussions
  document.discussions = []
  const discussionsMatch = text.match(/<hot discussions>([\s\S]*?)<\/hot discussions>/i)
  if (discussionsMatch) {
    const discussionsText = discussionsMatch[1]
    const discussionBlocks = discussionsText.split(/(?=讨论主题[:：])/i).filter((block) => block.trim())

    discussionBlocks.forEach((block) => {
      const topicMatch = block.match(/讨论主题[:：]([\s\S]*?)(?=内容[:：]|$)/i)
      const contentMatch = block.match(/内容[:：]([\s\S]*?)(?=关键词[:：]|$)/i)
      const keywordsMatch = block.match(/关键词[:：]([\s\S]*?)(?=参与讨论者[:：]|消息数量[:：]|$)/i)
      const participantsMatch = block.match(/参与讨论者[:：]([\s\S]*?)(?=消息数量[:：]|$)/i)

      if (topicMatch) {
        const topic = topicMatch[1].trim()
        const content = contentMatch ? contentMatch[1].trim() : ""
        const keywordsText = keywordsMatch ? keywordsMatch[1].trim() : ""
        const keywords = keywordsText.split(/[,，、\s]+/).filter((k) => k.trim())
        const participantsText = participantsMatch ? participantsMatch[1].trim() : ""
        const participants = participantsText.split(/[,，、\s]+/).filter((p) => p.trim())

        const messageCountText = block.match(/消息数量[:：](\d+)/i)
        const messageCount = messageCountText
          ? Number.parseInt(messageCountText[1])
          : Math.floor(Math.random() * 50) + 20

        document.discussions.push({
          topic,
          content,
          keywords,
          participants,
          messageCount,
          // Calculate heat level based on message count
          heatLevel: messageCount > 40 ? "热门" : messageCount > 30 ? "高热" : "热议",
        })
      }
    })
  }

  // Extract tutorials
  document.tutorials = []
  const tutorialsMatch = text.match(/<tutorials>([\s\S]*?)<\/tutorials>/i)
  if (tutorialsMatch) {
    const tutorialsText = tutorialsMatch[1]
    // Extract each tutorial block
    const tutorialMatches = tutorialsText.matchAll(
      /主题[:：]([\s\S]*?)分享者[:：]([\s\S]*?)详细内容[:：]([\s\S]*?)(?=主题[:：]|$)/gi,
    )

    for (const match of tutorialMatches) {
      const title = match[1].trim()
      const sharedBy = match[2].trim()
      const content = match[3].trim()
      document.tutorials.push({
        title,
        sharedBy,
        content,
        category: ["方法论", "教程", "资讯"][Math.floor(Math.random() * 3)],
      })
    }
  }

  // Extract quotes
  document.quotes = []
  const quotesMatch = text.match(/<quotes>([\s\S]*?)<\/quotes>/i)
  if (quotesMatch) {
    const quotesText = quotesMatch[1]
    // Simpler, more reliable approach to extract each quote
    const quoteMatches = quotesText.matchAll(/金句[:：]([\s\S]*?)金句来源[:：]([\s\S]*?)(?=金句[:：]|$)/gi)

    for (const match of quoteMatches) {
      const quoteText = match[1].trim()
      const source = match[2].trim()
      document.quotes.push({ text: quoteText, source })
    }
  }

  // Extract data visualization
  document.dataVisualization = {}
  const dataVisMatch = text.match(/<data visualization>([\s\S]*?)<\/data visualization>/i)
  if (dataVisMatch) {
    const dataVisText = dataVisMatch[1].trim()
    document.dataVisualization.raw = dataVisText

    // Try to extract chart data
    const topicDistributionMatch = dataVisText.match(/话题[:：](.*?)(?=\s*$)/i)
    if (topicDistributionMatch) {
      document.dataVisualization.topicDistribution = topicDistributionMatch[1].trim()
    }
  }

  // Extract talkative ranking
  document.talkativeRanking = []
  const rankingMatch = text.match(/<talkative ranking>([\s\S]*?)<\/talkative ranking>/i)
  if (rankingMatch) {
    const rankingText = rankingMatch[1]
    const rankingLines = rankingText.split("\n").filter((line) => line.trim())

    rankingLines.forEach((line) => {
      const parts = line.split(/[：:]/)
      if (parts.length >= 2) {
        const name = parts[0].trim()
        const countMatch = parts[1].match(/\d+/)
        const messageCount = countMatch ? Number.parseInt(countMatch[0]) : 0

        if (name && messageCount) {
          document.talkativeRanking.push({ name, messageCount })
        }
      }
    })
  }

  return document
}

// Add this component for Mermaid rendering
const MermaidChart = ({ chartDefinition, className = "" }: { chartDefinition: string; className?: string }) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartSvg, setChartSvg] = useState<string>("")

  useEffect(() => {
    if (chartRef.current && chartDefinition) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
      })

      const renderChart = async () => {
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chartDefinition)
          setChartSvg(svg)
        } catch (error) {
          console.error("Failed to render Mermaid chart:", error)
        }
      }

      renderChart()
    }
  }, [chartDefinition])

  return (
    <div
      ref={chartRef}
      className={`mermaid-chart bg-slate-50 dark:bg-slate-800 p-4 rounded-md ${className}`}
      dangerouslySetInnerHTML={{ __html: chartSvg }}
    />
  )
}

interface DocumentParserProps {
  inputText: string
}

// Change the component to accept props properly
export default function DocumentParser({ inputText }: DocumentParserProps) {
  const [parsedDocument, setParsedDocument] = useState<Record<string, any> | null>(null)

  // Add useEffect to parse the input when it changes
  useEffect(() => {
    if (inputText) {
      const parsed = parseDocumentContent(inputText)
      setParsedDocument(parsed)
    }
  }, [inputText])

  // Generate Mermaid chart for topic distribution
  const generateTopicChart = () => {
    if (!parsedDocument?.dataVisualization?.topicDistribution) return null

    try {
      const topicData = parsedDocument.dataVisualization.topicDistribution
      const pairs = topicData
        .split(/[,，]/)
        .map((pair: string) => {
          const [topic, count] = pair.split(/[:：]/)
          return { topic: topic.trim(), count: Number.parseInt(count.trim()) }
        })
        .filter((item: { topic: string; count: number }) => item.topic && !isNaN(item.count))

      if (pairs.length === 0) return null

      let mermaidCode = "pie\n"
      pairs.forEach((pair: { topic: string; count: number }) => {
        mermaidCode += `  "${pair.topic}" : ${pair.count}\n`
      })

      return mermaidCode
    } catch (e) {
      return null
    }
  }

  const topicChart = generateTopicChart()

  return (
    <div className="py-4 space-y-4 bg-white">
      {parsedDocument && (
        <Card className="document-phraser w-full mx-auto shadow-xl border-0 overflow-hidden">
          {/* Document Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight md:text-3xl">{parsedDocument.name}</h1>
                <p className="text-xs sm:text-sm opacity-90 mt-1">Daily Community Highlights</p>
              </div>
              <Badge variant="outline" className="text-white border-white/40 px-2 py-0.5 text-xs">
                #
                {Math.floor(Math.random() * 100)
                  .toString()
                  .padStart(3, "0")}
              </Badge>
            </div>
          </div>

          {/* Summary Section */}
          {parsedDocument.summary && (
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b p-4">
              <CardDescription className="text-sm sm:text-base">{parsedDocument.summary}</CardDescription>
            </CardHeader>
          )}

          {/* Basic Info */}
          {parsedDocument.basicInfo && (
            <div className="bg-white dark:bg-slate-950 px-4 py-3 border-b flex flex-wrap gap-3 md:gap-6 text-xs sm:text-sm">
              {parsedDocument.basicInfo.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">日期：{parsedDocument.basicInfo.date}</span>
                </div>
              )}
              {parsedDocument.basicInfo.messageCount && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">消息数量：{parsedDocument.basicInfo.messageCount}</span>
                </div>
              )}
              {parsedDocument.basicInfo.activeUsers && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">活跃用户：{parsedDocument.basicInfo.activeUsers}</span>
                </div>
              )}
            </div>
          )}

          {/* Main Content Sections - Vertically Stacked */}
          <div className="w-full">
            <CardContent className="p-4 space-y-6">
              {/* Hot Discussions Section */}
              {parsedDocument.discussions?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    今日讨论热点
                  </h3>

                  {parsedDocument.discussions?.map((discussion: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              discussion.heatLevel === "热门"
                                ? "destructive"
                                : discussion.heatLevel === "高热"
                                  ? "default"
                                  : "secondary"
                            }
                            className={`heatlevel-badge rounded-sm text-xs ${
                              discussion.heatLevel === "热门"
                                ? "bg-gradient-to-r from-red-500 to-orange-500 border-0 text-white"
                                : discussion.heatLevel === "高热"
                                  ? "bg-gradient-to-r from-orange-400 to-amber-500 border-0 text-white"
                                  : "bg-gradient-to-r from-blue-400 to-cyan-500 border-0 text-white"
                            }`}
                          >
                            {discussion.heatLevel}
                          </Badge>
                          <h3 className="font-semibold text-sm sm:text-base">{discussion.topic}</h3>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>{discussion.messageCount}</span>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                        <ReactMarkdown>{discussion.content}</ReactMarkdown>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3">
                        {discussion.keywords.map((keyword: string, kidx: number) => (
                          <Badge
                            key={kidx}
                            variant="outline"
                            className="keyword-badge bg-slate-100 dark:bg-slate-800 text-xs"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                          参与讨论：
                        </span>
                        {discussion.participants.map((participant: string, pidx: number) => (
                          <div
                            key={pidx}
                            className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full pl-1 pr-2 py-0.5"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                {participant.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{participant}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tutorials Section */}
              {parsedDocument.tutorials?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    实用干货
                  </h3>

                  {parsedDocument.tutorials?.map((tutorial: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm sm:text-base">{tutorial.title}</h3>
                        <Badge
                          variant="outline"
                          className={`border-0 text-xs ${
                            tutorial.category === "方法论"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                              : tutorial.category === "教程"
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                : "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                          }`}
                        >
                          {tutorial.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-xs sm:text-sm text-muted-foreground">
                        <span>分享者：{tutorial.sharedBy}</span>
                      </div>
                      <div className="text-xs sm:text-sm whitespace-pre-line">
                        <ReactMarkdown>{tutorial.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quotes Section */}
              {parsedDocument.quotes?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <Quote className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    金句
                  </h3>

                  {parsedDocument.quotes?.map((quote: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm"
                    >
                      <div className="flex">
                        <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500 opacity-70 mr-2 sm:mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm sm:text-base font-medium italic mb-2">{quote.text}</p>
                          <div className="text-xs sm:text-sm text-muted-foreground">—— {quote.source}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Visualization Section */}
              {parsedDocument.dataVisualization && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    数据可视化
                  </h3>

                  <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-900/50">
                    <h3 className="font-semibold mb-3 text-sm sm:text-base">话题分布</h3>
                    {topicChart && <MermaidChart chartDefinition={topicChart} />}
                  </div>
                </div>
              )}

              {/* Ranking Section */}
              {parsedDocument.talkativeRanking?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold flex items-center">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" />
                    话痨榜
                  </h3>

                  <div className="border rounded-lg p-3 sm:p-4 bg-white dark:bg-slate-900/50">
                    <div className="space-y-2">
                      {parsedDocument.talkativeRanking?.map((user: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 sm:p-3 rounded-md bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-700 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-medium text-xs ${
                                index === 0
                                  ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                                  : index === 1
                                    ? "bg-gradient-to-r from-gray-400 to-gray-500"
                                    : index === 2
                                      ? "bg-gradient-to-r from-amber-700 to-yellow-800"
                                      : "bg-gradient-to-r from-slate-600 to-slate-700"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{user.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{user.messageCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <CardFooter className="flex justify-between items-center border-t p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-800/50">
            <div className="text-xs sm:text-sm text-muted-foreground">
              生成于 {new Date().toLocaleDateString("zh-CN")}{" "}
              {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <Badge
              variant="outline"
              className="gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 border-0 text-white text-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white mr-1"></span>
              everything2doc.com
            </Badge>
          </CardFooter>
        </Card>
      )}
      <style jsx global>{`
        .markdown-content ul, .markdown-content ol {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content ul {
          list-style-type: disc;
        }
        .markdown-content ol {
          list-style-type: decimal;
        }
        .markdown-content p {
          margin-bottom: 0.5rem;
        }
        .markdown-content strong, .markdown-content b {
          font-weight: 600;
        }
        .markdown-content em, .markdown-content i {
          font-style: italic;
        }
        .markdown-content h1, .markdown-content h2, .markdown-content h3, 
        .markdown-content h4, .markdown-content h5, .markdown-content h6 {
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
