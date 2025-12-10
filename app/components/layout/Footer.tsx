export default function Footer(){
    return(
  <footer className="bg-[#2D3748] text-[#F7FAFC] py-20 border-t border-slate-700">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-white text-[#2D3748] font-serif font-bold px-2 py-1 text-xl tracking-tighter rounded-sm">SSH</div>
            <div className="font-bold text-white text-lg">SAFELY SECURED</div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            We prioritize your home security and automation so safe and seamless, your dream home possibilities are limitless.
          </p>
          <div className="text-xs text-[#0E79B2] font-medium tracking-wide uppercase">
            EST. 2025 • MANILA, PH
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
            <li>Manila, Philippines</li>
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">0995 995 9229</li>
            <li className="hover:text-[#63B3ED] cursor-pointer transition-colors">support@safelysecured.com</li>
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