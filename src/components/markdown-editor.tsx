"use client";

import { transcribeAudio, type TranscribeAudioInput } from "@/ai/flows/voice-to-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, Square } from "lucide-react";
import { useState, useRef, type ChangeEvent, type FC } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const MarkdownEditor: FC<MarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Stop microphone tracks
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size === 0) {
          toast({ title: "Recording Error", description: "No audio data captured.", variant: "destructive" });
          return;
        }
        
        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const audioDataUri = reader.result as string;
            const input: TranscribeAudioInput = { audioDataUri };
            const result = await transcribeAudio(input);
            if (result.transcription) {
              onChange(value + (value ? "\n" : "") + result.transcription);
              toast({ title: "Transcription Complete", description: "Text added to editor." });
            } else {
              toast({ title: "Transcription Failed", description: "Could not transcribe audio.", variant: "destructive" });
            }
          };
          reader.onerror = () => {
             toast({ title: "File Read Error", description: "Could not read audio data.", variant: "destructive" });
          }
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error("Transcription error:", error);
          toast({ title: "Transcription Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording Started", description: "Press the button again to stop." });
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Error", description: "Could not access microphone. Please check permissions.", variant: "destructive" });
      setIsRecording(false);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Start typing your note or use the microphone..."}
        className="flex-grow resize-none text-base leading-relaxed p-4 rounded-md border"
        aria-label="Markdown Note Editor"
      />
      <Button
        onClick={handleRecord}
        disabled={isTranscribing}
        variant="outline"
        className="w-full sm:w-auto"
        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
      >
        {isTranscribing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="mr-2 h-4 w-4 text-destructive" />
        ) : (
          <Mic className="mr-2 h-4 w-4" />
        )}
        {isTranscribing ? "Transcribing..." : isRecording ? "Stop Recording" : "Record Audio"}
      </Button>
    </div>
  );
};
