import { useState } from "react";
import { useForm, FieldErrors } from "react-hook-form"; // Ensure FieldErrors is imported
import { zodResolver } from "@hookform/resolvers/zod";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { subjectInputSchema, SubjectInput } from "@/features/notebook/notebook.schema";
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
    resolver: zodResolver(subjectInputSchema),
    defaultValues: { name: "", description: "" },
  });

  // This success handler is correct
  const onSubmit = async (values: SubjectInput) => {
    console.log("✅ Validation successful! Preparing to submit...");
    console.log("📦 Submitted values:", values);
    try {
      console.log("⏳ Calling the addSubject action...");
      await addSubject(values);
      console.log("🎉 Subject added to store successfully!");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error("🔥 Submission Error:", errorMessage);
      form.setError("root", { message: errorMessage });
    }
  };

  // This error handler is correct
  const onError = (errors: FieldErrors<SubjectInput>) => {
    console.log("❌ Form validation failed!");
    console.log("🛠 Errors:", errors);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="flex-1">
          New Subject
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg border border-white/20">
        <Form {...form}>
          {/* ✅ CHANGED: The onSubmit handler is now connected to the form */}
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Create a New Subject</DialogTitle>
              <DialogDescription>
                Subjects help you organize your chapters and notes. Give it a clear name.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
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
            </div>

            {/* ✅ CHANGED: The DialogFooter is now INSIDE the form element */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {/* ✅ CHANGED: Button is now type="submit" and has no onClick handler */}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}