"use client"

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
// 动态导入html2pdf.js以避免SSR问题
import dynamic from 'next/dynamic';

// AIInlineHtmlRenderer组件
interface AIInlineHtmlRendererProps {
  htmlContent: string;
}

const AIInlineHtmlRenderer: React.FC<AIInlineHtmlRendererProps> = ({ htmlContent }) => {
  // 配置DOMPurify允许内联样式和style标签
  const sanitizeConfig = {
    ADD_TAGS: ['style', 'link', 'meta'],
    ADD_ATTR: ['style', 'charset', 'integrity', 'crossorigin', 'referrerpolicy', 'href', 'rel'],
    WHOLE_DOCUMENT: true, // 允许完整的HTML文档结构
    ALLOW_UNKNOWN_PROTOCOLS: true
  };
  
  // 导入DOMPurify
  const DOMPurify = require('dompurify');
  
  // 清理HTML内容以防止XSS攻击，同时保留样式
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, sanitizeConfig);
  
  return (
    <div 
      style={{
        fontFamily: 'Arial, sans-serif',
        lineHeight: 1.6,
        color: '#333',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '100%',
        margin: '0 auto',
        overflowWrap: 'break-word'
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
};

// 页面样式
const styles = {
  demoPage: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  headerTitle: {
    color: '#333',
    marginBottom: '10px'
  },
  headerText: {
    color: '#666'
  },
  inputContainer: {
    display: 'flex',
    marginBottom: '30px',
    gap: '10px'
  },
  input: {
    flex: '1',
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0 25px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  downloadButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 25px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '20px 0'
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  spinner: {
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderLeftColor: '#3498db',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px'
  },
  contentWrapper: {
    marginBottom: '30px'
  },
  pdfContainer: {
    marginTop: '20px'
  },
  footer: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '40px'
  },
  footerTitle: {
    marginTop: 0,
    color: '#333'
  },
  footerList: {
    paddingLeft: '20px'
  },
  footerListItem: {
    marginBottom: '8px'
  },
  errorMessage: {
    backgroundColor: '#ffeeee',
    color: '#e74c3c',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    borderLeft: '4px solid #e74c3c'
  },
  modelSelector: {
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    width: '100%'
  }
};

// 添加关键帧动画
const spinKeyframes = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AIInlineHtmlDemo: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('deepseek/deepseek-r1-distill-llama-70b');
  const promptInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 添加关键帧动画样式到文档头
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = spinKeyframes;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 处理用户输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPrompt(e.target.value);
  };

  // 处理模型选择变化
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  // 发送请求到API
  const handleSendRequest = async () => {
    if (!userPrompt.trim()) {
      setError('请输入提示词');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 使用Document2HTML API替代chat API
      const response = await api.Document2HTML(userPrompt, selectedModel);
      console.log(response.result);
      setHtmlContent(response.result);
      
      // 清空输入框
      setUserPrompt('');
      if (promptInputRef.current) {
        promptInputRef.current.focus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 按下Enter键处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendRequest();
    }
  };
  
  // 生成PDF并下载
  const handleDownloadPdf = async () => {
    if (!htmlContent || !contentRef.current) return;
    
    try {
      setIsGeneratingPdf(true);
      
      // 动态导入html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;
      
      // 给样式和资源加载一些时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 增强的配置选项
      const opt = {
        margin: 10,
        filename: 'ai-generated-content.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          allowTaint: true,
          logging: true,
          letterRendering: true,
          foreignObjectRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true,
          hotfixes: ["px_scaling"]
        }
      };
      
      // 生成PDF
      await html2pdf().from(contentRef.current).set(opt).save();
      
    } catch (error) {
      console.error('PDF生成失败:', error);
      setError('PDF生成失败，请稍后再试');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={styles.demoPage}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>AI生成HTML内容演示</h1>
        <p style={styles.headerText}>输入主题，AI将生成包含内联样式的HTML内容</p>
      </header>

      <select 
        style={styles.modelSelector} 
        value={selectedModel} 
        onChange={handleModelChange}
      >
        <option value="deepseek/deepseek-chat-v3-0324:free">Deepseek 70B</option>
        <option value="google/gemini-2.0-flash-001">Gemini</option>
      </select>
      
      <div style={styles.inputContainer}>
        <input
          type="text"
          ref={promptInputRef}
          style={styles.input}
          value={userPrompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="输入内容主题（例如：数据可视化最佳实践）"
        />
        <button 
          style={{
            ...styles.button,
            backgroundColor: isLoading ? '#999' : '#3498db',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }} 
          onClick={handleSendRequest}
          disabled={isLoading}
        >
          生成
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <strong>错误：</strong> {error}
        </div>
      )}
      
      {isLoading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>AI正在生成内容，请稍候...</p>
        </div>
      ) : htmlContent ? (
        <div style={styles.pdfContainer}>
          {/* PDF下载按钮 */}
          <button 
            style={{
              ...styles.downloadButton,
              backgroundColor: isGeneratingPdf ? '#95a5a6' : '#27ae60',
              cursor: isGeneratingPdf ? 'not-allowed' : 'pointer',
            }}
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? '正在生成PDF...' : '下载为PDF文档'}
            {!isGeneratingPdf && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
              </svg>
            )}
          </button>
          
          {/* 内容包装器，用于下载PDF */}
          <div ref={contentRef} style={styles.contentWrapper}>
            <AIInlineHtmlRenderer htmlContent={htmlContent} />
          </div>
        </div>
      ) : null}
      
      <footer style={styles.footer}>
        <h3 style={styles.footerTitle}>技术要点</h3>
        <ul style={styles.footerList}>
          <li style={styles.footerListItem}>使用Document2HTML API将文本转换为HTML</li>
          <li style={styles.footerListItem}>AI直接生成带有内联样式的HTML</li>
          <li style={styles.footerListItem}>使用DOMPurify进行安全处理</li>
          <li style={styles.footerListItem}>html2pdf.js将HTML内容转换为PDF</li>
          <li style={styles.footerListItem}>简单实现，无需样式隔离机制</li>
        </ul>
      </footer>
    </div>
  );
};

export default AIInlineHtmlDemo;