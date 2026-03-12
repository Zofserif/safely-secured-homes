import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "../lib/adminAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminIndexPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/blog");
  }

  redirect("/admin/login");
}
