import React from "react";
import RecordOutputMac from "@/components/shared/record-output-mac";
import { Navbar } from "@/components/shared/navbar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mac复制微信聊天记录教程 | E2D",
  description: "了解mac电脑如何复制导出微信聊天记录。",
};

export default function MacToolPage() {
  return (
    <>
      <Navbar />
      <div className="container mx-auto py-10 px-4 pt-20">
        <h1 className="text-3xl font-bold mb-6 text-center">Mac复制微信聊天记录教程</h1>
        <RecordOutputMac />
      </div>
    </>
  );
}