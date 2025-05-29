
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MarkdownEditor } from "@/components/markdown-editor";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Save, BookText, PanelLeftOpen, FilePlus2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Note } from "@/types/note";
import { NoteList } from "@/components/note-list";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LS_EDITOR_CONTENT = "linguaScribe_editorMarkdownContent";
const LS_NOTES_COLLECTION = "linguaScribe_notesCollection";
const LS_ACTIVE_NOTE_ID = "linguaScribe_activeNoteId";

export default function LinguaScribePage() {
  const [markdown, setMarkdown] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newNoteName, setNewNoteName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const storedNotesData = localStorage.getItem(LS_NOTES_COLLECTION);
      const loadedNotes: Note[] = storedNotesData ? JSON.parse(storedNotesData) : [];
      setNotes(loadedNotes);

      const storedActiveNoteId = localStorage.getItem(LS_ACTIVE_NOTE_ID);
      let initialMarkdownContent = "";
      let resolvedActiveId: string | null = null;

      if (storedActiveNoteId) {
        const note = loadedNotes.find(n => n.id === storedActiveNoteId);
        if (note) {
          initialMarkdownContent = note.content;
          resolvedActiveId = note.id;
        } else {
          localStorage.removeItem(LS_ACTIVE_NOTE_ID); // Clean up orphaned ID
          initialMarkdownContent = localStorage.getItem(LS_EDITOR_CONTENT) || '';
        }
      } else {
        initialMarkdownContent = localStorage.getItem(LS_EDITOR_CONTENT) || '';
      }
      
      setMarkdown(initialMarkdownContent);
      setActiveNoteId(resolvedActiveId);
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      toast({ title: "Error", description: "Could not load notes from local storage.", variant: "destructive" });
      // Fallback to defaults
      setMarkdown("");
      setNotes([]);
      setActiveNoteId(null);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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
        localStorage.setItem(LS_EDITOR_CONTENT, markdown);
      } catch (error) {
        console.error("Error saving editor content to localStorage:", error);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [markdown, isLoading]);

  // Persist notes collection to localStorage
  useEffect(() => {
    if (isLoading) return;
    try {
      localStorage.setItem(LS_NOTES_COLLECTION, JSON.stringify(notes));
    } catch (error) {
      console.error("Error saving notes collection to localStorage:", error);
    }
  }, [notes, isLoading]);


  const handleNewNote = useCallback(() => {
    setActiveNoteId(null);
    setMarkdown("");
    toast({ title: "New Note", description: "Editor cleared for a new note."});
    setIsSidebarOpen(false); // Close sidebar if open
  }, [toast]);

  const handleOpenNote = useCallback((noteId: string) => {
    const noteToOpen = notes.find(n => n.id === noteId);
    if (noteToOpen) {
      setActiveNoteId(noteToOpen.id);
      setMarkdown(noteToOpen.content);
      toast({ title: "Note Opened", description: `"${noteToOpen.name}" loaded into editor.`});
      setIsSidebarOpen(false); // Close sidebar
    }
  }, [notes, toast]);

  const handleSaveNote = () => {
    if (activeNoteId) {
      // Update existing note
      const noteIndex = notes.findIndex(n => n.id === activeNoteId);
      if (noteIndex > -1) {
        const updatedNotes = [...notes];
        const updatedNote = {
          ...updatedNotes[noteIndex],
          content: markdown,
          lastModified: Date.now(),
        };
        updatedNotes[noteIndex] = updatedNote;
        setNotes(updatedNotes);
        toast({ title: "Note Updated", description: `"${updatedNote.name}" has been saved.` });
      }
    } else {
      // Save new note - open modal for name
      setNewNoteName( activeNoteId ? notes.find(n=>n.id === activeNoteId)?.name || "Untitled Note" : "Untitled Note");
      setIsSaveModalOpen(true);
    }
  };

  const completeNewNoteSave = () => {
    if (!newNoteName.trim()) {
      toast({ title: "Save Error", description: "Note name cannot be empty.", variant: "destructive" });
      return;
    }
    const newId = Date.now().toString();
    const newNote: Note = {
      id: newId,
      name: newNoteName.trim(),
      content: markdown,
      lastModified: Date.now(),
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setActiveNoteId(newId);
    toast({ title: "Note Saved", description: `"${newNote.name}" has been created.` });
    setIsSaveModalOpen(false);
    setNewNoteName("");
  };

  const handleDeleteNote = useCallback((noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
    toast({ title: "Note Deleted", description: `"${noteToDelete.name}" has been deleted.`});
    if (activeNoteId === noteId) {
      handleNewNote(); // Clear editor if active note was deleted
    }
  }, [notes, activeNoteId, toast, handleNewNote]);
  
  // Original download functionality, now as "Export" (can be added later)
  // const handleExportNote = ()_=> { ... }


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
            <AlertDialogTitle>Name Your Note</AlertDialogTitle>
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
              onKeyDown={(e) => {if (e.key === 'Enter') { e.preventDefault(); completeNewNoteSave();}}}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={completeNewNoteSave}>Save</AlertDialogAction>
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
            Save Note
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
