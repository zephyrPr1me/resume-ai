"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/50 border border-border rounded-2xl mb-6 shadow-sm animate-[pulse_4s_ease-in-out_infinite]">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>

        {/* Градиентный заголовок 404 */}
        <h1 className="text-7xl font-bold mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
          404
        </h1>

        <h2 className="text-2xl font-semibold mb-3 text-foreground">
          Страница не найдена
        </h2>

        <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          К сожалению, страница, которую вы ищете, не существует, была удалена или перемещена.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <Home className="w-4 h-4" />
            На главную
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-all border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}
