import React from "react";
import RecordOutputWin from "@/components/shared/record-output-win";
import { Navbar } from "@/components/shared/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Windows工具使用教程 | E2D",
  description: "了解如何使用MemoTrace工具导出微信聊天记录，并将数据转换为可分析的格式。",
};

export default function WinToolPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto py-10 px-4 pt-20">
        <h1 className="text-3xl font-bold mb-6 text-center">Windows工具使用教程</h1>
        <RecordOutputWin />
      </div>
    </>
  );
}
