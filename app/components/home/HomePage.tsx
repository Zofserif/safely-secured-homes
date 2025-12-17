/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { motion } from "framer-motion";
import { Award, CheckCircle2, ChevronRight, FileCheck, Gift, HeartHandshake, List, ListChecks, Lock, MapPin, Moon, Quote, Shield, ShieldCheck, Signal, Sparkles, Activity } from "lucide-react";
import { useState } from "react";
import ReasonItem from "../ReasonItem";
import AccordionItem from "../AccordionItem";
import CertModal from "../layout/CertModal";

export default function HomePage({ onNavigate }: { onNavigate: (p: string) => void }){
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  return (
    <div className="overflow-x-hidden bg-[#F7FAFC]">
      {showCertModal && <CertModal onClose={() => setShowCertModal(false)} />}
      {/* Hero */}
      {/* Reduced vertical padding on mobile (sm:pt-20 sm:pb-20) and fixed image sizing */}
      <section className="relative pt-6 pb-16 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        {/* Background elements - Secondary color used subtly */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-[#BEE9E8]/40 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-[#BEE9E8]/30 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

        <div className="container mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          
          {/* UPDATED: Hero Image is now FIRST on mobile, but smaller */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="block relative lg:order-last" // Order-last on desktop puts it right, default first on mobile
          >
            <div className="absolute inset-0 bg-linear-to-tr from-[#2D3748]/10 to-transparent rounded-4xl transform rotate-3 lg:rotate-6 scale-105 z-0"></div>
            <div className="relative rounded-4xl overflow-hidden shadow-2xl border-4 border-white z-10 h-64 lg:h-[600px]">
              <Image
                src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
                alt="Happy Family in Secure Home"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4 lg:p-8">
                <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#2E8B57]" /> 100% Secure & Private
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white border border-[#BEE9E8] rounded-full px-4 py-1.5 mb-6 lg:mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#2E8B57] animate-pulse"></span>
              <span className="text-[#2D3748] font-semibold text-xs uppercase tracking-wide">
                For Families Who Want Protection Without Losing Comfort
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-7xl font-bold text-[#2D3748] mb-6 lg:mb-8 leading-[1.1] tracking-tight">
              Your Safer, <br/>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2D3748] via-[#0E79B2] to-[#2D3748] decoration-[#0E79B2] decoration-4 underline underline-offset-4">Smarter Home</span> <span className="text-[#0E79B2] font-serif italic">Today</span>
            </h1>
            
            <p className="text-slate-600 text-lg lg:text-xl leading-relaxed mb-8 lg:mb-10 max-w-lg">
              In just 60 seconds, get a <strong>FREE, no-obligation security plan</strong> tailored to your home layout and family needs. See your personal plan and price instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <button 
                onClick={() => onNavigate('form')}
                className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-lg px-8 py-4 rounded-xl font-bold shadow-xl shadow-[#0E79B2]/20 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-2 group w-full sm:w-auto"
              >
                GET MY FREE PLAN NOW 
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Lead Magnet Badge - Keep visible */}
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-[#BEE9E8] shadow-lg animate-bounce-slow w-full sm:w-auto">
                <div className="bg-[#BEE9E8]/50 p-2 rounded-lg text-[#0E79B2]">
                  <Gift className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#0E79B2] uppercase tracking-wider">Free Bonus Included</span>
                  <span className="text-xs font-bold text-[#2D3748]">"5 Secrets to a Panatag Home" PDF</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Trust Indicators */}
        <div className="container mx-auto mt-12 lg:mt-16 pt-10 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-4 lg:gap-16 opacity-80 hover:opacity-100 transition-all duration-500">
            {["Peace of Mind, Anywhere", "A Safer, Happier Family Home", "Modern Convenience Without Stress"].map((text, i) => (
              <div key={i} className="flex items-center gap-3 font-semibold text-[#2D3748] text-sm lg:text-base">
                <div className="bg-[#2E8B57]/10 p-1 rounded-full"><CheckCircle2 className="text-[#2E8B57] w-4 h-4 lg:w-5 lg:h-5" /></div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-32 bg-white relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-[#2D3748] mb-6">
              Do you worry about your family&apos;s <span className="text-[#0E79B2] underline decoration-4 underline-offset-4">safety</span> at home?
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Whether you’re at work, stuck in traffic, or out of town, that “what if?” never fully goes away.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: "Away But Unsure", desc: "When you’re not home, you can’t confidently tell if everything’s ok. You keep refreshing apps, texting neighbors, and hoping you didn’t miss an alert." },
              { icon: Moon, title: "Restless Nights", desc: "You lie awake listening for every creak, worrying about doors, windows, and blind spots instead of sleeping peacefully." },
              { icon: Activity, title: "Always On Alert", desc: "You double-check locks and cameras during family time — you’re never fully present because safety is always on your mind." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="group p-8 bg-[#F7FAFC] rounded-3xl border border-slate-100 hover:border-[#63B3ED] hover:bg-white hover:shadow-2xl hover:shadow-[#0E79B2]/5 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#0E79B2] group-hover:text-white transition-colors">
                  <item.icon className="w-7 h-7 text-[#2D3748] group-hover:text-white" />
                </div>
                <h3 className="font-bold text-xl text-[#2D3748] mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-[#F7FAFC] border-b border-slate-200">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#2D3748] mb-4">What Our Clients Say</h2>
            <p className="text-slate-600">Families across Luzon sleep soundly because of Safely Secured Homes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                text: "The installation was super fast and clean. Troy explained everything clearly. Now I can check on my kids even when I'm at the office.",
                author: "Maria S.",
                location: "Quezon City"
              },
              {
                text: "We had a break-in scare in our village, so we called them. They set up the cameras the same week. The peace of mind is priceless.",
                author: "James D.",
                location: "Makati"
              },
              {
                text: "I'm not good with tech, but the app is so easy to use. The video quality is amazing even at night. Highly recommended!",
                author: "Elena R.",
                location: "Laguna"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
                <Quote className="w-8 h-8 text-[#BEE9E8] absolute top-4 left-4" />
                <p className="text-slate-600 mb-6 mt-8 relative z-10 italic">&quot;{testimonial.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0E79B2] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-[#2D3748] text-sm">{testimonial.author}</div>
                    <div className="text-xs text-slate-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section - Luxury Style with Certifications */}
      <section className="py-32 bg-[#2D3748] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="w-full lg:w-1/2">
              <div className="relative mx-auto max-w-md">
                <img
                  src="/assets/img/About us Assets/Smart casual circle profile picture.png"
                  alt="Troy - Founder"
                  className="relative rounded-4xl w-full shadow-2xl border border-slate-600/50"
                  width={400}
                  height={400}
                />
                
                {/* Certifications Badge - STATIC on mobile, FLOAT on large screens */}
                <div 
                  className="md:absolute md:-bottom-10 md:-right-10 bg-white text-[#2D3748] p-6 rounded-2xl shadow-xl max-w-xs mx-auto mt-8 md:mt-0 md:mx-0 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setShowCertModal(true)}
                >
                  <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                    <Award className="w-6 h-6 text-[#0E79B2]" />
                    <span className="font-bold text-lg">Certified Expert</span>
                  </div>
                  <ul className="space-y-2 pointer-events-none">
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                      Hikvision Security Associate
                    </li>
                    <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                      System Surveyor
                    </li>
                  </ul>
                  <div className="text-center mt-3">
                     <span className="text-xs text-[#0E79B2] font-semibold underline">View Certificate</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="inline-block px-4 py-1 rounded-full border border-[#63B3ED]/30 bg-[#63B3ED]/10 text-[#63B3ED] text-xs font-bold uppercase tracking-widest mb-6">
                Our Mission
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Your <span className="text-[#63B3ED] italic">Safe</span> & <span className="text-[#63B3ED] italic">Smart</span> Home, <br/>Without the Hassle
              </h2>
              <div className="space-y-6 text-slate-300 text-lg leading-relaxed font-light">
                <p>
                  You lie in bed at night running through the checklist. You&apos;ve looked into smart home security, but it&apos;s a dizzying maze of confusing gadgets.
                </p>
                <div className="pl-6 border-l-4 border-[#0E79B2] my-8">
                  <p className="text-white text-xl italic font-serif">
                    &quot;You’re trusting us with your home and your peace of mind and I take that personally.&quot;
                  </p>
                </div>
                <p>
                  Hi I’m <strong>Troy</strong>, founder of Safely Secured Homes. Growing up, my parents were often away for work, and as the eldest I looked after my younger brother. That responsibility shaped my mission: make home safety simple, reliable, and stress-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trust Us - Grid Layout */}
      <section className="py-32 bg-[#F7FAFC]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-[#2D3748]">Why trust us with your purchase?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: ListChecks, title: "Only what you need", desc: "Honest recommendations that respect your budget." },
              { icon: Lock, title: "Privacy first", desc: "Secure setups so you control who sees what, from anywhere." },
              { icon: HeartHandshake, title: "We’re here after install", desc: "Friendly training and responsive support when you need it." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-transparent hover:border-[#BEE9E8] transition-all">
                <div className="w-20 h-20 bg-[#F7FAFC] rounded-full flex items-center justify-center mb-6 shadow-inner text-[#0E79B2]">
                  <item.icon className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-[#2D3748]">{item.title}</h3>
                <p className="text-slate-600 max-w-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Simple Steps */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-20 text-[#2D3748]">3 Simple Steps to be &quot;Smart and Safe&quot;</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { img: "/assets/img/Simple Step Assets/Step 1.webp", title: "Step 1: Consult with us", desc: "Get a free consultation on-the-go or contact us for via phone." },
              { img: "/assets/img/Simple Step Assets/Step 2.webp", title: "Step 2: On-site checkup", desc: "We visit your home to assess coverage and connectivity." },
              { img: "/assets/img/Simple Step Assets/Step 3.webp", title: "Step 3: Install & protect", desc: "We set up, secure, and teach you how everything works." },
            ].map((step, i) => (
              <div key={i} className="group cursor-default">
                <div className="mb-8 relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 group-hover:shadow-[#0E79B2]/20 transition-all duration-500 aspect-square border-4 border-white">
                   <div className="absolute inset-0 bg-[#2D3748]/0 group-hover:bg-[#2D3748]/10 transition-colors z-10"></div>
                   <img 
                     src={step.img} 
                     alt={step.title} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                   />
                   <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl text-[#0E79B2] shadow-lg z-20">
                     {i + 1}
                   </div>
                </div>
                <h3 className="font-bold text-2xl mb-4 text-[#2D3748]">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 Reasons & Features - Split Dark/Light */}
      <div className="grid lg:grid-cols-2">
        <section className="py-24 px-6 lg:px-20 bg-[#2D3748] text-white">
          <h2 className="text-3xl font-bold mb-12">10 Reasons Why Clients Choose Us</h2>
          <div className="space-y-4">
            {[
              { title: "Get a Perfect, Personalized Plan", desc: "We recognize that every home and family is unique. Our experts take the time to understand your specific needs and lifestyle, then design a custom security and smart home plan just for you." },
              { title: "Effortless, Bundled Packages", desc: "Whether you live in an apartment or a mansion, we have designed security bundles that offer incredible value. Each bundle clearly lists the features and house size it's designed for." },
              { title: "Free Consultation & Transparent Quotes", desc: "We begin with a complimentary consultation. Then, our experts design a personalized plan and provide a transparent, itemized quote. No hidden fees, no pressure." },
              { title: "Complete Worry-Free Solutions", desc: "From the initial 1-on-1 site visit and consultation to expert installation, ongoing maintenance, and all-day support, we handle everything. We protect homes, not just sell and forget." },
              { title: "Exclusive \"Home Protect Pro\" Monitoring", desc: "Go beyond DIY monitoring. Our team actively helps you monitor your home, filtering false alarms and sending only critical alerts. Limited capacity to ensure premium service." },
              { title: "Unbeatable Value", desc: "Our prices are final and transparent, covering top-tier equipment, professional installation, and robust after-sales support. Premium security without the premium price tag." },
              { title: "Priority Support (10AM-7PM)", desc: "Feel confident with daily access to our security experts via chat, call, email, or video for inquiries, guidance, or troubleshooting." },
              { title: "Exclusive Freebies for Immediate Action", desc: "We have a limited stock of freebies (like first aid kits, smoke detectors, and padlocks) with every purchase. Act now to secure your spot." },
              { title: "Seamless Smart Home Integration", desc: "Control your lights, locks, and more from your phone. We make it easy to integrate smart home devices that offer convenience and additional safety." },
              { title: "\"One Weekend Wonder\" Install Promise", desc: "For our standard installation, if we don't finish within one week, you don't pay the rest of the installation fee. We are committed to minimal disruption." }
            ].map((reason, i) => (
              <ReasonItem 
                key={i} 
                title={reason.title} 
                desc={reason.desc} 
                isOpen={expandedReason === i}
                onClick={() => setExpandedReason(expandedReason === i ? null : i)}
              />
            ))}
          </div>
        </section>

        <section className="py-24 px-6 lg:px-20 bg-[#F7FAFC]">
          <h2 className="text-3xl font-bold mb-4 text-[#2D3748]">What we <span className="text-[#0E79B2] underline decoration-4">provide</span></h2>
          <p className="text-slate-600 mb-12 text-lg">
            We provide the complete integrated system. From home security to smart home, we deliver a seamless experience.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: List, title: "Free Design", desc: "Custom-tailored system for your layout." },
              { icon: Sparkles, title: "Premium Products", desc: "High-quality CCTV & Smart devices." },
              { icon: Signal, title: "Smart Integration", desc: "Control lights & locks remotely." },
              { icon: Shield, title: "Pro Monitoring", desc: "Smart event filtering & reports." },
              { icon: ShieldCheck, title: "Protection Plans", desc: "1-year warranty & health checks." },
              { icon: HeartHandshake, title: "Continuous Support", desc: "Daily assistance via call/chat." }
            ].map((feat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-[#0E79B2] transition-colors">
                <feat.icon className="w-8 h-8 text-[#0E79B2] mb-4" />
                <h4 className="font-bold text-[#2D3748] text-lg mb-2">{feat.title}</h4>
                <p className="text-sm text-slate-500">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAQ */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 text-[#2D3748]">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <AccordionItem title="This seems expensive. I can probably find cheaper cameras online.">
              That's a common concern, and it's true, you can find standalone devices. But you're not just buying a camera, you're investing in your safety and security. We provide free consultation and site visits to really tailor-fit your needs. Plus our service doesn't end there, we provide support for your inquiries because we believe that a happy client is a long-time partner. A cheap camera that fails or is too complicated to use costs you more eventually. We guarantee your peace of mind is worth it.
            </AccordionItem>
            <AccordionItem title="This looks complicated to set up and use.">
              This is exactly why families choose us. You don't need to be "techy". We handle the entire technical side. Our experts will install everything, set up the app on your phone, and personally train you and your family until you're comfortable. We provide simple, step-by-step guides. In fact, our goal is to make it so simple that your lola or your kids can check the cameras. We make advanced technology feel effortless.
            </AccordionItem>
            <AccordionItem title="What happens after you install it? If something breaks, am I on my own?">
              This is where we are completely different. Our relationship starts after the installation. You get 1 year of warranty support via call, chat, or video. For ultimate peace of mind, you can add Home Protect Plus, which is like health insurance for your security system. Covering repairs and giving you priority support. We don't believe in 'sell and forget.' We protect your home for the long term.
            </AccordionItem>
            <AccordionItem title="I'm in a small apartment. Do I really need a security system?">
              Security isn't about the size of your home. It's about the safety of your family. This is why we created our affordable, pre-designed bundles. Our 'Family of Four Fun-Sized Home Protection' bundle, for example, is specifically made for homes like yours. It covers the essential entry points without overcomplicating things or breaking the bank. Let's start with securing what matters most.
            </AccordionItem>
            <AccordionItem title="I can probably install it myself and save the installation fee.">
              You certainly could try, but consider the hidden costs. The hours of your time, the frustration of troubleshooting, potential Wi-Fi issues, and the risk of incorrect placement leaving critical blind spots. Our professional installation ensures optimal camera angles, secure and hidden wiring, and seamless integration of all devices from day one. We make it work perfectly the first time, so you can be confident your system is active and protecting your family.
            </AccordionItem>
            <AccordionItem title="How do I know your equipment is reliable and won't break down in a year?">
              We only use industry standard equipment built to withstand Philippine weather. Rain or Shine, it will be there. But more importantly, our guarantee isn't just on the device. It's on the entire system working together. With our yearly device health check service (included in some bundles or available as an upsell), we proactively ensure everything is running smoothly. We're not just a service provider, we're your long-term safety partner.
            </AccordionItem>
            <AccordionItem title="I need to think about it / discuss it with my family">
              We understand completely. Security is a family decision. However, while you're discussing, our limited installation slots for the upcoming weekend are filling up, and the stock of freebies (like the smoke detectors and first aid kits) is low. Why not take the first step at no cost? Let us provide you with a free personalized consultation. This will give your family all the concrete details, pricing, and a professional plan to discuss, making the decision much easier. Secure your free consultation now, and you'll have all the information you need in a minute.
            </AccordionItem>
          </div>
        </div>
      </section>

      {/* CTA Banner - Luxury Style */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-[#2D3748] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#2D3748]/30">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0E79B2]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready for a Panatag Home?</h2>
              <p className="text-slate-300 text-xl mb-12">
                Consult now and get a <span className="text-[#63B3ED] font-bold">FREE Bonus</span>: "5 Must-Have Secrets to a Panatag Home" PDF Guide.
              </p>
              <button 
                onClick={() => onNavigate('form')}
                className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-lg px-12 py-5 rounded-full font-bold shadow-lg shadow-[#0E79B2]/25 transition-all hover:scale-105"
              >
                GET MY FREE PLAN NOW
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
