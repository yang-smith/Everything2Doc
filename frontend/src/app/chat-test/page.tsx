"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { toPng } from 'html-to-image';
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { api } from '@/lib/api';

// --- Classification Setup ---
const CONTENT_TYPES = {
  FORMAL_LONG: '长的正经内容',
  CHAT_LOG: '聊天记录',
  SCATTERED: '挺多的零散内容',
  OTHER: '其他'
} as const;

type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

// Define the classification prompt structure
const getClassificationPrompt = (text: string): string => `
请判断以下输入内容的类型，从以下几种类型中选择最符合的一个：
1.  "${CONTENT_TYPES.FORMAL_LONG}": 内容结构完整、主题明确、篇幅较长，像文章、报告、文档等。
2.  "${CONTENT_TYPES.CHAT_LOG}": 包含明显的对话标记（如说话人姓名、时间戳、冒号分隔等），内容是多人或双人对话形式。
3.  "${CONTENT_TYPES.SCATTERED}": 包含多个不连续的、主题可能分散的短文本片段、列表项、想法点等，整体缺乏连贯长文结构。
4.  "${CONTENT_TYPES.OTHER}": 不属于以上任何一种，或者难以判断。

**请只返回分类名称，例如直接返回 "${CONTENT_TYPES.FORMAL_LONG}" 或 "${CONTENT_TYPES.CHAT_LOG}"。不要添加任何额外的解释或文字。**

# 输入内容 (仅为部分开头内容):
${text}

# 输出分类名称:
`;
// --- End Classification Setup ---

export default function ChatTestPage() {
  const [inputText, setInputText] = useState<string>("");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const htmlDisplayRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [classifiedType, setClassifiedType] = useState<ContentType | null>(null);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);


  const handleGenerateHtml = async () => {
    if (!inputText.trim()) {
      toast({
        title: "输入为空",
        description: "请输入内容。",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsClassifying(true); // Start classifying
    setError(null);
    setGeneratedHtml(null);
    setClassifiedType(null); // Reset previous classification

    let currentClassification: ContentType | null = null;
    // Define the hardcoded model for HTML generation
    const htmlGenerationModel = 'google/gemini-2.5-flash-preview'; // Hardcoded model for Document2HTML

    try {
      // --- Step 1: Classify Content using api.chat ---
      toast({ title: "正在分析内容类型..." });

      // Extract first 50 lines for classification
      const lines = inputText.split('\n');
      const textForClassification = lines.slice(0, 50).join('\n');

      const classificationPrompt = getClassificationPrompt(textForClassification); // Use truncated text
      // Use a fast model suitable for classification
      const classificationModel = 'google/gemini-2.0-flash-001'; // Use updated ID without prefix
      const classificationResponse = await api.chat(classificationPrompt, classificationModel);

      // Extract and validate the classification result
      const rawClassification = classificationResponse.message.trim();
      if (Object.values(CONTENT_TYPES).includes(rawClassification as any)) {
          currentClassification = rawClassification as ContentType;
      } else {
          console.warn(`Received unexpected classification: "${rawClassification}". Falling back to '其他'.`);
          const lowerCaseResult = rawClassification.toLowerCase();
          if (lowerCaseResult.includes(CONTENT_TYPES.CHAT_LOG.toLowerCase())) {
              currentClassification = CONTENT_TYPES.CHAT_LOG;
          } else if (lowerCaseResult.includes(CONTENT_TYPES.FORMAL_LONG.toLowerCase())) {
              currentClassification = CONTENT_TYPES.FORMAL_LONG;
          } else if (lowerCaseResult.includes(CONTENT_TYPES.SCATTERED.toLowerCase())) {
              currentClassification = CONTENT_TYPES.SCATTERED;
          } else {
              currentClassification = CONTENT_TYPES.OTHER;
          }
      }

      setClassifiedType(currentClassification);
      setIsClassifying(false); // End classifying

      toast({ title: `内容类型: ${currentClassification}. 开始使用 ${htmlGenerationModel} 生成网页...` });

      // --- Step 2: Generate HTML (use FULL inputText and hardcoded model) ---
      console.log(`Content classified as: ${currentClassification}. Generating HTML with ${htmlGenerationModel}`);

      // Use the hardcoded model for HTML generation and the FULL input text
      const htmlGenerationResponse = await api.Document2HTML(inputText, htmlGenerationModel); // Pass full inputText and hardcoded model
      console.log("HTML Generation API Response:", htmlGenerationResponse);
      setGeneratedHtml(htmlGenerationResponse.result);

    } catch (err) {
      console.error("Error during process:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      let detailedError = errorMessage;
      if ((err as any)?.response?.data?.error?.message) {
          detailedError = (err as any).response.data.error.message;
      } else if ((err as any)?.detail) {
          detailedError = (err as any).detail;
      }

      setError(detailedError);
      toast({
        title: isClassifying ? "分析类型失败" : "生成网页失败",
        description: detailedError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsClassifying(false);
    }
  };

  const handleExportImage = useCallback(async () => {
    if (!htmlDisplayRef.current || isExporting) {
       if (!htmlDisplayRef.current) {
          toast({
             title: "导出失败",
             description: "无法找到要导出的内容元素。",
             variant: "destructive",
          });
       }
      return;
    }

    setIsExporting(true);
    const targetElement = htmlDisplayRef.current;

    toast({
      title: "准备导出图片",
      description: "请稍候，正在渲染内容...",
    });

    try {
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 500)));

      console.log("Attempting to capture element:", targetElement);

      const dataUrl = await toPng(targetElement, {
         pixelRatio: 2,
         backgroundColor: '#ffffff',
      });

      console.log("Image capture successful, creating download link.");

      const link = document.createElement('a');
      link.download = `generated-content-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "导出成功",
        description: "图片已开始下载",
        duration: 3000,
      });
    } catch (error) {
      console.error('图片导出失败:', error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "未知错误，请检查控制台获取详情。",
        variant: "destructive",
      });
    } finally {
       setIsExporting(false);
    }
  }, [isExporting]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen p-4 gap-4 bg-background"
    >
      <h1 className="text-2xl font-semibold">AI Webpage Generator Test</h1>

      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="输入你的内容，AI会尝试将其转换为网页..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={6}
          className="resize-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between gap-2 mt-2"> {/* Use justify-between */}
           {/* Button is now the only item on the left */}
           <Button onClick={handleGenerateHtml} disabled={isLoading || !inputText.trim()}>
             {isLoading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 {isClassifying ? "正在分析..." : "正在生成..."}
               </>
             ) : (
               "分析并生成网页"
             )}
           </Button>

            {/* Display Classification Result on the right */}
            {classifiedType && !isLoading && (
               <span className="text-sm text-muted-foreground">类型: {classifiedType}</span>
            )}
        </div>
      </div>

      <div className="flex-1 border rounded-md overflow-auto p-4 bg-muted/20 relative min-h-[300px]">
        {isLoading && !generatedHtml && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <span className="ml-2 text-primary">{isClassifying ? "正在分析内容类型..." : "正在生成HTML..."}</span> {/* Dynamic loading text in overlay */}
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-center font-semibold">处理出错</p> {/* Generic error title */}
            <p className="text-center text-sm">{error}</p> {/* Display potentially detailed error */}
          </div>
        )}
        {!isLoading && !error && !generatedHtml && (
           <div className="flex items-center justify-center h-full text-muted-foreground">
             <p>生成的网页内容将显示在这里</p>
           </div>
        )}
        {generatedHtml && (
          <div ref={htmlDisplayRef} key={generatedHtml} dangerouslySetInnerHTML={{ __html: generatedHtml }} />
        )}
        {generatedHtml && !isLoading && (
             <Button
               variant="outline"
               size="sm"
               onClick={handleExportImage}
               className="absolute top-2 right-2 gap-1 z-20"
               disabled={isExporting}
              >
               {isExporting ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   导出中...
                 </>
               ) : (
                 <>
                   <ImageIcon className="h-4 w-4" />
                   导出图片
                 </>
               )}
             </Button>
        )}
      </div>
    </motion.div>
  );
}
