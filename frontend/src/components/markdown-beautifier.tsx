import React from 'react';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

interface MarkdownBeautifierProps {
  markdown: string;
  theme?: 'mobile' | 'desktop';
}

export function MarkdownBeautifier({ markdown, theme = 'mobile' }: MarkdownBeautifierProps) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (str: string, lang: string) => {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        } catch (__) {}
      }
      return ''; // use external default escaping
    }
  });
  
  const html = md.render(markdown);
  
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

  return (
    <div className="relative">
      <style>{theme === 'mobile' ? mobileStyles : documentStyles}</style>
      <div 
        className="markdown-beautifier"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
} 