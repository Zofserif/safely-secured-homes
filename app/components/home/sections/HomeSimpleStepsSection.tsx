/* eslint-disable @next/next/no-img-element */

export default function HomeSimpleStepsSection() {
  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-20 text-[#2D3748]">
          3 Simple Steps to be &quot;Smart and Safe&quot;
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              img: "/assets/img/3 Simple Steps/Step 1.png",
              title: "Step 1: Consult with us",
              desc: "Get a free consultation on-the-go or contact us for via phone.",
            },
            {
              img: "/assets/img/3 Simple Steps/Step 2.png",
              title: "Step 2: On-site checkup",
              desc: "We visit your home to assess coverage and connectivity.",
            },
            {
              img: "/assets/img/3 Simple Steps/Step 3.png",
              title: "Step 3: Install & protect",
              desc: "We set up, secure, and teach you how everything works.",
            },
          ].map((step, i) => (
            <div key={i} className="group cursor-default">
              <div className="mb-8 relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 group-hover:shadow-[#0E79B2]/20 transition-all duration-500 aspect-square border-4 border-white">
                <div className="absolute inset-0 bg-[#2D3748]/0 group-hover:bg-[#2D3748]/10 transition-colors z-10"></div>
                <img
                  src={step.img}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
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
  );
}
