-- Seed the initial 3 blog posts into public.blog_posts.
-- Safe to rerun: this script uses UPSERT by slug.

insert into public.blog_posts (
  slug,
  subject,
  title,
  content,
  preview_text,
  cta,
  cta_markdown,
  status,
  published_at,
  newsletter_enabled,
  created_at,
  updated_at
)
values
  (
    'camera-placement-mistakes-families-make',
    'Who Carries the "What-Ifs" for Your Home Tonight?',
    'Who Carries the "What-Ifs" for Your Home Tonight?',
    $post_1$
<h2>The Weight of the What-Ifs</h2>
<p>Thank you for trusting us with your home. While my team prepares your plan, I wanted to share a quick story.</p>
<p>My dad had a strict nightly routine. Before sleeping, he would check the gate, double-check every door, turn off the lights, and check the stove. We were always half-asleep by then, but he never missed a single night.</p>
<p>Sometimes, he would even sleep on the sofa just to be sure he would be the first to respond if something happened.</p>
<p>When I got older, as the oldest son, that responsibility fell onto me. I began to carry those same what-ifs every night.</p>
<h2>The Real Problem We Solve</h2>
<p>It was then I truly understood my dad. He was not just afraid of burglars. He was afraid of the feeling of being unsafe in his own dream home.</p>
<p>That realization hit me hard. Because that is the problem we truly solve. It is not just about cameras and sensors. It is about turning off the what-ifs in your head, so you can finally turn off the lights and sleep.</p>
<p>Your home should be where your worries end, not where they begin.</p>
<h2>Your First Step to Peaceful Nights</h2>
<p>While we build your custom solution, this free guide is your first key to quieting those worries. It is packed with the foundational secrets we share with all our clients.</p>
<p>Download your guide: The 5 Secrets to a Panatag Home.</p>
<p>This is not just a PDF. It is the first chapter in your family's story of deeper, safer sleep.</p>
<ul>
  <li>Download and read your guide. It will get you thinking like a security pro.</li>
  <li>My team will email you soon with your personalized plan.</li>
  <li>Start your journey to becoming the client with a story that ends with "I finally sleep soundly."</li>
</ul>
    $post_1$,
    'A personal story about nightly worries, peace of mind, and the first practical step families can take to feel safer at home.',
    '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Get My Free Plan</a></div>',
    '[Get My Free Plan](https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan)',
    'published',
    timestamptz '2026-01-28T00:00:00Z',
    false,
    timestamptz '2026-01-28T00:00:00Z',
    timestamptz '2026-01-28T00:00:00Z'
  ),
  (
    'weekly-security-routine-15-minutes',
    'A 15-Minute Weekly Security Routine for Busy Families',
    'A 15-Minute Weekly Security Routine for Busy Families',
    $post_2$
<h2>Why Weekly Checks Beat Annual Panic</h2>
<p>Most issues are small at first: a dirty lens, muted alert, or weak battery in a sensor. Weekly checks catch these early, so your system stays dependable when you need it.</p>
<p>You do not need a full audit. A short routine tied to an existing habit, like Sunday evening planning, is enough to maintain confidence.</p>
<ul>
  <li>Assign one adult owner and one backup owner.</li>
  <li>Use a fixed 15-minute schedule each week.</li>
  <li>Track checks in a shared note so everyone sees status.</li>
</ul>
<h2>The 15-Minute Checklist</h2>
<p>Run the same sequence each week so the routine stays easy to remember. Keep it practical and avoid adding steps you cannot maintain.</p>
<ul>
  <li>Minute 1-5: Confirm camera live view and playback.</li>
  <li>Minute 6-9: Trigger one alert and verify push notification.</li>
  <li>Minute 10-12: Check door/window sensors and battery levels.</li>
  <li>Minute 13-15: Review emergency contacts and response steps.</li>
</ul>
<h2>Make It Stick for the Whole Household</h2>
<p>Security should not depend on one person remembering everything. Create simple instructions that other family members can follow when you are away.</p>
<p>Even a short printed emergency guide near your router or control panel can reduce delays during stressful moments.</p>
<ul>
  <li>Post your emergency contacts in two places.</li>
  <li>Store backup power and flashlight in a labeled location.</li>
  <li>Practice one response scenario every month.</li>
</ul>
$post_2$,
    'Security systems degrade silently. This short weekly routine keeps your cameras, alerts, and emergency readiness reliable without adding stress to your schedule.',
    '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>',
    'Need help deciding? [Book a Free Site Visit](https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call)',
    'published',
    timestamptz '2026-01-20T00:00:00Z',
    false,
    timestamptz '2026-01-20T00:00:00Z',
    timestamptz '2026-01-20T00:00:00Z'
  ),
  (
    'smart-lighting-rules-for-safer-nights',
    'Smart Lighting Rules That Make Homes Safer at Night',
    'Smart Lighting Rules That Make Homes Safer at Night',
    $post_3$
<h2>Lighting Is a Security Tool, Not Just Ambiance</h2>
<p>Well-planned exterior lighting discourages unwanted activity and helps visitors move safely. It also improves identification quality in camera footage.</p>
<p>The best setup combines steady base lighting with motion-triggered boost in critical approach zones.</p>
<ul>
  <li>Keep entry paths visible with low glare lighting.</li>
  <li>Use motion lights near gate, driveway, and side access.</li>
  <li>Avoid creating deep shadows near doors and windows.</li>
</ul>
<h2>Scheduling Rules That Feel Natural</h2>
<p>Strict on/off timers can make a home look predictable. Instead, build lighting rules that reflect real household patterns and seasonal sunset changes.</p>
<p>Smart scenes let you switch multiple fixtures at once when the family arrives home or when everyone goes to bed.</p>
<ul>
  <li>Set sunset-based automation, not fixed time only.</li>
  <li>Add a gentle randomization window for selected lights.</li>
  <li>Create one-tap Night Mode that arms lights and cameras together.</li>
</ul>
<h2>Protect Camera Visibility While Improving Comfort</h2>
<p>A bright but poorly aimed light can wash out your video. Place fixtures so they illuminate faces and pathways without shining directly into camera lenses.</p>
<p>Review footage after lighting adjustments and tune intensity in small steps until details are clear.</p>
<ul>
  <li>Use warm white or neutral white for clearer skin-tone detail.</li>
  <li>Position fixtures above and slightly behind approach paths.</li>
  <li>Re-check footage after rain, since reflections can change exposure.</li>
</ul>
$post_3$,
    'Good lighting improves prevention and video quality. Learn where to place lights, what schedules to use, and how to avoid glare that weakens camera footage.',
    '',
    '',
    'published',
    timestamptz '2026-01-12T00:00:00Z',
    false,
    timestamptz '2026-01-12T00:00:00Z',
    timestamptz '2026-01-12T00:00:00Z'
  ),
  (
    'what-happens-during-a-home-security-site-visit',
    'What Happens During a Home Security Site Visit?',
    'What Happens During a Home Security Site Visit?',
    $post_4$
<h2>A Site Visit Is a Planning Session, Not a Pressure Tactic</h2>
<p>A good site visit should help your family feel clearer, not more overwhelmed. The goal is to understand your layout, your daily routines, and the practical risks around your entry points, blind spots, lighting, and emergency readiness.</p>
<p>We are not there to push the biggest package. We are there to identify what actually matters for your home and what can wait.</p>
<h2>What We Usually Check</h2>
<p>Every home is different, but most visits include a walk-through of the gate, main door, side access, driveway, windows, stairways, and any areas where visibility drops at night.</p>
<ul>
  <li>Entry points that need stronger visibility or deterrence.</li>
  <li>Camera placements that avoid glare and capture useful angles.</li>
  <li>Lighting opportunities that improve both safety and footage quality.</li>
  <li>Power, storage, and wiring constraints that affect reliability.</li>
</ul>
<h2>How To Prepare for the Visit</h2>
<p>You do not need a perfect checklist. It helps to gather the household concerns that come up most often: late arrivals, children coming home first, blind spots near the gate, or the areas that feel least secure after dark.</p>
<ul>
  <li>List the 2 or 3 zones that worry you most.</li>
  <li>Note who needs app access, alerts, or playback access.</li>
  <li>Bring any homeowner or landlord restrictions into the conversation.</li>
</ul>
<h2>What You Should Leave With</h2>
<p>By the end of a useful site visit, you should understand the priority zones, the recommended first phase, and the tradeoffs between “good enough now” and “better later.”</p>
<p>The next step should feel practical and staged, not vague or rushed.</p>
$post_4$,
    'See what a home security site visit actually covers so your family can prepare, ask better questions, and move forward with confidence.',
    '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_site_visit" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>',
    'Need help deciding? [Book a Free Site Visit](https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_site_visit)',
    'published',
    timestamptz '2026-02-02T00:00:00Z',
    false,
    timestamptz '2026-02-02T00:00:00Z',
    timestamptz '2026-02-02T00:00:00Z'
  )
on conflict (slug) do update
set
  subject = excluded.subject,
  title = excluded.title,
  content = excluded.content,
  preview_text = excluded.preview_text,
  cta = excluded.cta,
  cta_markdown = excluded.cta_markdown,
  status = excluded.status,
  published_at = excluded.published_at,
  newsletter_enabled = excluded.newsletter_enabled,
  created_at = excluded.created_at,
  updated_at = now();
