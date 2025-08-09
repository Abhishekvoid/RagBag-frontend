"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { chapterSchema, ChapterInput } from "@/features/notebook/notebook.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewChapterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: string | null;
}

export function NewChapterModal({ isOpen, onOpenChange, defaultSubjectId }: NewChapterModalProps) {
  const { subjects, addChapter } = useNotebookStore();

  const form = useForm<ChapterInput>({
    resolver: zodResolver(chapterSchema),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: "",
        subject: defaultSubjectId || null,
        order: 1,
      });
    }
  }, [isOpen, defaultSubjectId, form]);

  const onSubmit = async (values: ChapterInput) => {
    try {
      await addChapter(values);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      form.setError("root", { message: (error as Error).message });
    }
  };

   return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle>Create a New Chapter</DialogTitle>
          <DialogDescription>
            Give your new chapter a name. You can assign it to a subject now or later.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Introduction to Kinematics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (Optional)</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => {
                      field.onChange(value === "none" ? null : value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <em>No Subject</em>
                      </SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Chapter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>

    </Dialog>
  );
}