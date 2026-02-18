/* eslint-disable react/no-unescaped-entities */

import AccordionItem from "../../AccordionItem";

export default function HomeFaqSection() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-[#2D3748]">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <AccordionItem title="Is it safe? I don't want people watching my kids.">
            This is our top priority. We specialize in local storage options,
            meaning your footage stays in your house, not on a random server abroad.
            We also provide physical privacy shutters for indoor cameras for 100%
            certainty.
          </AccordionItem>
          <AccordionItem title="This seems expensive. I can probably find cheaper cameras online.">
            That's a common concern, and it's true, you can find standalone devices.
            But you're not just buying a camera, you're investing in your safety and
            security. We provide free consultation and site visits to really
            tailor-fit your needs. Plus our service doesn't end there, we provide
            support for your inquiries because we believe that a happy client is a
            long-time partner. A cheap camera that fails or is too complicated to use
            costs you more eventually. We guarantee your peace of mind is worth it.
          </AccordionItem>
          <AccordionItem title="This looks complicated to set up and use.">
            This is exactly why families choose us. You don't need to be "techy".
            We handle the entire technical side. Our experts will install everything,
            set up the app on your phone, and personally train you and your family
            until you're comfortable. We provide simple, step-by-step guides. In
            fact, our goal is to make it so simple that your lola or your kids can
            check the cameras. We make advanced technology feel effortless.
          </AccordionItem>
          <AccordionItem title="What happens after you install it? If something breaks, am I on my own?">
            This is where we are completely different. Our relationship starts after
            the installation. You get 1 year of warranty support via call, chat, or
            video. For ultimate peace of mind, you can add Home Protect Plus, which
            is like health insurance for your security system. Covering repairs and
            giving you priority support. We don't believe in 'sell and forget.' We
            protect your home for the long term.
          </AccordionItem>
          <AccordionItem title="I'm in a small apartment. Do I really need a security system?">
            Security isn't about the size of your home. It's about the safety of your
            family. This is why we created our affordable, pre-designed bundles. Our
            'Family of Four Fun-Sized Home Protection' bundle, for example, is
            specifically made for homes like yours. It covers the essential entry
            points without overcomplicating things or breaking the bank. Let's start
            with securing what matters most.
          </AccordionItem>
          <AccordionItem title="I can probably install it myself and save the installation fee.">
            You certainly could try, but consider the hidden costs. The hours of your
            time, the frustration of troubleshooting, potential Wi-Fi issues, and the
            risk of incorrect placement leaving critical blind spots. Our professional
            installation ensures optimal camera angles, secure and hidden wiring, and
            seamless integration of all devices from day one. We make it work
            perfectly the first time, so you can be confident your system is active
            and protecting your family.
          </AccordionItem>
          <AccordionItem title="How do I know your equipment is reliable and won't break down in a year?">
            We only use industry standard equipment built to withstand Philippine
            weather. Rain or Shine, it will be there. But more importantly, our
            guarantee isn't just on the device. It's on the entire system working
            together. With our yearly device health check service (included in some
            bundles or available as an upsell), we proactively ensure everything is
            running smoothly. We're not just a service provider, we're your long-term
            safety partner.
          </AccordionItem>
          <AccordionItem title="I need to think about it / discuss it with my family">
            We understand completely. Security is a family decision. However, while
            you're discussing, our limited installation slots for the upcoming weekend
            are filling up, and the stock of freebies (like the smoke detectors and
            first aid kits) is low. Why not take the first step at no cost? Let us
            provide you with a free personalized consultation. This will give your
            family all the concrete details, pricing, and a professional plan to
            discuss, making the decision much easier. Secure your free consultation
            now, and you'll have all the information you need in a minute.
          </AccordionItem>
        </div>
      </div>
    </section>
  );
}
