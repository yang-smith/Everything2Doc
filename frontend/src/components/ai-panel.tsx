"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, X, Minimize2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { generateImage } from "@/lib/openrouterService"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

export default function AiPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "你好！我是你的AI助手，可以帮你解答关于知识地图的问题，或者提供学习建议。",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [isMounted, setIsMounted] = useState(false); // State to track mount status

  // Set mount status after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 当面板展开时，聚焦输入框
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isExpanded])

  // 处理消息发送
  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Check if it's an image generation command (case-insensitive)
    const lowerTrimmedInput = trimmedInput.toLowerCase();
    let isImageCommand = false;
    let prompt = "";

    if (lowerTrimmedInput.startsWith("/image")) {
        // Extract potential prompt text after "/image"
        const potentialPrompt = trimmedInput.substring(6).trim(); // Get everything after "/image" and trim spaces
        if (potentialPrompt) {
            isImageCommand = true;
            prompt = potentialPrompt; // Use the trimmed text as the prompt
        } else {
            // Handle cases like "/image" or "/image   " entered alone
             const errorMessage: Message = {
                id: Date.now().toString() + "-error",
                content: "请输入图像描述。",
                role: "assistant",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            setIsLoading(false);
            return;
        }
    }

    if (isImageCommand) {
      //  const prompt = trimmedInput.substring(7).trim(); // Remove old extraction logic
      //  if (!prompt) { ... } // Remove old empty prompt check, handled above

      // --- Image Generation Logic ---
      try {
        const imageUrl = await generateImage(prompt); // Use the extracted prompt
        const imageMessage: Message = {
          id: Date.now().toString() + "-img",
          content: `图像已生成: ${imageUrl}`, // Display the URL for now
          // TODO: Enhance to display the actual image later
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, imageMessage]);
      } catch (error: any) {
        console.error("Image generation error in panel:", error);
        const errorMessage: Message = {
          id: Date.now().toString() + "-error",
          content: `图像生成失败: ${error.message || '未知错误'}`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
      // --- End Image Generation Logic ---

    } else {
      // Placeholder for future actual chat API call
      // Display a message indicating chat is not implemented yet
      const notImplementedMessage: Message = {
        id: Date.now().toString() + "-ni",
        content: "Chat functionality not implemented yet.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, notImplementedMessage]);

      // If you integrate a real chat API call here later,
      // make sure to handle the loading state appropriately (e.g., in a finally block).
      setIsLoading(false); // Stop loading since no operation is performed
    }
  }

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full z-50 transition-all duration-300 flex flex-col",
        isExpanded ? "w-96 md:w-[800px]" : "w-12",
      )}
    >
      {/* 折叠按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-4 transform -translate-x-full bg-gray-800 hover:bg-gray-700 rounded-l-md rounded-r-none h-12 w-8 border-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </Button>

      {/* 面板内容 */}
      <div
        className={cn(
          "bg-gray-800 border-l border-gray-700 h-full flex flex-col",
          isExpanded ? "opacity-100" : "opacity-0",
        )}
      >
        {/* 面板头部 */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-emerald-400 mr-2" />
            <h3 className="font-medium text-white">AI 助手</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 消息区域 */}
        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              // Check if it's an assistant message containing a generated image URL
              const isAssistant = message.role === 'assistant';
              const imagePrefix = "图像已生成: ";
              const isImageMessage = isAssistant && message.content.startsWith(imagePrefix);
              const imageUrl = isImageMessage ? message.content.substring(imagePrefix.length).trim() : null;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg p-3 max-w-[85%]",
                    message.role === "user" ? "bg-amber-700 text-white ml-auto" : "bg-gray-700 text-gray-100 mr-auto",
                  )}
                >
                  {/* Render image or text content */}
                  {isImageMessage && imageUrl ? (
                    <img
                       src={imageUrl}
                       alt="Generated Image"
                       className="max-w-full h-auto rounded-md mt-1 object-contain" // Added object-contain
                       // Optional: Add loading state or error handling for the image itself
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p> // Added whitespace-pre-wrap
                  )}

                  {/* Only render timestamp on the client after mount */}
                  {isMounted && (
                     <p className="text-xs opacity-70 mt-1">
                       {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                     </p>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[85%] mr-auto">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>
                    ●
                  </span>
                  <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>
                    ●
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* 输入区域 */}
        <div className="p-3 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题..."
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
