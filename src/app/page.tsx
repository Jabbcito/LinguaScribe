"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Save, BookText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LinguaScribePage() {
  const [markdown, setMarkdown] = useState<string>("");
  const { toast } = useToast();

  // Debounce mechanism for preview update can be added here if performance issues arise with large texts.
  // For now, direct update is fine.

  const handleSaveNote = () => {
    if (!markdown.trim()) {
      toast({
        title: "Empty Note",
        description: "Cannot save an empty note.",
        variant: "destructive",
      });
      return;
    }
    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `linguascribe-note-${timestamp}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Note Saved",
        description: "Your note has been downloaded as a .md file.",
      });
    } catch (error) {
      console.error("Failed to save note:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the note.",
        variant: "destructive",
      });
    }
  };
  
  // Persist markdown to localStorage
  useEffect(() => {
    const savedMarkdown = localStorage.getItem("linguaScribeNote");
    if (savedMarkdown) {
      setMarkdown(savedMarkdown);
    }
  }, []);

  useEffect(() => {
    // Debounce localStorage saving
    const handler = setTimeout(() => {
      localStorage.setItem("linguaScribeNote", markdown);
    }, 500); 
    return () => clearTimeout(handler);
  }, [markdown]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="flex items-center justify-between p-3 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <BookText className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold">LinguaScribe</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveNote} aria-label="Save Note">
            <Save className="mr-2 h-4 w-4" />
            Save Note
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden p-1 sm:p-2">
        <div className="h-full overflow-hidden flex flex-col p-1 sm:p-2">
           <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            placeholder="Type your Markdown note here, or use the microphone..."
          />
        </div>
        <div className="h-full overflow-hidden flex flex-col p-1 sm:p-2">
          <MarkdownPreview markdown={markdown} />
        </div>
      </main>
    </div>
  );
}
