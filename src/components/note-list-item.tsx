import type { Note } from "@/types/note";
import { Button } from "@/components/ui/button";
import { FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onOpenNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NoteListItem({ note, isActive, onOpenNote, onDeleteNote }: NoteListItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the note when deleting
    onDeleteNote(note.id);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer",
        isActive && "bg-accent text-accent-foreground"
      )}
      onClick={() => onOpenNote(note.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpenNote(note.id)}
    >
      <div className="flex items-center gap-2 truncate">
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="truncate text-sm">{note.name}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={handleDelete}
        aria-label={`Delete note ${note.name}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
