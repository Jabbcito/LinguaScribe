
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Save, BookText, PanelLeftOpen, FilePlus2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/types/note";
import { NoteList } from "@/components/note-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as RadixAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initDB, getAllNotesDB, addNoteDB, updateNoteDB, deleteNoteDB, getNoteDB } from "@/lib/db";

const LS_EDITOR_CONTENT = "linguaScribe_editorMarkdownContent";
const LS_ACTIVE_NOTE_ID = "linguaScribe_activeNoteId";

export default function LinguaScribePage() {
  const [markdown, setMarkdown] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newNoteName, setNewNoteName] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Initialize to true

  const { toast } = useToast();

  // Load initial state (notes from IndexedDB, activeNoteId and editor content from localStorage)
  useEffect(() => {
    setIsLoading(true);
    const loadData = async () => {
      try {
        if (typeof window !== 'undefined' && window.indexedDB) {
          await initDB();
          const loadedNotesFromDB = await getAllNotesDB();
          setNotes(loadedNotesFromDB.sort((a,b) => b.lastModified - a.lastModified));

          const storedActiveNoteId = localStorage.getItem(LS_ACTIVE_NOTE_ID);
          let initialMarkdownContent = "";
          let resolvedActiveId: string | null = null;

          if (storedActiveNoteId) {
            const noteFromDb = loadedNotesFromDB.find(n => n.id === storedActiveNoteId);
            if (noteFromDb) {
              initialMarkdownContent = noteFromDb.content;
              resolvedActiveId = noteFromDb.id;
            } else {
              // Try to fetch from DB directly if not in the loaded list (e.g. list was empty, ID is stale)
              const directFetchedNote = await getNoteDB(storedActiveNoteId);
              if (directFetchedNote) {
                  initialMarkdownContent = directFetchedNote.content;
                  resolvedActiveId = directFetchedNote.id;
                  // Optionally add to notes list if it wasn't there for some reason
                  if (!loadedNotesFromDB.some(n => n.id === directFetchedNote.id)) {
                    setNotes(prev => [...prev, directFetchedNote].sort((a,b) => b.lastModified - a.lastModified));
                  }
              } else {
                localStorage.removeItem(LS_ACTIVE_NOTE_ID); // Clean up orphaned ID
                initialMarkdownContent = localStorage.getItem(LS_EDITOR_CONTENT) || '';
              }
            }
          } else {
            initialMarkdownContent = localStorage.getItem(LS_EDITOR_CONTENT) || '';
          }
          
          setMarkdown(initialMarkdownContent);
          setActiveNoteId(resolvedActiveId);
        } else {
          // Fallback or error for environments without IndexedDB
          toast({ title: "Storage Error", description: "IndexedDB not supported. Notes cannot be saved.", variant: "destructive" });
          setMarkdown(localStorage.getItem(LS_EDITOR_CONTENT) || ''); // Still try to load scratchpad
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({ title: "Error", description: `Could not load notes: ${error instanceof Error ? error.message : 'Unknown error'}. Some features may not work.`, variant: "destructive" });
        setNotes([]); 
        setMarkdown(localStorage.getItem(LS_EDITOR_CONTENT) || "");
        setActiveNoteId(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Only run once on mount

  // Persist activeNoteId to localStorage
  useEffect(() => {
    if (isLoading) return;
    try {
      if (activeNoteId) {
        localStorage.setItem(LS_ACTIVE_NOTE_ID, activeNoteId);
      } else {
        localStorage.removeItem(LS_ACTIVE_NOTE_ID);
      }
    } catch (error) {
      console.error("Error saving activeNoteId to localStorage:", error);
    }
  }, [activeNoteId, isLoading]);

  // Persist current markdown content (editor buffer) to localStorage
  useEffect(() => {
    if (isLoading) return;
    const handler = setTimeout(() => {
      try {
        // Only save to LS_EDITOR_CONTENT if no note is active.
        // This acts as a scratchpad for unsaved new notes.
        if (!activeNoteId) {
            localStorage.setItem(LS_EDITOR_CONTENT, markdown);
        }
      } catch (error) {
        console.error("Error saving editor content to localStorage:", error);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [markdown, isLoading, activeNoteId]);


  const handleNewNote = useCallback(() => {
    setActiveNoteId(null);
    setMarkdown(""); // Clear editor for new note
    localStorage.setItem(LS_EDITOR_CONTENT, ""); // Also clear the localStorage scratchpad
    toast({ title: "New Note", description: "Editor cleared for a new note."});
    setIsSidebarOpen(false); 
  }, [toast]);

  const handleOpenNote = useCallback((noteId: string) => {
    const noteToOpen = notes.find(n => n.id === noteId);
    if (noteToOpen) {
      // If current editor content is for a "new note" (no activeNoteId) and is not empty,
      // consider preserving it or warning user. For now, we overwrite.
      if (!activeNoteId && markdown.trim() !== "") {
        localStorage.setItem(LS_EDITOR_CONTENT, markdown); // Save scratchpad before opening
         toast({ title: "Scratchpad Saved", description: "Current unsaved content was saved to scratchpad.", variant: "default" });
      }
      setActiveNoteId(noteToOpen.id);
      setMarkdown(noteToOpen.content);
      localStorage.removeItem(LS_EDITOR_CONTENT); // Clear scratchpad as an active note is now loaded
      toast({ title: "Note Opened", description: `"${noteToOpen.name}" loaded into editor.`});
      setIsSidebarOpen(false); 
    }
  }, [notes, toast, activeNoteId, markdown]);

  const handleSaveNote = async () => {
    if (activeNoteId) {
      const noteIndex = notes.findIndex(n => n.id === activeNoteId);
      if (noteIndex > -1) {
        const updatedNote = {
          ...notes[noteIndex],
          content: markdown,
          lastModified: Date.now(),
        };
        try {
          await updateNoteDB(updatedNote);
          const updatedNotes = [...notes];
          updatedNotes[noteIndex] = updatedNote;
          setNotes(updatedNotes.sort((a,b) => b.lastModified - a.lastModified));
          toast({ title: "Note Updated", description: `"${updatedNote.name}" has been saved.` });
        } catch (error) {
          console.error("Error updating note:", error);
          toast({ title: "Update Error", description: `Could not update note: ${error instanceof Error ? error.message : 'Unknown error'}.`, variant: "destructive" });
        }
      }
    } else {
      // If there's content but no active note, it's a new note being saved.
      if (markdown.trim() === "") {
        toast({ title: "Empty Note", description: "Cannot save an empty note. Type something first!", variant: "destructive" });
        return;
      }
      setNewNoteName("Untitled Note"); // Default name
      setIsSaveModalOpen(true);
    }
  };

  const completeNewNoteSave = async () => {
    if (!newNoteName.trim()) {
      toast({ title: "Save Error", description: "Note name cannot be empty.", variant: "destructive" });
      return;
    }
    const newId = Date.now().toString();
    const newNoteData: Note = {
      id: newId,
      name: newNoteName.trim(),
      content: markdown,
      lastModified: Date.now(),
    };
    try {
      await addNoteDB(newNoteData);
      setNotes(prevNotes => [newNoteData, ...prevNotes].sort((a,b) => b.lastModified - a.lastModified));
      setActiveNoteId(newId);
      toast({ title: "Note Saved", description: `"${newNoteData.name}" has been created.` });
      setIsSaveModalOpen(false);
      setNewNoteName("");
      localStorage.removeItem(LS_EDITOR_CONTENT); // Clear scratchpad after saving as a new note
    } catch (error) {
      console.error("Error saving new note:", error);
      toast({ title: "Save Error", description: `Could not save new note: ${error instanceof Error ? error.message : 'Unknown error'}.`, variant: "destructive" });
    }
  };

  const handleDeleteNote = useCallback(async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    try {
      await deleteNoteDB(noteId);
      setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId).sort((a,b) => b.lastModified - a.lastModified));
      toast({ title: "Note Deleted", description: `"${noteToDelete.name}" has been deleted.`});
      if (activeNoteId === noteId) {
        // If the active note was deleted, clear the editor (like new note)
        setActiveNoteId(null);
        setMarkdown("");
        localStorage.setItem(LS_EDITOR_CONTENT, ""); 
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({ title: "Delete Error", description: `Could not delete note: ${error instanceof Error ? error.message : 'Unknown error'}.`, variant: "destructive" });
    }
  }, [notes, activeNoteId, toast]);
  
  const handleExportNote = () => {
    if (notes.length === 0) {
      toast({
        title: "No Notes",
        description: "There are no notes to export.",
        variant: "default",
      });
      return;
    }

    // Notes are already sorted by lastModified descending in the state
    const contentParts: string[] = [];

    notes.forEach(note => {
      let noteBlock = `# ${note.name.trim() || 'Untitled Note'}\n\n`;
      noteBlock += `${note.content.trim()}\n`; // Ensure one newline at the end of content
      contentParts.push(noteBlock);
    });

    const combinedContent = contentParts.join('\n---\n\n'); // Separator: newline, ---, two newlines

    const fileName = "All LinguaScribe Notes.md";
    const blob = new Blob([combinedContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "All Notes Exported", description: `"${fileName}" has been downloaded.` });
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <BookText className="h-12 w-12 text-primary animate-pulse" />
        <p className="ml-4 text-xl">Loading LinguaScribe...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <AlertDialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <RadixAlertDialogTitle>Name Your Note</RadixAlertDialogTitle>
            <AlertDialogDescription>
              Please enter a name for your new note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="note-name">Note Name</Label>
            <Input
              id="note-name"
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              placeholder="e.g., Meeting Minutes"
              autoFocus
              onKeyDown={(e) => {if (e.key === 'Enter' && newNoteName.trim()) { e.preventDefault(); completeNewNoteSave();}}}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={completeNewNoteSave} disabled={!newNoteName.trim()}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="flex items-center justify-between p-3 border-b sticky top-0 bg-background/95 backdrop-blur z-20">
        <div className="flex items-center gap-2">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Toggle Notes List" className="h-9 w-9">
                <PanelLeftOpen className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full max-w-xs sm:max-w-sm flex flex-col">
              <SheetHeader className="p-3 border-b">
                <SheetTitle>My Notes</SheetTitle>
              </SheetHeader>
              <NoteList
                notes={notes}
                activeNoteId={activeNoteId}
                onOpenNote={handleOpenNote}
                onDeleteNote={handleDeleteNote}
                onNewNote={handleNewNote}
              />
            </SheetContent>
          </Sheet>
          <BookText className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold">LinguaScribe</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleNewNote} aria-label="New Note" title="New Note" className="hidden sm:inline-flex">
            <FilePlus2 className="mr-2 h-4 w-4" />
            New
          </Button>
           <Button variant="default" onClick={handleSaveNote} aria-label="Save Note">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
           <Button variant="outline" onClick={handleExportNote} aria-label="Export All Notes" title="Export All Notes">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <ThemeToggle />
        </div>
      </header>
      
      <div className="sm:hidden p-2 border-b flex justify-start">
         <Button variant="outline" onClick={handleNewNote} aria-label="New Note" title="New Note" className="w-full">
            <FilePlus2 className="mr-2 h-4 w-4" />
            New Note
          </Button>
      </div>


      <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden p-1 sm:p-2">
        <div className="h-full overflow-hidden flex flex-col p-1 sm:p-2">
           <MarkdownEditor
            value={markdown}
            onChange={setMarkdown}
            placeholder="Type your Markdown note here, or use the microphone..."
          />
        </div>
        <div className="h-full overflow-hidden flex flex-col p-1 sm:p-2 border-l-0 md:border-l">
          <MarkdownPreview markdown={markdown} />
        </div>
      </main>
    </div>
  );
}

