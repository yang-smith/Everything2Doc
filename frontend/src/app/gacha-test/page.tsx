"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Download,
  Sparkles,
  CoinsIcon,
  Copy,
  Leaf,
  Loader2,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Use Button from shadcn
import { Textarea } from "@/components/ui/textarea";
import { toPng } from 'html-to-image';
import { toast } from "@/hooks/use-toast";
import { api } from '@/lib/api';
import DocumentParser from '@/components/document-phraser'; // Import the DocumentParser
import AiPanel from "@/components/ai-panel";
import { GenHTMLPrompt, PROMPT_SUMMARY_CONTENT, PROMPT_GEN_IMAGE_PROMPT } from "@/lib/prompt";
import { generateImage } from "@/lib/openrouterService";

// --- Classification Setup (from ChatTestPage) ---
const CONTENT_TYPES = {
  FORMAL_LONG: '长的正经内容',
  CHAT_LOG: '聊天记录',
  SCATTERED: '挺多的零散内容',
  OTHER: '其他'
} as const;

type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

const getClassificationPrompt = (text: string): string => `
请判断以下输入内容的类型，从以下几种类型中选择最符合的一个：
1.  "${CONTENT_TYPES.FORMAL_LONG}": 内容结构完整、主题明确、篇幅较长（至少大于50字），像文章、报告、文档等。
2.  "${CONTENT_TYPES.CHAT_LOG}": 包含明显的对话标记（如说话人姓名、时间戳、冒号分隔等），内容是多人或双人对话形式。
3.  "${CONTENT_TYPES.SCATTERED}": 包含多个不连续的、主题可能分散的短文本片段、列表项、想法点等，整体缺乏连贯长文结构，内容量大于800字。
4.  "${CONTENT_TYPES.OTHER}": 不属于以上任何一种，或者难以判断。

**请只返回分类名称，例如直接返回 "${CONTENT_TYPES.FORMAL_LONG}" 或 "${CONTENT_TYPES.CHAT_LOG}"。不要添加任何额外的解释或文字。**

# 输入内容 (仅为部分开头内容):
${text}

# 输出分类名称:
`;
// --- End Classification Setup ---


// --- Gacha Machine Constants ---
const demandMessages = [
  "给我内容！快点！",
  "我需要更多内容！",
  "喂我内容！饿了！",
  "内容！内容！内容！",
  "不给内容我就生气了！",
  "我的肚子空空的，需要内容！",
];

// Define distinct moods for clarity
type RobotMood = "idle" | "happy" | "thinking" | "generating" | "sleeping" | "demanding" | "excited" | "error";

const robotExpressions: Record<RobotMood, string> = {
  idle: "(◕ᴗ◕)",
  happy: "(≧◡≦)", // On success
  thinking: "(⊙_☉)?", // Classifying
  generating: "(°ロ°) !", // Generating HTML
  sleeping: "(￣ᴗ￣)zzz", // Currently unused
  demanding: "(◕д◕)", // Needs input/coins or error occurred
  excited: "(☆▽☆)", // Coin insert / typing
  error: "(ಥ﹏ಥ)", // On error
};

const robotColors: Record<RobotMood, string> = {
  idle: "text-[#5C6B7A]", // Ghibli blue-gray
  happy: "text-[#7AA25C]", // Ghibli green
  thinking: "text-[#7AA25C]", // Ghibli green
  generating: "text-[#D68545]", // Ghibli orange
  sleeping: "text-[#5C6B7A]",
  demanding: "text-[#D68545]", // Ghibli orange
  excited: "text-[#D68545]", // Ghibli orange
  error: "text-destructive", // Use theme's destructive color
};

// Define processing phases
type ProcessingPhase = "idle" | "classifying" | "generating" | "complete" | "error";
// --- End Gacha Machine Constants ---


export default function GachaTestPage() {
  // --- State from ChatTestPage ---
  const [inputText, setInputText] = useState<string>("");
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClassifying, setIsClassifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const htmlDisplayRef = useRef<HTMLDivElement>(null); // Ref for standard HTML output
  const contentDisplayRef = useRef<HTMLDivElement>(null); // *** New Ref for the content area to capture ***
  const [isExporting, setIsExporting] = useState(false);
  const [classifiedType, setClassifiedType] = useState<ContentType | null>(null);
  const [parsedChatLogText, setParsedChatLogText] = useState<string | null>(null); // New state for parsed chat log text

  // --- State from GachaMachine ---
  const [coins, setCoins] = useState(3);
  const [robotMood, setRobotMood] = useState<RobotMood>("idle");
  const [coinAnimation, setCoinAnimation] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the input textarea (for focus)
  const [leafRotation, setLeafRotation] = useState(0);
  const [demandingMessage, setDemandingMessage] = useState("给我内容！");
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>("idle"); // Simplified phase tracking

  // --- Effects ---

  // Leaf rotation effect (from Gacha)
  useEffect(() => {
    const interval = setInterval(() => {
      setLeafRotation((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Focus textarea on mount & manage demanding messages (from Gacha, adapted)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    const messageInterval = setInterval(() => {
      // Only show demanding message if idle and randomly, or if actually demanding
      if (robotMood === "demanding" || (robotMood === 'idle' && Math.random() > 0.85)) {
        setDemandingMessage(demandMessages[Math.floor(Math.random() * demandMessages.length)]);
        // Temporarily set mood to demanding if it wasn't already
        if (robotMood !== 'demanding') {
           const currentMood = robotMood; // Store current mood before demanding
           setRobotMood("demanding");
           setTimeout(() => setRobotMood(currentMood), 2000); // Revert after a bit
        }
      }
    }, 7000); // Longer interval

    return () => clearInterval(messageInterval);
  }, [robotMood]); // Re-run if mood changes


  // Effect to map loading/error states to Robot Mood and Processing Phase
  useEffect(() => {
    if (isLoading) {
      if (isClassifying) {
        setRobotMood("thinking");
        setProcessingPhase("classifying");
      } else {
        setRobotMood("generating");
        setProcessingPhase("generating");
      }
    } else if (error) {
      setRobotMood("error"); // Use specific error mood
      setProcessingPhase("error");
      // Optionally switch back to demanding after a delay if error persists
      // setTimeout(() => setRobotMood("demanding"), 3000);
    } else if (generatedHtml || parsedChatLogText) { // Check both states
      setRobotMood("happy");
      setProcessingPhase("complete");
      // Play completion sound (ensure file is in /public)
      const audio = new Audio("/gacha-complete.mp3");
      audio.volume = 0.3;
      audio.play().catch((err) => console.warn("Audio play failed:", err));
      // Return to idle after a delay
      const timer1 = setTimeout(() => setRobotMood("idle"), 2500);
      const timer2 = setTimeout(() => setProcessingPhase("idle"), 2500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); }; // Cleanup timers
    } else {
      // Not loading, no error, no result => idle state after reset or initially
      // Avoid setting mood if it's already excited or demanding from other interactions
      if (robotMood !== 'excited' && robotMood !== 'demanding') {
         setRobotMood("idle");
      }
      setProcessingPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isClassifying, error, generatedHtml, parsedChatLogText]); // Add parsedChatLogText dependency


  // --- Functions ---

  // Insert Coin (from Gacha)
  const insertCoin = () => {
    if (coins < 10) {
      setCoins(coins + 1);
      setCoinAnimation(true);
      setTimeout(() => setCoinAnimation(false), 1000);

      // Play coin sound (ensure file is in /public)
      const audio = new Audio("/coin-insert.mp3");
      audio.volume = 0.4;
      audio.play().catch((err) => console.warn("Audio play failed:", err));

      setRobotMood("excited");
      setTimeout(() => {
        // Only return to idle if no other process started
        if (!isLoading && !error && !generatedHtml && !parsedChatLogText) {
           setRobotMood("idle");
        }
      }, 1000);
    }
  };

  // Add Coins (Cheat button from Gacha)
  const addCoins = () => {
    setCoins((prev) => Math.min(prev + 3, 10)); // Limit max coins
    setRobotMood("excited");
     setTimeout(() => {
       if (!isLoading && !error && !generatedHtml && !parsedChatLogText) {
          setRobotMood("idle");
       }
     }, 1000);
  };


  // Reset Machine (Combined)
  const resetMachine = useCallback(() => {
    setInputText("");
    setGeneratedHtml(null);
    setParsedChatLogText(null); // Reset chat log text state
    setError(null);
    setClassifiedType(null);
    setIsLoading(false);
    setIsClassifying(false);
    setRobotMood("idle");
    setProcessingPhase("idle");
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Text Input Change (Combined)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Gacha mood change on typing
    if (Math.random() > 0.95 && !isLoading) { // Only get excited if idle
      setRobotMood("excited");
      setTimeout(() => {
         if (!isLoading && !error && !generatedHtml && !parsedChatLogText) {
             setRobotMood("idle");
         }
      }, 500);
    }
  };

  // Feed Robot / Generate HTML (Combined Core Logic)
  const feedRobot = useCallback(async () => {
    // Gacha checks
    if (!inputText.trim()) {
      toast({ title: "请输入内容", variant: "destructive" });
      setRobotMood("demanding");
      setTimeout(() => setRobotMood("idle"), 2000);
      textareaRef.current?.focus();
      return;
    }
    if (coins <= 0) {
      toast({ title: "请先投币", variant: "destructive" });
      setRobotMood("demanding");
      setTimeout(() => setRobotMood("idle"), 2000);
      return;
    }

    setCoins((c) => c - 1);
    setIsLoading(true);
    setIsClassifying(true);
    setError(null);
    setGeneratedHtml(null);
    setParsedChatLogText(null); // Clear previous chat log text
    setClassifiedType(null);

    let currentClassification: ContentType | null = null;
    const htmlGenerationModel = 'google/gemini-2.5-flash-preview';
    const classificationModel = 'google/gemini-2.5-flash-preview';
    const chatSummaryModel = 'google/gemini-2.5-flash-preview'; // Or specify a different model if needed

    try {
      // --- Step 1: Classify Content ---
      toast({ title: "正在分析内容类型..." });
      const lines = inputText.split('\n');
      const textForClassification = lines.slice(0, 30).join('\n');
      const classificationPrompt = getClassificationPrompt(textForClassification);

      const classificationResponse = await api.chat(classificationPrompt, classificationModel);
      const rawClassification = classificationResponse.message.trim();

      if (Object.values(CONTENT_TYPES).includes(rawClassification as any)) {
        currentClassification = rawClassification as ContentType;
      } else {
        console.warn(`Unexpected classification: "${rawClassification}". Falling back.`);
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
      setIsClassifying(false); // --- Classification Done ---

      // --- Step 2: Generate Content based on Classification ---
      toast({ title: `类型: ${currentClassification}. 开始生成...` });

      if (currentClassification === CONTENT_TYPES.CHAT_LOG) {
        console.log(`Classification is CHAT_LOG. Using PROMPT_SUMMARY_CONTENT with api.chat and model ${chatSummaryModel}.`);
        const summaryPrompt = PROMPT_SUMMARY_CONTENT.replace('{chat_records}', inputText);
        const summaryResponse = await api.chat(summaryPrompt, chatSummaryModel);
        const rawSummary = summaryResponse.message.trim();
         // The prompt asks for specific tags, assume the API returns that format
        setParsedChatLogText(rawSummary || "无法生成摘要内容。"); // Set the raw text for DocumentParser

      } else if (currentClassification === CONTENT_TYPES.OTHER) {
        console.log(`Classification is OTHER. Using GenHTMLPrompt with api.chat and model ${htmlGenerationModel}.`);
        const gen_img_prompt = PROMPT_GEN_IMAGE_PROMPT.replace('{text}', inputText);
        const gen_img_response = await api.chat(gen_img_prompt, htmlGenerationModel);
        const img_url = await generateImage(gen_img_response.message.trim());
        if (!img_url) throw new Error("模型返回了空的图片URL。");
        const html_content = `<img src="${img_url}" alt="Generated Image" />`;
        setGeneratedHtml(html_content);

      } else { // FORMAL_LONG or SCATTERED
        console.log(`Classification is ${currentClassification}. Using api.Document2HTML with model ${htmlGenerationModel}.`);
        const htmlGenerationResponse = await api.Document2HTML(inputText, htmlGenerationModel);
        setGeneratedHtml(htmlGenerationResponse.result);
      }
      // Success state will be set by the useEffect hook

    } catch (err) {
      console.error("Error during process:", err);
      let detailedError = err instanceof Error ? err.message : "发生未知错误.";
       if ((err as any)?.response?.data?.error?.message) {
          detailedError = (err as any).response.data.error.message;
      } else if ((err as any)?.detail) {
          detailedError = JSON.stringify((err as any).detail);
      }
      setError(detailedError);
      toast({
        title: isClassifying ? "分析类型失败" : "生成内容失败",
        description: detailedError.substring(0, 100) + (detailedError.length > 100 ? '...' : ''),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsClassifying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, coins, api]);


  // Export Image (Updated to handle scrolling content)
  const handleExportImage = useCallback(async () => {
    if (!contentDisplayRef.current || isExporting) {
      if (!contentDisplayRef.current) {
        toast({ title: "导出失败", description: "无法找到导出内容。", variant: "destructive" });
      }
      return;
    }

    setIsExporting(true);
    const targetElement = contentDisplayRef.current;
    toast({ title: "准备导出图片...", description: "请稍候..." });

    // --- Style modification logic ---
    const originalStyles = {
        maxHeight: targetElement.style.maxHeight,
        overflowY: targetElement.style.overflowY,
        // Add other styles you might want to temporarily change, e.g., scrollbar styles if necessary
    };

    try {
        // Temporarily remove height restrictions and overflow clipping
        targetElement.style.maxHeight = 'none';
        targetElement.style.overflowY = 'visible'; // Make all content visible

        // Allow the browser time to reflow and render the full content
        // Increase delay slightly to ensure complex content renders fully
        await new Promise(resolve => setTimeout(resolve, 700));

        const dataUrl = await toPng(targetElement, {
            pixelRatio: 2,
            backgroundColor: '#ffffff', // Ensure a background for capture
            // Consider increasing quality if needed: quality: 1.0,
            // cacheBust: true, // May help with dynamic content like Mermaid charts
        });

        const link = document.createElement('a');
        const filename = parsedChatLogText ? `聊天摘要-${Date.now()}.png` : `生成内容-${Date.now()}.png`;
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "导出成功", description: "图片已开始下载" });

    } catch (error) {
        console.error('图片导出失败:', error);
        toast({
            title: "导出失败",
            description: error instanceof Error ? error.message : "未知错误",
            variant: "destructive",
        });
    } finally {
        // --- Restore original styles ---
        targetElement.style.maxHeight = originalStyles.maxHeight;
        targetElement.style.overflowY = originalStyles.overflowY;

        setIsExporting(false);
    }
  }, [isExporting, parsedChatLogText]); // Dependencies remain the same


  // --- Helper functions for dynamic display ---
  const getProcessingPhaseText = (): string => {
    switch (processingPhase) {
      case "classifying": return "正在分析...";
      case "generating": return "正在生成...";
      case "complete": return "生成完成！";
      case "error": return `出错: ${error?.substring(0, 30)}...`;
      case "idle": return "准备就绪";
      default: return "空闲";
    }
  };

  const getProcessingPhaseColor = (): string => {
    switch (processingPhase) {
      case "classifying": return "text-[#7AA25C]";
      case "generating": return "text-[#D68545]";
      case "complete": return "text-[#7AA25C]";
      case "error": return "text-destructive";
      case "idle": return "text-[#5C6B7A]";
      default: return "text-[#5C6B7A]";
    }
  };

  // --- Render ---
  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gradient-to-br from-[#E0F2F7] to-[#F2E8DC] relative overflow-hidden">

      <AiPanel />

       {/* The Gacha Machine itself */}
       <div className="w-full max-w-xl z-10"> {/* Added z-10 */}
         {/* GachaMachine Outer Shell */}
         <div className="bg-[#F2E8DC] rounded-xl shadow-xl overflow-hidden border-4 border-[#D9C8B4] relative">
            {/* Header */}
            <div className="bg-[#7AA25C] p-3 rounded-t-lg text-center relative">
               <div className="absolute left-1/2 -translate-x-1/2 -top-1 bg-[#D68545] text-white font-bold py-2 px-6 rounded-full border-2 border-[#A66A38] shadow-md">
                  <span className="drop-shadow-sm">精灵 gacha</span> {/* Updated Title */}
               </div>
               {/* Decorative leaves */}
               <div className="absolute left-2 top-2 flex space-x-1">
                  <motion.div animate={{ rotate: leafRotation }} className="text-[#5C8D48]"><Leaf size={16} /></motion.div>
                  <motion.div animate={{ rotate: -leafRotation }} className="text-[#5C8D48]"><Leaf size={12} /></motion.div>
               </div>
               <div className="absolute right-2 top-2 flex space-x-1">
                   <motion.div animate={{ rotate: -leafRotation }} className="text-[#5C8D48]"><Leaf size={12} /></motion.div>
                   <motion.div animate={{ rotate: leafRotation }} className="text-[#5C8D48]"><Leaf size={16} /></motion.div>
               </div>
               <div className="h-6"></div> {/* Spacer for title */}
            </div>

            {/* Robot Face Area */}
             <div className="relative flex justify-center items-center h-24 mb-2"> {/* Fixed height */}
                {/* Wooden frame */}
                <div className="absolute w-28 h-28 rounded-full border-8 border-[#A66A38] bg-[#D9C8B4] flex items-center justify-center">
                    {/* Decorations */}
                    <motion.div className="absolute -top-4 -right-4 w-8 h-8" animate={{ rotate: leafRotation }}>
                      <div className="w-full h-full bg-[#7AA25C] rounded-full border-4 border-[#5C8D48] flex items-center justify-center">
                        <Leaf size={16} className="text-[#F2E8DC]" />
                      </div>
                    </motion.div>
                    <motion.div className="absolute -bottom-4 -left-4 w-6 h-6" animate={{ rotate: -leafRotation }}>
                       <div className="w-full h-full bg-[#7AA25C] rounded-full border-2 border-[#5C8D48] flex items-center justify-center">
                         <Leaf size={12} className="text-[#F2E8DC]" />
                       </div>
                    </motion.div>

                    {/* Robot face background */}
                    <motion.div
                      className="w-20 h-20 bg-[#F2E8DC] rounded-full border-4 border-[#D9C8B4] flex items-center justify-center overflow-hidden shadow-inner"
                      animate={{
                        boxShadow:
                          robotMood === "demanding" ? ["0 0 5px #D68545", "0 0 15px #D68545", "0 0 5px #D68545"] : "none",
                      }}
                      transition={{ repeat: robotMood === "demanding" ? Number.POSITIVE_INFINITY : 0, duration: 0.5 }}
                    >
                        {/* Robot expression */}
                        <motion.div
                          key={robotMood} // Add key to force re-render on mood change for animation reset
                          className={`text-2xl font-bold ${robotColors[robotMood]}`}
                          animate={{
                            scale: ["demanding", "generating"].includes(robotMood) ? [1, 1.1, 1] : robotMood === 'excited' ? [1, 1.2, 1] : 1,
                            rotate: robotMood === "excited" ? [0, -5, 5, -5, 0] : 0,
                          }}
                          transition={{
                            repeat: ["demanding", "generating", "excited"].includes(robotMood) ? Number.POSITIVE_INFINITY : 0,
                            duration: robotMood === "excited" ? 0.3 : 0.5,
                          }}
                        >
                          {robotExpressions[robotMood]}
                        </motion.div>
                    </motion.div>
                </div>

                 {/* Speech bubble / Status Area - Positioned below the face frame */}
                <div className="absolute top-[calc(100%-1rem)] w-full flex justify-center">
                    <AnimatePresence>
                        {/* Idle/Demanding Message */}
                        {(robotMood === "idle" || robotMood === "demanding") && !isLoading && !generatedHtml && !parsedChatLogText && !error && ( // Adjusted condition
                        <motion.div
                            key="speech"
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className={`bg-white px-3 py-1 rounded-md text-xs border ${
                            robotMood === "demanding" ? "border-[#D68545] text-[#D68545] font-bold" : "border-[#7AA25C] text-[#5C6B7A]"
                            } shadow-sm relative`}
                        >
                             {robotMood === "demanding" ? demandingMessage : "我可以把你的内容变成其他东西哦~"}
                            {/* Arrow pointing up */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white"
                                 style={{ filter: `drop-shadow(0 -1px 1px rgba(0,0,0,0.1))` }}/>
                        </motion.div>
                        )}
                        {/* Classification Result */}
                        {classifiedType && !isLoading && !error && !generatedHtml && !parsedChatLogText && ( // Adjusted condition
                            <motion.div
                                key="classification"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-300 shadow-sm"
                            >
                                类型: {classifiedType}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
             </div>


            {/* Control Panel */}
            <div className="bg-[#5C6B7A] p-3 flex justify-between items-center">
               {/* Coin Display */}
               <div className="bg-[#F2E8DC] rounded-lg flex items-center justify-center text-[#D68545] font-bold text-xl border-2 border-[#D9C8B4] shadow-inner px-3 py-1 relative overflow-hidden min-w-[60px]">
                  <div className="relative z-10 flex items-center">
                      <CoinsIcon size={16} className="mr-1" /> {coins}
                  </div>
                  <AnimatePresence>
                      {coinAnimation && (
                      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.5 }}
                          className="absolute top-0 left-1/2 -translate-x-1/2 text-[#D68545] font-bold"> +1 </motion.div>
                      )}
                  </AnimatePresence>
               </div>
               {/* Status indicator */}
               <div className="flex items-center space-x-2">
                   <div className={`w-3 h-3 rounded-full ${coins > 0 ? "bg-[#7AA25C]" : "bg-[#D68545]"} shadow-sm ${coins > 0 && !isLoading ? "animate-pulse" : ""}`}></div>
                   <div className="text-xs text-white font-medium">{coins > 0 ? "准备就绪" : "请投币"}</div>
               </div>
               {/* Reset button */}
               <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={resetMachine}
                  className="bg-[#D68545] hover:bg-[#C67535] text-white rounded-md px-2 py-1 text-xs font-bold shadow-md border border-[#A66A38] flex items-center"
                  disabled={isLoading} // Disable reset while processing
                  >
                  <RefreshCw size={12} className="mr-1" /> 重置
               </motion.button>
            </div>

            {/* Coin Slot Area */}
            <div className="bg-[#F2E8DC] px-4 py-3 flex justify-between items-center border-t-2 border-b-2 border-[#D9C8B4]">
                <div className="flex items-center space-x-3">
                    {/* Coin Slot Button */}
                    <motion.div className="w-16 h-10 bg-[#5C6B7A] rounded-lg cursor-pointer shadow-inner relative overflow-hidden"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={insertCoin}>
                         <div className="w-full h-1 bg-[#3A4B5A]"></div>
                         <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#3A4B5A] rounded"></div>
                         <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#7A8B9A] to-transparent opacity-30"></div>
                         <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-[#F2E8DC]">投币处</div>
                    </motion.div>
                    {/* Add Coins (Cheat) Button */}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addCoins}
                        className="bg-[#7AA25C] hover:bg-[#6A9248] text-white rounded-md px-2 py-1 text-xs font-bold shadow-md border border-[#5C8D48] flex items-center">
                       <CoinsIcon size={12} className="mr-1" /> 添加硬币
                    </motion.button>
                </div>
                {/* Decorative leaves */}
                <div className="flex items-center space-x-2">
                  <motion.div animate={{ rotate: leafRotation }} className="text-[#7AA25C]"><Leaf size={16} /></motion.div>
                  <motion.div animate={{ rotate: -leafRotation }} className="text-[#7AA25C]"><Leaf size={12} /></motion.div>
                </div>
            </div>

            {/* Input / Loading / Output Area */}
            <div className="bg-[#F2E8DC] p-4 relative min-h-[300px]"> {/* Ensure min height */}

                {/* Input Area (Shows when idle) */}
                <AnimatePresence>
                  {!isLoading && !generatedHtml && !parsedChatLogText && !error && ( // Adjusted condition
                     <motion.div key="input-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         {/* Input Label */}
                         <div className="text-center mb-3 text-[#5C6B7A] font-bold flex items-center justify-center">
                             <div className="w-3 h-3 rounded-full bg-[#7AA25C] mr-2"></div> 输入内容 <div className="w-3 h-3 rounded-full bg-[#7AA25C] ml-2"></div>
                         </div>
                         {/* Textarea (from ChatTestPage) */}
                         <div className="relative rounded-md overflow-hidden shadow-md border-2 border-[#D9C8B4]">
                             <Textarea
                                 ref={textareaRef}
                                 placeholder="快让我吃掉你的内容..."
                                 value={inputText}
                                 onChange={handleInputChange}
                                 rows={6}
                                 className="w-full p-3 rounded-md focus:outline-none min-h-[100px] transition-colors bg-white text-[#5C6B7A] resize-none"
                                 disabled={isLoading}
                             />
                         </div>
                         {/* Feed Button */}
                         <div className="flex justify-center mt-4">
                             <motion.button
                                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                 onClick={feedRobot}
                                 disabled={coins <= 0 || !inputText.trim()}
                                 className={`px-4 py-2 bg-[#D68545] hover:bg-[#C67535] text-white rounded-md shadow-md flex items-center font-semibold ${ (coins <= 0 || !inputText.trim()) ? "opacity-50 cursor-not-allowed" : "" }`}
                             >
                                 喂给精灵 <Sparkles size={16} className="ml-2" />
                             </motion.button>
                         </div>
                     </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading/Processing Indicator (Shows when loading) */}
                <AnimatePresence>
                   {isLoading && (
                       <motion.div
                           key="loading-area"
                           className="absolute inset-4 bg-[#F9F5EF]/80 backdrop-blur-sm rounded-md flex flex-col items-center justify-center z-20" // Keep loading inside
                           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                       >
                            {/* Robot expression during processing */}
                           <motion.div
                              key={processingPhase} // Key helps reset animation if phase changes quickly
                              className={`text-4xl font-bold mb-4 ${getProcessingPhaseColor()}`}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2 }}>
                               {robotExpressions[robotMood]}
                           </motion.div>
                           {/* Loading text */}
                           <div className="flex items-center space-x-2">
                               <Loader2 className={`h-5 w-5 animate-spin ${getProcessingPhaseColor()}`} />
                               <span className={`font-semibold ${getProcessingPhaseColor()}`}>{getProcessingPhaseText()}</span>
                           </div>
                       </motion.div>
                   )}
                </AnimatePresence>

            </div> {/* End Input/Loading/Output Area */}


            {/* Machine Base */}
            <div className="h-8 bg-[#7AA25C] rounded-b-xl relative">
               <div className="absolute top-0 left-0 right-0 h-1 bg-[#D9C8B4]"></div>
               <div className="absolute top-2 left-1/2 -translate-x-1/2 flex space-x-2">
                  {[...Array(5)].map((_, i) => (
                     <motion.div key={i} animate={{ rotate: i % 2 === 0 ? leafRotation : -leafRotation }} className="text-[#F2E8DC] opacity-70">
                         <Leaf size={16} />
                     </motion.div>
                  ))}
               </div>
               <div className="absolute bottom-1 right-2 text-[10px] text-[#F2E8DC] font-medium">精灵网页生成器 v1.0</div>
            </div>
             {/* Machine Shadow */}
             <div className="h-2 bg-[#5C6B7A] opacity-20 rounded-full mx-12 mt-1"></div>
         </div> {/* End GachaMachine Outer Shell */}
       </div> {/* End Max Width Container / Machine itself */}


       {/* === MOVED & ENHANCED Output Display Area === */}
       <AnimatePresence>
          {(generatedHtml || parsedChatLogText || error) && !isLoading && ( // Updated condition
            <>
              {/* Backdrop with Blur */}
              <motion.div
                 key="backdrop"
                 className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.2 }}
              />

              {/* Pop-out Content */}
              <motion.div
                key="output-popout"
                className="fixed inset-0 flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 25, opacity: { duration: 0.2 } } }}
                exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
              >
                {/* Inner container for styling and max-width */}
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-2xl border-4 border-[#D9C8B4] relative w-full max-w-3xl max-h-[90vh]"> {/* Increased max-width, max-height, reduced padding slightly */}
                    {/* Output Header */}
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${error ? 'bg-destructive' : 'bg-[#7AA25C]'} text-white text-xs px-3 py-1 rounded-md shadow-sm border ${error ? 'border-destructive/50' : 'border-[#5C8D48]'}`}>
                        <span className="flex items-center">
                            {error ? <AlertTriangle size={12} className="mr-1" /> : <Sparkles size={12} className="mr-1" />}
                            {error ? "生成出错" : (parsedChatLogText ? "摘要完成" : "生成完成")} {/* Adjusted Title */}
                            {error ? null : <Sparkles size={12} className="ml-1" />}
                        </span>
                    </div>

                    {/* Content Area - Conditionally render DocumentParser or HTML */}
                    {/* Added overflow-y-auto directly to this container */}
                    <div ref={contentDisplayRef} className="mt-4 relative min-h-[200px] max-h-[calc(85vh-100px)] overflow-y-auto p-1 rounded-md bg-white"> {/* Added bg-white for capture */}
                        {error && (
                             <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                                 <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                 <p className="text-center font-semibold">处理出错</p>
                                 <p className="text-center text-sm break-words whitespace-pre-wrap">{error}</p>
                             </div>
                        )}
                        {/* Render DocumentParser if chat log text exists */}
                        {parsedChatLogText && !error && (
                            <DocumentParser inputText={parsedChatLogText} />
                        )}
                        {/* Render HTML if generatedHtml exists AND it's not a chat log result */}
                        {generatedHtml && !parsedChatLogText && !error && (
                            <div ref={htmlDisplayRef} className="p-3 bg-muted/20 border rounded-md" dangerouslySetInnerHTML={{ __html: generatedHtml }} />
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap justify-between items-center gap-2 mt-4 pt-4 border-t"> {/* Added border-t */}
                        <motion.button
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={resetMachine}
                            className="px-3 py-1 bg-[#5C6B7A] hover:bg-[#4C5B6A] text-white rounded-md shadow-sm flex items-center text-sm"
                        >
                            <RefreshCw size={14} className="mr-1" /> 关闭 / 重置
                        </motion.button>

                        <div className="flex flex-wrap gap-2">
                             {/* Export Image Button - Always visible if content exists */}
                              {(generatedHtml || parsedChatLogText) && !error && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleExportImage}
                                    className="px-3 py-1 bg-[#D68545] hover:bg-[#C67535] text-white rounded-md shadow-md flex items-center text-sm"
                                    disabled={isExporting}
                                >
                                    {isExporting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ImageIcon size={14} className="mr-1" />}
                                     导出图片
                                </motion.button>
                             )}
                        </div>
                    </div>
                </div> {/* End Inner container */}
              </motion.div> {/* End Pop-out Content */}
            </>
          )}
        </AnimatePresence>
        {/* === END MOVED Output Display Area === */}

    </div> // End Centering Container
  );
}

