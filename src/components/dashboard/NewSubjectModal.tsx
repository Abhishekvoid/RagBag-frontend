import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useNotebookStore } from "@/lib/store/useNotebook";
import {
  subjectSchema,
  SubjectInput,
} from "@/features/notebook/notebook.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function NewSubjectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { addSubject } = useNotebookStore();

  const form = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleManualSubmit = async () => {
  console.log("🟣 You clicked the submit button");

  const result = await form.handleSubmit(
    async (values: SubjectInput) => {
      console.log("✅ Manual submit triggered!");
      console.log("📦 Submitted values:", values);

      try {
        await addSubject(values);
        form.reset();
        setIsOpen(false);
      } catch (error) {
        form.setError("root", {
          message: (error as Error).message,
        });
      }
    },
    (errors) => {
      // 🔥 This gets called when validation fails
      console.log("❌ Validation failed");
      console.log("🛠 Errors:", errors);
    }
  )();

  console.log("📤 handleSubmit finished");
};

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1">
          New Subject
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Subject</DialogTitle>
          <DialogDescription>
            Subjects help you organize your chapters and notes. Give it a clear name.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Quantum Physics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of the subject." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={form.formState.isSubmitting}
              onClick={handleManualSubmit}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create Subject"}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}