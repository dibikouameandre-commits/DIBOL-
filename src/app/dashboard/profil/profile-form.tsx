"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/server/profile";
import {
  updateProfileSchema,
  type UpdateProfileValues,
} from "@/lib/validations/profile";

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: defaultName },
  });

  const onSubmit = async (values: UpdateProfileValues) => {
    setIsSubmitting(true);
    const result = await updateProfile(values);
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    await update({ name: values.name });
    toast.success("Profil mis à jour");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nom</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
