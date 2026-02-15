import type { Metadata } from "next";
import AppShell from "./components/AppShell";
import LocalBusinessJsonLd from "./components/seo/LocalBusinessJsonLd";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return (
    <>
      <LocalBusinessJsonLd />
      <AppShell initialView="home" />
    </>
  );
}
