import type { Metadata } from "next";
import AppShell from "./components/AppShell";
import LocalBusinessJsonLd from "./components/seo/LocalBusinessJsonLd";
import { getPublicSiteSettings } from "./lib/siteAdminSettingsServer";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const publicSiteSettings = await getPublicSiteSettings();

  return (
    <>
      <LocalBusinessJsonLd />
      <AppShell initialView="home" publicSiteSettings={publicSiteSettings} />
    </>
  );
}
