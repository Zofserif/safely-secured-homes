export default function Footer(){
    return(
  <footer className="bg-[#2D3748] text-[#F7FAFC] py-20 border-t border-slate-700">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <img
              src="/assets/img/Logo/footer banner white.png"
              alt="Safely Secured Homes Logo"
              className="h-10 w-auto"
            />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            We prioritize your home security and automation so safe and seamless, your dream home possibilities are limitless.
          </p>
          <div className="text-xs text-[#0E79B2] font-medium tracking-wide uppercase">
            EST. 2025 • CANDELARIA, QUEZON • PH
          </div>
        </div>
        <div>
          <h3 className="font-bold text-white mb-6 tracking-wide text-sm uppercase">Services</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">Security Consultation</li>
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">CCTV Installation</li>
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">Smart Home Integration</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white mb-6 tracking-wide text-sm uppercase">Contact</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li>
              <a
                className="hover:text-[#63B3ED] transition-colors inline-flex items-center gap-2"
                href="https://www.facebook.com/profile.php?id=61581014067336"
                target="_blank"
                rel="noreferrer"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V12H8v3h2v6h3v-6h2.2l.3-3H13v-2.2c0-.5.4-.8.8-.8z" />
                </svg>
                <span>Facebook Page</span>
              </a>
            </li>
            <li>
              <a className="hover:text-[#63B3ED] transition-colors" href="tel:09959959229">
                0995 995 9229
              </a>
            </li>
            <li>
              <a
                className="hover:text-[#63B3ED] transition-colors"
                href="mailto:safelysecuredhomes@gmail.com"
              >
                safelysecuredhomes@gmail.com
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white mb-6 tracking-wide text-sm uppercase">Legal</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">Privacy Policy</li>
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-700 mt-16 pt-8 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center">
        <span>© 2025 Safely Secured Homes. All rights reserved.</span>
        <span className="mt-2 md:mt-0">Designed for peace of mind.</span>
      </div>
    </div>
  </footer>
);
}
