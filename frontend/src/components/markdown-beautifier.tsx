import React, { useEffect, useRef } from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import mermaid from 'mermaid';

interface MarkdownBeautifierProps {
  markdown: string;
  theme?: 'mobile' | 'desktop' | 'apple-notes' | 'minimal-gray' | 'imperial';
  isMobile?: boolean;
}

export function MarkdownBeautifier({ 
  markdown, 
  theme = 'mobile',
  isMobile = false 
}: MarkdownBeautifierProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  
  // 初始化mermaid配置
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: (theme === 'apple-notes' || theme === 'minimal-gray') && 
             window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'neutral',
      flowchart: { 
        curve: 'basis',
        // 简约高级灰主题下的流程图样式配置
        nodeSpacing: 50,
        rankSpacing: 70,
      },
      securityLevel: 'loose',
      fontFamily: theme === 'minimal-gray' ? 
                  "'SF Pro Text', -apple-system, sans-serif" : 
                  "'SF Pro Text', -apple-system, BlinkMacSystemFont, sans-serif"
    });
  }, [theme]);

  // 创建Markdown解析器
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => {
      // 处理mermaid代码块
      if (lang === 'mermaid') {
        return `<div class="mermaid">${str}</div>`;
      }
      
      // 处理普通代码高亮
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return '';
    }
  });
  
  const html = md.render(markdown);
  
  // 在渲染后处理mermaid图表
  useEffect(() => {
    if (mermaidRef.current) {
      try {
        // 重新渲染页面上的所有mermaid图表
        mermaid.contentLoaded();
      } catch (error) {
        console.error('Mermaid rendering error:', error);
      }
    }
  }, [html]);

  const mobileStyles = `
    .markdown-beautifier {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 16px;
      max-width: 100%;
      font-size: 16px;
    }
    
    .markdown-beautifier h1 {
      font-size: 1.8em;
      color: #222;
      margin-top: 0.8em;
      margin-bottom: 0.6em;
      font-weight: 600;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }
    
    .markdown-beautifier h2 {
      font-size: 1.5em;
      margin-top: 1em;
      margin-bottom: 0.6em;
      font-weight: 600;
      color: #333;
    }
    
    .markdown-beautifier h3 {
      font-size: 1.3em;
      margin-top: 1em;
      margin-bottom: 0.6em;
      font-weight: 600;
    }
    
    .markdown-beautifier p {
      margin-bottom: 1em;
      word-break: break-word;
    }
    
    .markdown-beautifier a {
      color: #0366d6;
      text-decoration: none;
    }
    
    .markdown-beautifier a:hover {
      text-decoration: underline;
    }
    
    .markdown-beautifier ul, .markdown-beautifier ol {
      padding-left: 1.5em;
      margin-bottom: 1em;
    }
    
    .markdown-beautifier li {
      margin-bottom: 0.3em;
    }
    
    .markdown-beautifier blockquote {
      padding: 0 1em;
      color: #6a737d;
      border-left: 0.25em solid #dfe2e5;
      margin-bottom: 1em;
    }
    
    .markdown-beautifier pre {
      background-color: #f6f8fa;
      border-radius: 3px;
      padding: 12px;
      overflow-x: auto;
      font-size: 85%;
      line-height: 1.45;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      margin-bottom: 1em;
      white-space: pre-wrap;
      word-break: break-word;
    }
    
    .markdown-beautifier code {
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      padding: 0.2em 0.4em;
      font-size: 85%;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
    
    .markdown-beautifier pre code {
      background-color: transparent;
      padding: 0;
    }
    
    .markdown-beautifier img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
    
    .markdown-beautifier table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1em;
      font-size: 0.95em;
    }
    
    .markdown-beautifier table th, .markdown-beautifier table td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
      word-break: break-word;
    }
    
    .markdown-beautifier table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    
    .markdown-beautifier hr {
      height: 1px;
      background-color: #e1e4e8;
      border: none;
      margin: 1.5em 0;
    }
  `;

  const documentStyles = `
    .markdown-beautifier {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.7;
      color: #333;
      padding: 24px;
      background-color: #fafafa;
      border-radius: 8px;
      max-width: 100%;
    }
    
    .markdown-beautifier h1 {
      font-size: 2.2em;
      color: #333;
      font-weight: 600;
      margin-bottom: 28px;
      padding-bottom: 0.2em;
    }
    
    .markdown-beautifier h2 {
      font-size: 1.8em;
      font-weight: 600;
      margin-top: 36px;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 0.3em;
    }
    
    .markdown-beautifier h3 {
      font-size: 1.5em;
      font-weight: 600;
      margin-top: 28px;
    }
    
    .markdown-beautifier p {
      margin-bottom: 16px;
      line-height: 1.8;
    }
    
    .markdown-beautifier ul {
      margin-left: 18px;
      margin-bottom: 20px;
    }
    
    .markdown-beautifier li {
      margin-bottom: 12px;
      position: relative;
    }
    
    .markdown-beautifier li::before {
      content: "•";
      position: absolute;
      left: -18px;
      color: #666;
    }
  `;

  const appleNotesStyles = `
    .markdown-beautifier {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
      line-height: 1.45;
      color: #1d1d1f;
      padding: 28px 32px;
      max-width: 100%;
      font-size: 17px;
      background-color: #f7f5e8;
      background-image: linear-gradient(to bottom, #f8f6ee, #f5f3e4);
      position: relative;
      letter-spacing: -0.022em;
    }
    
    /* 纸面质感效果 */
    .markdown-beautifier::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/png;base64,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");
      opacity: 0.04;
      pointer-events: none;
    }
    
    .markdown-beautifier h1 {
      font-size: 26px;
      color: #000;
      margin-top: 24px;
      margin-bottom: 18px;
      font-weight: 600;
      border-bottom: none;
      letter-spacing: -0.7px;
    }
    
    .markdown-beautifier h2 {
      font-size: 22px;
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #000;
      border-bottom: none;
      letter-spacing: -0.5px;
    }
    
    .markdown-beautifier h3 {
      font-size: 19px;
      margin-top: 20px;
      margin-bottom: 12px;
      font-weight: 600;
      color: #000;
      letter-spacing: -0.3px;
    }
    
    .markdown-beautifier p {
      margin-bottom: 16px;
      word-break: break-word;
      letter-spacing: -0.2px;
    }
    
    .markdown-beautifier a {
      color: #007AFF;
      text-decoration: none;
      transition: color 0.15s ease;
    }
    
    .markdown-beautifier a:hover {
      color: #0056b3;
      text-decoration: none;
      border-bottom: 1px solid currentColor;
    }
    
    .markdown-beautifier ul, .markdown-beautifier ol {
      padding-left: 24px;
      margin-bottom: 16px;
      margin-top: 8px;
    }
    
    .markdown-beautifier li {
      margin-bottom: 8px;
      padding-left: 6px;
      line-height: 1.5;
    }
    
    .markdown-beautifier ul li {
      position: relative;
    }
    
    .markdown-beautifier ul li::marker {
      color: #ff9500;
      font-size: 1.1em;
    }
    
    .markdown-beautifier ol li::marker {
      color: #007AFF;
      font-weight: 500;
    }
    
    .markdown-beautifier blockquote {
      padding: 14px 20px;
      color: #555;
      border-left: 4px solid #ff9500;
      margin: 16px 0;
      background-color: rgba(255, 149, 0, 0.03);
      border-radius: 0 8px 8px 0;
      font-style: normal;
    }
    
    .markdown-beautifier blockquote p {
      margin-bottom: 0;
    }
    
    .markdown-beautifier pre {
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.5;
      font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
      margin-bottom: 16px;
      box-shadow: inset 0 0 1px rgba(0, 0, 0, 0.05);
    }
    
    .markdown-beautifier code {
      background-color: rgba(0, 0, 0, 0.03);
      border-radius: 5px;
      padding: 3px 6px;
      font-size: 14px;
      font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
      color: #d33682;
    }
    
    .markdown-beautifier pre code {
      background-color: transparent;
      padding: 0;
      color: #333;
      border-radius: 0;
    }
    
    .markdown-beautifier img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .markdown-beautifier table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      font-size: 15px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .markdown-beautifier table th, .markdown-beautifier table td {
      border: 1px solid #e5e5e5;
      padding: 10px 14px;
      word-break: break-word;
    }
    
    .markdown-beautifier table th {
      background-color: rgba(0, 0, 0, 0.02);
      font-weight: 600;
      text-align: left;
      color: #454545;
    }
    
    .markdown-beautifier table tr:nth-child(2n) {
      background-color: rgba(0, 0, 0, 0.01);
    }
    
    .markdown-beautifier hr {
      height: 1px;
      background-color: rgba(0, 0, 0, 0.1);
      border: none;
      margin: 24px 0;
    }
    
    .markdown-beautifier * + h1,
    .markdown-beautifier * + h2,
    .markdown-beautifier * + h3 {
      margin-top: 32px;
    }
    
    .markdown-beautifier h1:first-child,
    .markdown-beautifier h2:first-child,
    .markdown-beautifier h3:first-child {
      margin-top: 0;
    }
    
    /* 添加淡淡的纸张底部阴影 */
    .markdown-card-container:has(.markdown-beautifier) {
      box-shadow: 0 1px 2px rgba(0,0,0,0.07),
                  0 2px 4px rgba(0,0,0,0.05),
                  0 4px 8px rgba(0,0,0,0.03),
                  0 8px 16px rgba(0,0,0,0.02);
    }
    
    @media (prefers-color-scheme: dark) {
      .markdown-beautifier {
        background-color: #1c1c1e;
        background-image: none;
        color: #e5e5e7;
      }
      
      .markdown-beautifier::before {
        opacity: 0.02;
      }
      
      .markdown-beautifier h1,
      .markdown-beautifier h2,
      .markdown-beautifier h3 {
        color: #fff;
      }
      
      .markdown-beautifier code {
        color: #ff9eb5;
        background-color: rgba(255, 255, 255, 0.08);
      }
      
      .markdown-beautifier pre {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .markdown-beautifier pre code {
        color: #e0e0e0;
      }
      
      .markdown-beautifier table th {
        background-color: rgba(255, 255, 255, 0.05);
        color: #bbb;
      }
      
      .markdown-beautifier table th, 
      .markdown-beautifier table td {
        border-color: #3a3a3c;
      }
      
      .markdown-beautifier blockquote {
        background-color: rgba(255, 149, 0, 0.05);
        color: #aaa;
      }
      
      .markdown-card-container:has(.markdown-beautifier) {
        box-shadow: 0 1px 3px rgba(0,0,0,0.2),
                    0 3px 6px rgba(0,0,0,0.15);
      }
    }
  `;

  // 添加响应式卡片容器样式
  const cardContainerStyles = `
    .markdown-card-container {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      background-color: white;
      margin: 0 auto;
      max-width: 100%;
      width: ${isMobile ? '440px' : '800px'}; // 移动设备全宽，桌面设备固定宽度
      font-size: ${isMobile ? '15px' : '16px'}; // 移动设备字体稍小
    }
    
    // 移动设备适配样式
    ${isMobile ? `
      .markdown-card-container {
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
      
      .markdown-beautifier {
        padding: 16px !important; // 移动设备减少内边距
      }
      
      .markdown-beautifier h1 {
        font-size: 22px !important;
      }
      
      .markdown-beautifier h2 {
        font-size: 18px !important;
      }
    ` : ''}
    
    @media (prefers-color-scheme: dark) {
      .markdown-card-container {
        background-color: #1a1a1a;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    }
  `;

  // 修改现有样式，移除外边距和边框半径，因为现在由容器提供
  const minimalGrayStyles = `
    .markdown-beautifier {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
      line-height: 1.5;
      color: #333333;
      padding: 32px;
      max-width: 100%;
      font-size: 16px;
      background-color: #ffffff;
      border-radius: 0; 
    }
    
    .markdown-beautifier h1 {
      font-size: 28px;
      color: #1d1d1f;
      margin-top: 28px;
      margin-bottom: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
      border-bottom: none;
    }
    
    .markdown-beautifier h2 {
      font-size: 22px;
      margin-top: 26px;
      margin-bottom: 16px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.3px;
    }
    
    .markdown-beautifier h3 {
      font-size: 18px;
      margin-top: 22px;
      margin-bottom: 14px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.2px;
    }
    
    .markdown-beautifier p {
      margin-bottom: 16px;
      color: #494949;
      line-height: 1.6;
    }
    
    .markdown-beautifier a {
      color: #555555;
      text-decoration: none;
      border-bottom: 1px solid #c7c7c7;
      transition: all 0.2s ease;
    }
    
    .markdown-beautifier a:hover {
      color: #000000;
      border-bottom-color: #000000;
    }
    
    .markdown-beautifier ul, .markdown-beautifier ol {
      padding-left: 20px;
      margin-bottom: 20px;
      color: #494949;
    }
    
    .markdown-beautifier li {
      margin-bottom: 8px;
      line-height: 1.6;
    }
    
    .markdown-beautifier blockquote {
      padding: 12px 20px;
      color: #767676;
      border-left: 3px solid #c7c7c7;
      margin: 16px 0;
      background-color: #f9f9f9;
      font-style: italic;
    }
    
    .markdown-beautifier pre {
      background-color: #f5f5f7;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.5;
      font-family: "SF Mono", Menlo, monospace;
      margin-bottom: 16px;
    }
    
    .markdown-beautifier code {
      background-color: #f5f5f7;
      border-radius: 4px;
      padding: 2px 5px;
      font-size: 14px;
      font-family: "SF Mono", Menlo, monospace;
      color: #494949;
    }
    
    .markdown-beautifier pre code {
      background-color: transparent;
      padding: 0;
    }
    
    .markdown-beautifier img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
      border-radius: 4px;
    }
    
    .markdown-beautifier table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      font-size: 15px;
    }
    
    .markdown-beautifier table th, .markdown-beautifier table td {
      border: 1px solid #e5e5e5;
      padding: 10px 16px;
      text-align: left;
    }
    
    .markdown-beautifier table th {
      background-color: #f5f5f7;
      font-weight: 600;
      color: #1d1d1f;
    }
    
    .markdown-beautifier hr {
      height: 1px;
      background-color: #e5e5e5;
      border: none;
      margin: 30px 0;
    }
    
    .markdown-beautifier .mermaid {
      margin: 24px 0;
      padding: 16px;
      background-color: #f9f9f9;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    .markdown-beautifier .mermaid svg {
      max-width: 100%;
      height: auto !important;
    }
    
    .markdown-beautifier .mermaid .node rect, 
    .markdown-beautifier .mermaid .node circle, 
    .markdown-beautifier .mermaid .node polygon {
      fill: #f5f5f7;
      stroke: #c7c7c7;
      stroke-width: 1px;
    }
    
    .markdown-beautifier .mermaid .label {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      color: #494949;
      font-size: 14px;
    }
    
    .markdown-beautifier .mermaid .edgeLabel {
      background-color: #f9f9f9;
      color: #494949;
    }
    
    .markdown-beautifier .mermaid .edgePath .path {
      stroke: #c7c7c7;
      stroke-width: 1.5px;
    }
    
    @media (prefers-color-scheme: dark) {
      .markdown-beautifier {
        background-color: #1d1d1f;
        color: #f5f5f7;
      }
      
      .markdown-beautifier h1,
      .markdown-beautifier h2,
      .markdown-beautifier h3 {
        color: #f5f5f7;
      }
      
      .markdown-beautifier p {
        color: #d1d1d6;
      }
      
      .markdown-beautifier a {
        color: #a1a1a6;
        border-bottom-color: #636366;
      }
      
      .markdown-beautifier a:hover {
        color: #ffffff;
        border-bottom-color: #ffffff;
      }
      
      .markdown-beautifier blockquote {
        background-color: #2c2c2e;
        color: #a1a1a6;
        border-left-color: #636366;
      }
      
      .markdown-beautifier pre,
      .markdown-beautifier code {
        background-color: #2c2c2e;
      }
      
      .markdown-beautifier code {
        color: #d1d1d6;
      }
      
      .markdown-beautifier table th {
        background-color: #2c2c2e;
        color: #f5f5f7;
      }
      
      .markdown-beautifier table th,
      .markdown-beautifier table td {
        border-color: #3a3a3c;
      }
      
      .markdown-beautifier .mermaid {
        background-color: #2c2c2e;
      }
      
      .markdown-beautifier .mermaid .node rect, 
      .markdown-beautifier .mermaid .node circle, 
      .markdown-beautifier .mermaid .node polygon {
        fill: #3a3a3c;
        stroke: #636366;
      }
      
      .markdown-beautifier .mermaid .label {
        color: #d1d1d6;
      }
      
      .markdown-beautifier .mermaid .edgeLabel {
        background-color: #2c2c2e;
        color: #d1d1d6;
      }
      
      .markdown-beautifier .mermaid .edgePath .path {
        stroke: #636366;
      }
    }
  `;

  // 添加的皇宫风格样式
  const imperialStyles = `
    .markdown-beautifier {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
      line-height: 1.6;
      color: #42321D;
      padding: 32px;
      max-width: 100%;
      font-size: 16px;
      background-color: #FFFBEF;
      background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.08' d='M8 0L9.2 1.2L10.4 0L11.2 1.2L12.8 0L13.6 1.2L15.2 0V1.6L16 2.4L14.8 3.6L16 4.8L14.8 5.6L16 6.8L14.8 8L16 9.2L14.8 10.4L16 11.6L14.4 12.8L16 14.4L14.4 16H12.8L11.6 14.4L10.4 16L9.2 14.4L8 16L6.8 14.4L5.6 16L4.4 14.4L3.2 16H1.6L0 14.4L1.6 12.8L0 11.6L1.2 10.4L0 9.2L1.2 8L0 6.8L1.2 5.6L0 4.8L1.2 3.6L0 2.4L0.8 1.6V0L2.4 1.2L3.2 0L4.8 1.2L5.6 0L6.8 1.2L8 0Z' fill='%23C9A353'/%3E%3C/svg%3E");
      position: relative;
      border: 1px solid rgba(201, 163, 83, 0.2);
    }
    
    .markdown-card-container {
      box-shadow: 0 4px 20px rgba(201, 163, 83, 0.15) !important;
      border-radius: 8px !important;
      background-color: #FFFBEF;
      overflow: hidden;
    }
    
    .markdown-beautifier h1, 
    .markdown-beautifier h2 {
      position: relative;
      font-weight: 700;
      color: #8C2F00;
      padding: 10px 0 10px 36px;
      margin: 12px 0 16px 0;
    }
    
    .markdown-beautifier h1::before,
    .markdown-beautifier h2::before {
      content: '👑';
      position: absolute;
      left: 0;
      top: calc(50% - 14px);
      font-size: 24px;
      opacity: 0.9;
    }
    
    .markdown-beautifier h1 {
      font-size: 22px;
      border-bottom: 2px solid rgba(201, 163, 83, 0.3);
      padding-bottom: 8px;
      margin: 16px 0 20px 0;
    }
    
    .markdown-beautifier h2 {
      font-size: 20px;
    }
    
    .markdown-beautifier h2::before {
      content: '🏯';
    }
    
    .markdown-beautifier h3 {
      font-size: 18px;
      color: #5D4215;
      position: relative;
      padding-left: 20px;
      margin: 14px 0 10px 0;
      font-weight: 600;
    }
    
    .markdown-beautifier h3::before {
      content: '「';
      position: absolute;
      left: 0;
      color: #C9A353;
      font-weight: 400;
    }
    
    .markdown-beautifier h3::after {
      content: '」';
      color: #C9A353;
      margin-left: 2px;
      font-weight: 400;
    }
    
    .markdown-beautifier p {
      margin-bottom: 14px;
      line-height: 1.7;
    }
    
    .markdown-beautifier ul {
      padding-left: 18px;
      margin-bottom: 16px;
      list-style-type: none;
    }
    
    .markdown-beautifier ul li {
      position: relative;
      padding-left: 24px;
      margin-bottom: 8px;
    }
    
    .markdown-beautifier ul li::before {
      content: '√';
      position: absolute;
      left: 0;
      color: #C9A353;
      font-weight: bold;
    }
    
    .markdown-beautifier strong {
      color: #8C2F00;
      font-weight: 600;
    }
    
    .markdown-beautifier a {
      color: #C9A353;
      text-decoration: none;
      border-bottom: 1px solid rgba(201, 163, 83, 0.3);
      transition: all 0.2s;
    }
    
    .markdown-beautifier a:hover {
      color: #8C2F00;
      border-color: #8C2F00;
    }
    
    .markdown-beautifier blockquote {
      border-left: 4px solid #C9A353;
      padding: 10px 15px;
      margin: 16px 0;
      background-color: rgba(201, 163, 83, 0.08);
      border-radius: 0 4px 4px 0;
    }
    
    .markdown-beautifier blockquote p {
      margin-bottom: 0;
    }
    
    .markdown-beautifier code {
      font-family: "SF Mono", Monaco, Menlo, monospace;
      background-color: rgba(201, 163, 83, 0.12);
      padding: 2px 4px;
      border-radius: 4px;
      font-size: 0.9em;
      color: #8C2F00;
    }
    
    .markdown-beautifier pre {
      background-color: rgba(201, 163, 83, 0.08);
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
    }
    
    .markdown-beautifier pre code {
      background-color: transparent;
      padding: 0;
      color: #5D4215;
    }
    
    @media (prefers-color-scheme: dark) {
      .markdown-beautifier {
        background-color: #2C2520;
        color: #E8D7B9;
        background-image: url("data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath opacity='0.15' d='M8 0L9.2 1.2L10.4 0L11.2 1.2L12.8 0L13.6 1.2L15.2 0V1.6L16 2.4L14.8 3.6L16 4.8L14.8 5.6L16 6.8L14.8 8L16 9.2L14.8 10.4L16 11.6L14.4 12.8L16 14.4L14.4 16H12.8L11.6 14.4L10.4 16L9.2 14.4L8 16L6.8 14.4L5.6 16L4.4 14.4L3.2 16H1.6L0 14.4L1.6 12.8L0 11.6L1.2 10.4L0 9.2L1.2 8L0 6.8L1.2 5.6L0 4.8L1.2 3.6L0 2.4L0.8 1.6V0L2.4 1.2L3.2 0L4.8 1.2L5.6 0L6.8 1.2L8 0Z' fill='%23C9A353'/%3E%3C/svg%3E");
        border: 1px solid rgba(201, 163, 83, 0.15);
      }
      
      .markdown-card-container {
        background-color: #2C2520;
      }
      
      .markdown-beautifier h1, 
      .markdown-beautifier h2 {
        color: #F3C677;
      }
      
      .markdown-beautifier h3 {
        color: #DFC27D;
      }
      
      .markdown-beautifier strong {
        color: #F3C677;
      }
      
      .markdown-beautifier a {
        color: #C9A353;
      }
      
      .markdown-beautifier a:hover {
        color: #F3C677;
      }
      
      .markdown-beautifier code {
        background-color: rgba(201, 163, 83, 0.2);
        color: #F3C677;
      }
      
      .markdown-beautifier pre code {
        color: #DFC27D;
      }
    }
  `;

  // 修改 .markdown-beautifier-container 样式
  const containerStyle = `
    .markdown-beautifier-container {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      width: 100%;
    }
  `;

  return (
    <div className="markdown-beautifier-container">
      <style>
        {cardContainerStyles}
        {theme === 'mobile' 
          ? mobileStyles 
          : theme === 'apple-notes' 
            ? appleNotesStyles 
            : theme === 'imperial'
              ? imperialStyles
              : theme === 'minimal-gray'
                ? minimalGrayStyles
                : documentStyles
        }
        {containerStyle}
      </style>
      
      <div className={`markdown-card-container ${isMobile ? 'mobile-view' : ''}`}>
        <div 
          ref={mermaidRef}
          className="markdown-beautifier"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
} 