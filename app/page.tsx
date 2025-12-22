import AppShell from "./components/AppShell";
import LocalBusinessJsonLd from "./components/seo/LocalBusinessJsonLd";

export default function Page() {
  return (
    <>
      <LocalBusinessJsonLd />
      <AppShell initialView="home" />
    </>
  );
}
