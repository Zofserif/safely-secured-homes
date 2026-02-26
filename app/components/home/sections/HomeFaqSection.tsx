import AccordionItem from "../../AccordionItem";

export default function HomeFaqSection() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-[#2D3748]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <AccordionItem title="Is it safe? I don&apos;t want anyone watching my kids at home.">
            Privacy is our top priority. We recommend local-first storage, strong
            account security, and camera placements that protect your family
            without making your bahay feel intrusive.
          </AccordionItem>
          <AccordionItem title="Seems expensive. Why not just buy cheaper cameras online?">
            You can buy cheaper devices, but most families need a complete system
            that works reliably day to day. We recommend only what matches your
            budget and avoids costly blind spots, repeat purchases, or rework.
          </AccordionItem>
          <AccordionItem title="Looks complicated. What if my family isn&apos;t techy?">
            You don&apos;t need to be techy. We keep the setup simple for daily use,
            then guide your household until everyone is comfortable, from kids to
            lola.
          </AccordionItem>
          <AccordionItem title="After installation, will you still support us?">
            We stay involved after installation with warranty-backed support and
            responsive assistance when issues come up. We&apos;re built for
            long-term reliability, not one-time setup.
          </AccordionItem>
          <AccordionItem title="Can I discuss first with my family before deciding?">
            That&apos;s completely fair. Start with the free personalized plan so your
            family can review clear recommendations and pricing options together,
            then decide at your own pace, without commitment.
          </AccordionItem>
        </div>
      </div>
    </section>
  );
}
