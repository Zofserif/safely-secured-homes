/* eslint-disable react/no-unescaped-entities */
import { ChevronDown, Download, Hammer, HardDrive, Phone, Server, Video, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { CalculationResult, FormData } from "../../lib/types";

export default function DIYView({
  onBack,
  onCall,
  result,
  data,
}: {
  onBack: () => void;
  onCall: () => void;
  result: CalculationResult;
  data: FormData;
}){
  const [openStep, setOpenStep] = useState<number | null>(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const storageLabel = result.storage1TB ? "1TB+" : "500GB";
  const firstName = data.first_name?.trim() || "there";
  const priorityAreas = data.priority_areas?.filter(Boolean) ?? [];
  const storageRows = [
    { cams: 4, bitrate: "1 Mbps", days14: "~0.61 TB", days30: "~1.30 TB" },
    { cams: 4, bitrate: "2.5 Mbps", days14: "~1.51 TB", days30: "~3.24 TB" },
    { cams: 6, bitrate: "1 Mbps", days14: "~0.91 TB", days30: "~1.94 TB" },
    { cams: 6, bitrate: "2.5 Mbps", days14: "~2.27 TB", days30: "~4.86 TB" },
    { cams: 8, bitrate: "1 Mbps", days14: "~1.21 TB", days30: "~2.59 TB" },
    { cams: 8, bitrate: "2.5 Mbps", days14: "~3.02 TB", days30: "~6.48 TB" },
  ];
  const steps = [
    // Step 1
    {
      title: "Step 1: Quick Material Check (Personalized)",
      summary: "Personalized gear list and sizing basics.",
      details: "Confirm camera count, NVR size, storage, cable runs, and critical accessories.",
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            <strong className="text-slate-700">Recommended camera count:</strong>{" "}
            <span className="font-semibold text-slate-800">{result.cameraCount}</span> Cameras
          </p>
          {priorityAreas.length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-slate-700">Priority zones</p>
              <ul className="list-disc pl-5 space-y-1">
                {priorityAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 font-semibold text-slate-700">Quick CCTV camera types</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Choose <strong>turret style</strong> for outdoor if you want a less intimidating look.</li>
              <li>Choose <strong>bullet style</strong> for outdoor if you want a more visible deterrent.</li>
              <li>Choose <strong>dome style</strong> for indoor areas where you want a low profile camera.</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-slate-700">Resolution guidance</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>2MP (1080p):</strong> clear overview, IDs within about 3-5 m when framed well.</li>
              <li><strong>4MP (2K):</strong> better detail at medium distance. Our default pick.</li>
              <li><strong>8MP (4K):</strong> best for wide areas or zooming later. High-end pick.</li>
            </ul>
          </div>
          <p>
            <strong className="text-slate-700">NVR size:</strong> {result.nvrChannel} Channel (choose 8 or 16 if you plan to expand).
          </p>
          <p>
            <strong className="text-slate-700">HDD for retention:</strong> see the storage table below. We recommend at least {storageLabel}.
          </p>
          <p>
            <strong className="text-slate-700">Cable (CAT6):</strong> at least 50 meters per camera. Confirm routes from each camera to the NVR.
          </p>
          <div>
            <p className="mb-1 font-semibold text-slate-700">Also include (often forgotten but critical)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>UPS (600-1000 VA)</strong> for NVR + PoE + router to keep recording during brownouts.</li>
              <li>RJ45 plugs/keystones + tester, cable clips/conduit, weatherproof junction boxes.</li>
              <li>Silicone sealant for exterior penetrations, proper mounts/brackets.</li>
            </ul>
          </div>
          <p className="text-[11px] text-slate-500">
            Note: See DIY Shopping Shortcuts below for recommended gear links.
          </p>
        </div>
      ),
    },
    // Step 2
    {
      title: "Step 2: Map Your Coverage (Placements That Work)",
      summary: "Placement strategy for entrances and blind spots.",
      details: "Mark entrances first, place cameras clockwise, and set height/angles for clear faces.",
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <ul className="list-disc pl-5 space-y-1">
            <li>Print or sketch your floor plan. Mark all entrances first (high priority).</li>
            <li>Place cameras in a clockwise sequence to make reviewing footage easier.</li>
            <li><strong>Heights:</strong> 2.4-3.0 m (8-10 ft) to avoid tampering while keeping faces clear.</li>
            <li><strong>Angles:</strong> aim across the approach path, not straight at it, for less glare and better facial detail.</li>
            <li><strong>Avoid</strong> backlighting into the sun and reflective glass. Use WDR if available.</li>
            <li><strong>Privacy:</strong> use privacy masks to exclude neighbor windows/streets where needed.</li>
            <li><strong>Exterior rating:</strong> choose weatherproof housings for outdoor (IP66/67 class).</li>
          </ul>
          <div className="flex justify-center">
            <Image
              src="/assets/img/DIYView Assets/Camera Coverage and deadZones.png"
              alt="Camera coverage example"
              width={400}
              height={300}
              className="w-full max-w-md rounded-lg border border-slate-200"
            />
          </div>
        </div>
      ),
    },
    // Step 3
    {
      title: "Step 3: Make the Outside Bright (But Not Blinding)",
      summary: "Lighting tips for better night footage.",
      details: "Add motion lights, avoid backlighting, and keep light slightly off-axis from the camera.",
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <ul className="list-disc pl-5 space-y-1">
            <li>Place a small solar light near cameras and home entrances to improve visibility.</li>
            <li>Add <strong>motion/photocell lights</strong> near entrances and driveway. Target 400-800 lm per door area.</li>
            <li>Mount lights slightly off-axis from the camera to avoid washout.</li>
            <li>Prefer <strong>neutral-white</strong> (4000-5000 K) for color accuracy at night.</li>
            <li>If IR glare appears, adjust the hood/angle or shift light position 30-60 cm.</li>
          </ul>
          <p>One of the best easy to install night lights is something like this:</p>
          <div className="flex justify-center">
            <Image
              src="/assets/img/DIYView Assets/solar light.png"
              alt="Solar light example"
              width={144}
              height={144}
              className="w-36 rounded-lg border border-slate-200"
            />
          </div>
        </div>
      ),
    },
    // Step 4
    {
      title: "Step 4: Implementation Checklist (Step-by-Step)",
      summary: "Install, configure, and connect everything.",
      details: "Mount cameras, run cables, secure the NVR, and set up mobile access with strong passwords.",
      content: (
        <div className="space-y-4 text-xs text-slate-600">
          <div>
            <p className="mb-1 font-semibold text-slate-700">Hardware</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mount cameras, pull CAT6, terminate (PoE to switch), and label each run.</li>
              <li>Home-run cables to a central location (NVR, PoE switch, router, UPS).</li>
              <li>Keep Ethernet runs &lt;= 100 m. Test each line before final mounting.</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-slate-700">NVR setup (the brain)</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Update firmware, set a unique admin password, enable H.265 + 15 fps.</li>
              <li>Create user accounts (do not share admin).</li>
              <li>Set recording schedule (24/7 + motion bookmarks) and privacy masks.</li>
              <li>Configure retention days.</li>
              <li>Add push alerts (person/vehicle) for priority zones only to reduce noise.</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-slate-700">Mobile access</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>We recommend Hikvision brands for their "Hik-Connect" application.</li>
              <li>Install the app, add NVR, enable two-factor, and test remote on mobile data.</li>
              <li>Create a shared "Family view" role with limited permissions.</li>
            </ul>
          </div>
          <p>
            If you are having a hard time to install it, see this{" "}
            <a
              href="https://www.youtube.com/watch?v=d6d-qdejgFg"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#0E79B2] underline underline-offset-2"
            >
              Youtube video on how to install a complete security solution
            </a>
            .
          </p>
          <p>
            <strong>Brands we trust for reliability:</strong> Hikvision / Dahua / Uniview (UNV).{" "}
            <em>(We have seen many plug-and-play kits with unstable apps, frequent downtime, or no proper recording.)</em>
          </p>
        </div>
      ),
    },
    // Step 5
    {
      title: "Step 5: Storage Sizing (Grab-and-Go Table)",
      summary: "Quick storage math for common setups.",
      details: "Estimate storage by bitrate and choose the next HDD size up.",
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p className="text-[11px] text-slate-500">Quick math you can rely on. Add ~20% headroom.</p>
          <div>
            <p className="mb-1 font-semibold text-slate-700">Per camera, per day:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>1 Mbps ~ 10.8 GB/day</li>
              <li>2.5 Mbps ~ 27 GB/day (typical for 4MP with H.265 at about 15 fps)</li>
            </ul>
          </div>
          <div>
            <p className="mb-1 font-semibold text-slate-700">Example total storage need (rounded):</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="py-2">Cams</th>
                    <th className="py-2">Bitrate</th>
                    <th className="py-2">14 days</th>
                    <th className="py-2">30 days</th>
                  </tr>
                </thead>
                <tbody>
                  {storageRows.map((row) => (
                    <tr key={`${row.cams}-${row.bitrate}`} className="border-t border-slate-200">
                      <td className="py-2">{row.cams}</td>
                      <td className="py-2">{row.bitrate}</td>
                      <td className="py-2">{row.days14}</td>
                      <td className="py-2">{row.days30}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p>
            <strong>Pick the next HDD size up</strong> (for example, 4 TB instead of calculated 3.2 TB) so retention does not drop unexpectedly.
          </p>
        </div>
      ),
    },
    {
      title: "Step 6: Maintenance = Peace of Mind",
      summary: "Simple routine to keep things running.",
      details: "Clean lenses, update firmware, and test retention.",
      content: (
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
          <li>Quarterly camera clean and angle check.</li>
          <li>Review alerts and prune false triggers.</li>
          <li>Firmware and security updates.</li>
          <li>Verify UPS battery health annually.</li>
          <li>Export a test clip to confirm retention is working.</li>
        </ul>
      ),
    },
    {
      title: "Step 7: Enjoy Your Safely Secured Home",
      summary: "Know when to call the pros.",
      details: "If you want full service, we can design, install, and support your system.",
      content: (
        <p className="text-xs text-slate-600">
          You have come a long way in your smart home and security journey. If you feel stuck or need help,
          Safely Secured Homes is ready to assist. We can plan, install, and take care of your safe and smart home.
        </p>
      ),
    },
  ];
  const shoppingShortcuts = [
    {
      label: "CAT6 Cable (50/80/100 Meter) per camera",
      href: "https://shopee.ph/CAT6-Outdoor-RJ45-30M-40M-50M-60M-80M-100M-Network-Cable-Lan-Ethernet-Router-Internet-High-Quality-i.71033965.24126525316?extraParams=%7B%22display_model_id%22%3A245711477380%2C%22model_selection_logic%22%3A3%7D&sp_atk=efc91084-45c2-464a-888c-5153c660723f&xptdk=efc91084-45c2-464a-888c-5153c660723f",
    },
    {
      label: "NVR 4 Channel",
      href: "https://shopee.ph/HIKVISION-DS-7604NXI-K1-4P-4CH-4PoE-AcuSense-NVR-H.265-Video-Compression-40mbps-Incoming-Bandwidth-i.213244405.5854467251?extraParams=%7B%22display_model_id%22%3A226134793185%7D",
    },
    {
      label: "NVR 8 Channel",
      href: "https://shopee.ph/HikVision-DS-7608NXI-K1-8P-8Channel-8PoE-NVR-1-SATA-Interfaces-80mbps-Incoming-Bandwidth-i.213244405.14125866170?extraParams=%7B%22display_model_id%22%3A232468007732%7D",
    },
    {
      label: "Bullet Camera HD Resolution 1920x1080",
      href: "https://shopee.ph/HIKVISION-DS-2CD1027G2-LUF-G0-ColorVu-Lite-2MP-Outdoor-PoE-Bullet-Audio-IP-Network-CCTV-Camera-w-MIC-i.213244405.9568751912?extraParams=%7B%22display_model_id%22%3A98993066952%7D",
    },
    {
      label: "Turret Camera HD Resolution 1920x1080",
      href: "https://shopee.ph/HIKVISION-ColorVu-2MP-Audio-IP-Metal-Camera-Built-in-Mic-PoE-Outdoor-DS-2CD1327G2-LUF-NASHANTOO-i.213244405.9368734321?extraParams=%7B%22display_model_id%22%3A109517786651%7D",
    },
    {
      label: "Dome Camera HD Resolution 1920x1080",
      href: "https://shopee.ph/HIKVISION-DS-2CD2121G0-I-2MP-PoE-IR-Fixed-Dome-Network-Outdoor-IP-CCTV-Camera-(SD-card-not-included)-i.213244405.3056765199?extraParams=%7B%22display_model_id%22%3A242566029715%7D",
    },
    {
      label: "UPS (600-1000 VA)",
      href: "https://shopee.ph/Inplay-UPS-650VA-1000VA-2000VA-3000VA-With-AVR-Uninterruptible-Power-Supply-For-PC-Computer-Laptop-i.462016051.25941455025?extraParams=%7B%22display_model_id%22%3A69869833271%2C%22model_selection_logic%22%3A3%7D&sp_atk=8ba747ed-5a41-4421-9ba5-288fad723de3&xptdk=8ba747ed-5a41-4421-9ba5-288fad723de3",
    },
    {
      label: "Weatherproof junction boxes",
      href: "https://shopee.ph/IP65-Waterproof-CCTV-Junction-Box-Enclosure-100x100x70mm-85x85x50mm-Outdoor-Box-i.299909911.3679162993?extraParams=%7B%22display_model_id%22%3A53664627104%2C%22model_selection_logic%22%3A3%7D&rModelId=53664627104&sp_atk=222f8141-7843-455b-a150-e04011f4d9c0&vItemId=43812823420&vModelId=266074983830&vShopId=1257811163&xptdk=222f8141-7843-455b-a150-e04011f4d9c0",
    },
  ];
  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onBack]);

  const handleExportPdf = () => {
    const printable = window.open("", "_blank", "width=900,height=700");
    if (!printable) return;
    const logoUrl = encodeURI("/assets/img/Logo/navbar banner.png");
    const coverageImageUrl = encodeURI("/assets/img/DIYView Assets/Camera Coverage and deadZones.png");
    const lightingImageUrl = encodeURI("/assets/img/DIYView Assets/solar light.png");
    const safeFirstName = escapeHtml(firstName);
    const priorityAreasMarkup = priorityAreas.length
      ? `<div class="subsection">
          <div class="subheading">Priority zones</div>
          <ul class="list">
            ${priorityAreas.map((area) => `<li>${escapeHtml(area)}</li>`).join("")}
          </ul>
        </div>`
      : "";
    const storageRowsMarkup = storageRows
      .map((row) => `
        <tr>
          <td>${row.cams}</td>
          <td>${row.bitrate}</td>
          <td>${row.days14}</td>
          <td>${row.days30}</td>
        </tr>
      `)
      .join("");
    const shortcutsMarkup = shoppingShortcuts
      .map((item) => `
        <li>${escapeHtml(item.label)} - <a href="${item.href}" target="_blank" rel="noreferrer">Shopee link</a></li>
      `)
      .join("");
    const [step1, step2, step3, step4, step5, step6, step7] = steps;

    const stepsMarkup = [
      `
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step1.title)}</div>
            <div class="step-summary">${escapeHtml(step1.summary)}</div>
            <div class="step-details">${escapeHtml(step1.details)}</div>
            <div class="step-content">
              <p><strong>Recommended camera count:</strong> ${result.cameraCount} Cameras</p>
              ${priorityAreasMarkup}
              <div class="subsection">
                <div class="subheading">Quick CCTV camera types</div>
                <ul class="list">
                  <li>Choose turret style for outdoor if you want a less intimidating look.</li>
                  <li>Choose bullet style for outdoor if you want a more visible deterrent.</li>
                  <li>Choose dome style for indoor areas where you want a low profile camera.</li>
                </ul>
              </div>
              <div class="subsection">
                <div class="subheading">Resolution guidance</div>
                <ul class="list">
                  <li><strong>2MP (1080p):</strong> clear overview, IDs within about 3-5 m when framed well.</li>
                  <li><strong>4MP (2K):</strong> better detail at medium distance. Our default pick.</li>
                  <li><strong>8MP (4K):</strong> best for wide areas or zooming later. High-end pick.</li>
                </ul>
              </div>
              <p><strong>NVR size:</strong> ${result.nvrChannel} Channel (choose 8 or 16 if you plan to expand).</p>
              <p><strong>HDD for retention:</strong> see the storage table below. We recommend at least ${storageLabel}.</p>
              <p><strong>Cable (CAT6):</strong> at least 50 meters per camera. Confirm routes from each camera to the NVR.</p>
              <div class="subsection">
                <div class="subheading">Also include (often forgotten but critical)</div>
                <ul class="list">
                  <li><strong>UPS (600-1000 VA)</strong> for NVR + PoE + router to keep recording during brownouts.</li>
                  <li>RJ45 plugs/keystones + tester, cable clips/conduit, weatherproof junction boxes.</li>
                  <li>Silicone sealant for exterior penetrations, proper mounts/brackets.</li>
                </ul>
              </div>
              <p class="note">Note: See DIY Shopping Shortcuts below for recommended gear links.</p>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step2.title)}</div>
            <div class="step-summary">${escapeHtml(step2.summary)}</div>
            <div class="step-details">${escapeHtml(step2.details)}</div>
            <div class="step-content">
              <ul class="list">
                <li>Print or sketch your floor plan. Mark all entrances first (high priority).</li>
                <li>Place cameras in a clockwise sequence to make reviewing footage easier.</li>
                <li><strong>Heights:</strong> 2.4-3.0 m (8-10 ft) to avoid tampering while keeping faces clear.</li>
                <li><strong>Angles:</strong> aim across the approach path, not straight at it, for less glare and better facial detail.</li>
                <li><strong>Avoid</strong> backlighting into the sun and reflective glass. Use WDR if available.</li>
                <li><strong>Privacy:</strong> use privacy masks to exclude neighbor windows/streets where needed.</li>
                <li><strong>Exterior rating:</strong> choose weatherproof housings for outdoor (IP66/67 class).</li>
              </ul>
              <div class="image-wrap">
                <img src="${coverageImageUrl}" alt="Camera coverage example" class="step-image" />
              </div>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step3.title)}</div>
            <div class="step-summary">${escapeHtml(step3.summary)}</div>
            <div class="step-details">${escapeHtml(step3.details)}</div>
            <div class="step-content">
              <ul class="list">
                <li>Place a small solar light near cameras and home entrances to improve visibility.</li>
                <li>Add <strong>motion/photocell lights</strong> near entrances and driveway. Target 400-800 lm per door area.</li>
                <li>Mount lights slightly off-axis from the camera to avoid washout.</li>
                <li>Prefer <strong>neutral-white</strong> (4000-5000 K) for color accuracy at night.</li>
                <li>If IR glare appears, adjust the hood/angle or shift light position 30-60 cm.</li>
              </ul>
              <p>One of the best easy to install night lights is something like this:</p>
              <div class="image-wrap">
                <img src="${lightingImageUrl}" alt="Solar light example" class="step-image small" />
              </div>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step4.title)}</div>
            <div class="step-summary">${escapeHtml(step4.summary)}</div>
            <div class="step-details">${escapeHtml(step4.details)}</div>
            <div class="step-content">
              <div class="subsection">
                <div class="subheading">Hardware</div>
                <ul class="list">
                  <li>Mount cameras, pull CAT6, terminate (PoE to switch), and label each run.</li>
                  <li>Home-run cables to a central location (NVR, PoE switch, router, UPS).</li>
                  <li>Keep Ethernet runs &lt;= 100 m. Test each line before final mounting.</li>
                </ul>
              </div>
              <div class="subsection">
                <div class="subheading">NVR setup (the brain)</div>
                <ul class="list">
                  <li>Update firmware, set a unique admin password, enable H.265 + 15 fps.</li>
                  <li>Create user accounts (do not share admin).</li>
                  <li>Set recording schedule (24/7 + motion bookmarks) and privacy masks.</li>
                  <li>Configure retention days.</li>
                  <li>Add push alerts (person/vehicle) for priority zones only to reduce noise.</li>
                </ul>
              </div>
              <div class="subsection">
                <div class="subheading">Mobile access</div>
                <ul class="list">
                  <li>We recommend Hikvision brands for their "Hik-Connect" application.</li>
                  <li>Install the app, add NVR, enable two-factor, and test remote on mobile data.</li>
                  <li>Create a shared "Family view" role with limited permissions.</li>
                </ul>
              </div>
              <p>
                If you are having a hard time to install it, see this
                <a href="https://www.youtube.com/watch?v=d6d-qdejgFg" target="_blank" rel="noreferrer">
                  Youtube video on how to install a complete security solution
                </a>.
              </p>
              <p>
                <strong>Brands we trust for reliability:</strong> Hikvision / Dahua / Uniview (UNV).
                <em>(We have seen many plug-and-play kits with unstable apps, frequent downtime, or no proper recording.)</em>
              </p>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">5</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step5.title)}</div>
            <div class="step-summary">${escapeHtml(step5.summary)}</div>
            <div class="step-details">${escapeHtml(step5.details)}</div>
            <div class="step-content">
              <p class="note">Quick math you can rely on. Add about 20% headroom.</p>
              <div class="subsection">
                <div class="subheading">Per camera, per day:</div>
                <ul class="list">
                  <li>1 Mbps ~ 10.8 GB/day</li>
                  <li>2.5 Mbps ~ 27 GB/day (typical for 4MP with H.265 at about 15 fps)</li>
                </ul>
              </div>
              <div class="subsection">
                <div class="subheading">Example total storage need (rounded):</div>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Cams</th>
                      <th>Bitrate</th>
                      <th>14 days</th>
                      <th>30 days</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${storageRowsMarkup}
                  </tbody>
                </table>
              </div>
              <p><strong>Pick the next HDD size up</strong> (for example, 4 TB instead of calculated 3.2 TB) so retention does not drop unexpectedly.</p>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">6</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step6.title)}</div>
            <div class="step-summary">${escapeHtml(step6.summary)}</div>
            <div class="step-details">${escapeHtml(step6.details)}</div>
            <div class="step-content">
              <ul class="list">
                <li>Quarterly camera clean and angle check.</li>
                <li>Review alerts and prune false triggers.</li>
                <li>Firmware and security updates.</li>
                <li>Verify UPS battery health annually.</li>
                <li>Export a test clip to confirm retention is working.</li>
              </ul>
            </div>
          </div>
        </div>
      `,
      `
        <div class="step">
          <div class="step-number">7</div>
          <div class="step-body">
            <div class="step-title">${escapeHtml(step7.title)}</div>
            <div class="step-summary">${escapeHtml(step7.summary)}</div>
            <div class="step-details">${escapeHtml(step7.details)}</div>
            <div class="step-content">
              <p>
                You have come a long way in your smart home and security journey. If you feel stuck or need help,
                Safely Secured Homes is ready to assist. We can plan, install, and take care of your safe and smart home.
              </p>
            </div>
          </div>
        </div>
      `,
    ].join("");

    printable.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>DIY Security Plan</title>
          <style>
            body {
              font-family: "Arial", "Helvetica", sans-serif;
              color: #1a202c;
              margin: 40px;
            }
            a {
              color: #0e79b2;
              text-decoration: underline;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 16px;
            }
            .logo {
              max-height: 48px;
              width: auto;
              object-fit: contain;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            p {
              margin: 0 0 12px;
              font-size: 14px;
              color: #4a5568;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 12px;
              margin-bottom: 20px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px;
              text-align: center;
              background: #f7fafc;
            }
            .summary-value {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .summary-label {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #718096;
            }
            .step {
              display: flex;
              gap: 16px;
              padding: 16px 0;
              border-top: 1px solid #e2e8f0;
              page-break-inside: avoid;
            }
            .step-number {
              width: 32px;
              height: 32px;
              border-radius: 999px;
              background: #edf2f7;
              color: #718096;
              font-weight: bold;
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .step-title {
              font-weight: 700;
              font-size: 15px;
              margin-bottom: 4px;
            }
            .step-summary {
              font-size: 13px;
              margin-bottom: 6px;
            }
            .step-details {
              font-size: 12px;
              color: #4a5568;
              margin-bottom: 8px;
            }
            .step-content {
              font-size: 12px;
              color: #4a5568;
            }
            .subsection {
              margin-top: 10px;
            }
            .subheading {
              font-size: 12px;
              font-weight: 600;
              color: #2d3748;
              margin-bottom: 4px;
            }
            .list {
              margin: 6px 0 0;
              padding-left: 18px;
            }
            .list li {
              margin-bottom: 4px;
            }
            .image-wrap {
              display: flex;
              justify-content: center;
              margin-top: 8px;
            }
            .step-image {
              width: 100%;
              max-width: 520px;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            .step-image.small {
              max-width: 200px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            .table th,
            .table td {
              border-top: 1px solid #e2e8f0;
              padding: 6px 4px;
              text-align: left;
            }
            .table th {
              text-transform: uppercase;
              letter-spacing: 0.08em;
              font-size: 10px;
              color: #718096;
            }
            .section {
              border-top: 1px solid #e2e8f0;
              margin-top: 24px;
              padding-top: 16px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #2d3748;
              margin-bottom: 8px;
            }
            .section-subtitle {
              font-size: 12px;
              color: #4a5568;
              margin-bottom: 8px;
            }
            .callout {
              margin-top: 10px;
              padding: 10px 12px;
              border-radius: 10px;
              border: 1px solid #cbd5e0;
              background: #f7fafc;
              font-weight: 700;
              text-align: center;
              color: #2d3748;
            }
            .note {
              font-size: 11px;
              color: #718096;
            }
            .footer {
              margin-top: 32px;
              font-size: 12px;
              color: #718096;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Hi ${safeFirstName}!</h1>
              <p>Your tailored home security plan. Use this checklist to plan a basic home security camera setup.</p>
            </div>
            <img id="diy-logo" class="logo" src="${logoUrl}" alt="Safely Secured Homes" />
          </div>
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${result.cameraCount}</div>
              <div class="summary-label">Cameras</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${result.nvrChannel}</div>
              <div class="summary-label">Ch. NVR</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${storageLabel}</div>
              <div class="summary-label">Storage</div>
            </div>
          </div>
          ${stepsMarkup}
          <div class="section">
            <div class="section-title">Done-For-You Option</div>
            <p>Need help? For us to design, install, and care for everything end-to-end.</p>
            <div class="callout">Call Us Now 0995 995 9229</div>
          </div>
          <div class="section">
            <div class="section-title">DIY Shopping Shortcuts</div>
            <p class="section-subtitle">Quick links to the gear we recommend.</p>
            <ul class="list">
              ${shortcutsMarkup}
            </ul>
            <p class="note">
              <strong>Note:</strong> If you buy through these links, we may earn a small commission. These are affiliate links.
              We do not sell products. We focus on serving our customers first and only suggest brands that fit your needs.
            </p>
          </div>
          <script>
            (() => {
              let printed = false;
              const triggerPrint = () => {
                if (printed) return;
                printed = true;
                window.focus();
                window.print();
                window.onafterprint = () => window.close();
              };
              const images = Array.from(document.images);
              if (images.length === 0) {
                setTimeout(triggerPrint, 50);
                return;
              }
              let remaining = images.length;
              const onDone = () => {
                remaining -= 1;
                if (remaining <= 0) triggerPrint();
              };
              images.forEach((img) => {
                if (img.complete) {
                  onDone();
                } else {
                  img.onload = onDone;
                  img.onerror = onDone;
                }
              });
            })();
          </script>
        </body>
      </html>`);
    printable.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl relative overflow-hidden">
        <button onClick={onBack} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
        
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#BEE9E8] rounded-full flex items-center justify-center mx-auto mb-4">
              <Hammer className="w-8 h-8 text-[#0E79B2]" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D3748]">Hi {firstName}!</h2>
            <p className="text-slate-600 text-sm mt-1">Your tailored home security plan</p>
            <p className="text-slate-500 text-xs mt-2">DIY checklist, placements, and setup guidance.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#F7FAFC] p-3 rounded-xl border border-slate-100 text-center">
              <Video className="w-5 h-5 mx-auto text-[#0E79B2] mb-1" />
              <div className="text-lg font-bold text-[#2D3748]">{result.cameraCount}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cameras</div>
            </div>
            <div className="bg-[#F7FAFC] p-3 rounded-xl border border-slate-100 text-center">
              <Server className="w-5 h-5 mx-auto text-[#63B3ED] mb-1" />
              <div className="text-lg font-bold text-[#2D3748]">{result.nvrChannel}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ch. NVR</div>
            </div>
            <div className="bg-[#F7FAFC] p-3 rounded-xl border border-slate-100 text-center">
              <HardDrive className="w-5 h-5 mx-auto text-[#2E8B57] mb-1" />
              <div className="text-lg font-bold text-[#2D3748]">{storageLabel}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Storage</div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={handleExportPdf}
              className="w-full bg-white text-[#0E79B2] border border-[#0E79B2]/30 py-3 rounded-lg font-bold text-sm hover:bg-[#F7FAFC] transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export as PDF
            </button>
          </div>

          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const isOpen = openStep === index;
              return (
                <div key={step.title} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenStep(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`diy-step-${index}`}
                    className="w-full flex items-start justify-between gap-4 p-4 text-left"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2D3748]">{step.title}</h4>
                        <p className="text-xs text-slate-500">{step.summary}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div id={`diy-step-${index}`} className="px-4 pb-4">
                      {step.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#FFB300]/10 border border-[#FFB300]/30 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-[#2D3748] mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#FFB300]" /> Done-For-You Option
            </h4>
            <p className="text-[#2D3748] mb-4 text-sm">
              For us to design, install, and care for everything end-to-end, click the button.
            </p>
            <button
              onClick={onCall}
              className="w-full bg-[#0E79B2] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#0b5e8b] transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Call Us Now 0995 995 9229
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setShowShortcuts((prev) => !prev)}
              aria-expanded={showShortcuts}
              aria-controls="diy-shortcuts"
              className="w-full flex items-start justify-between gap-4 p-4 text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-[#2D3748]">DIY Shopping Shortcuts</h4>
                <p className="text-xs text-slate-500">Quick links to the gear we recommend.</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 mt-1 transition-transform ${showShortcuts ? "rotate-180" : ""}`} />
            </button>
            {showShortcuts && (
              <div id="diy-shortcuts" className="px-4 pb-4 text-xs text-slate-600 space-y-3">
                <ul className="list-disc pl-5 space-y-1">
                  {shoppingShortcuts.map((item) => (
                    <li key={item.href}>
                      {item.label} -{" "}
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#0E79B2] underline underline-offset-2"
                      >
                        Shopee link
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500">
                  <strong>Note:</strong> If you buy through these links, we may earn a small commission. These are affiliate links.
                  We do not sell products. We focus on serving our customers first and only suggest brands that fit your needs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
