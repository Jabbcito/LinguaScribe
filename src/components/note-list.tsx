import type { Note } from "@/types/note";
import { NoteListItem } from "@/components/note-list-item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onOpenNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onNewNote: () => void;
}

export function NoteList({
  notes,
  activeNoteId,
  onOpenNote,
  onDeleteNote,
}: NoteListProps) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b">
        <h2 className="text-lg font-semibold">My Notes</h2>
      </div>
      <ScrollArea className="flex-grow">
        {notes.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No notes yet. Create one!</p>
        ) : (
          <div className="p-2 space-y-1">
            {notes.sort((a,b) => b.lastModified - a.lastModified).map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onOpenNote={onOpenNote}
                onDeleteNote={onDeleteNote}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      <Separator />
      {/* "New Note" button is now in the main header for better visibility */}
    </div>
  );
}
