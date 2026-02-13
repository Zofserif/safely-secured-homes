-- Seed the initial 3 blog posts into public.blog_posts.
-- Safe to rerun: this script uses UPSERT by slug.

insert into public.blog_posts (
  slug,
  title,
  excerpt,
  published_at,
  content_markdown
)
values
  (
    'camera-placement-mistakes-families-make',
    'Who Carries the "What-Ifs" for Your Home Tonight?',
    'A personal story about nightly worries, peace of mind, and the first practical step families can take to feel safer at home.',
    date '2026-01-28',
    $$## The Weight of the What-Ifs

Thank you for trusting us with your home. While my team prepares your plan, I wanted to share a quick story.

My dad had a strict nightly routine. Before sleeping, he would check the gate, double-check every door, turn off the lights, and check the stove. We were always half-asleep by then, but he never missed a single night.

Sometimes, he would even sleep on the sofa just to be sure he would be the first to respond if something happened.

When I got older, as the oldest son, that responsibility fell onto me. I began to carry those same what-ifs every night.

## The Real Problem We Solve

It was then I truly understood my dad. He was not just afraid of burglars. He was afraid of the feeling of being unsafe in his own dream home.

That realization hit me hard. Because that is the problem we truly solve. It is not just about cameras and sensors. It is about turning off the what-ifs in your head, so you can finally turn off the lights and sleep.

Your home should be where your worries end, not where they begin.

## Your First Step to Peaceful Nights

While we build your custom solution, this free guide is your first key to quieting those worries. It is packed with the foundational secrets we share with all our clients.

Download your guide: The 5 Secrets to a Panatag Home.

This is not just a PDF. It is the first chapter in your family's story of deeper, safer sleep.

- Download and read your guide. It will get you thinking like a security pro.
- My team will email you soon with your personalized plan.
- Start your journey to becoming the client with a story that ends with "I finally sleep soundly."$$
  ),
  (
    'weekly-security-routine-15-minutes',
    'A 15-Minute Weekly Security Routine for Busy Families',
    'Security systems degrade silently. This short weekly routine keeps your cameras, alerts, and emergency readiness reliable without adding stress to your schedule.',
    date '2026-01-20',
    $$## Why Weekly Checks Beat Annual Panic

Most issues are small at first: a dirty lens, muted alert, or weak battery in a sensor. Weekly checks catch these early, so your system stays dependable when you need it.

You do not need a full audit. A short routine tied to an existing habit, like Sunday evening planning, is enough to maintain confidence.

- Assign one adult owner and one backup owner.
- Use a fixed 15-minute schedule each week.
- Track checks in a shared note so everyone sees status.

## The 15-Minute Checklist

Run the same sequence each week so the routine stays easy to remember. Keep it practical and avoid adding steps you cannot maintain.

- Minute 1-5: Confirm camera live view and playback.
- Minute 6-9: Trigger one alert and verify push notification.
- Minute 10-12: Check door/window sensors and battery levels.
- Minute 13-15: Review emergency contacts and response steps.

## Make It Stick for the Whole Household

Security should not depend on one person remembering everything. Create simple instructions that other family members can follow when you are away.

Even a short printed emergency guide near your router or control panel can reduce delays during stressful moments.

- Post your emergency contacts in two places.
- Store backup power and flashlight in a labeled location.
- Practice one response scenario every month.$$
  ),
  (
    'smart-lighting-rules-for-safer-nights',
    'Smart Lighting Rules That Make Homes Safer at Night',
    'Good lighting improves prevention and video quality. Learn where to place lights, what schedules to use, and how to avoid glare that weakens camera footage.',
    date '2026-01-12',
    $$## Lighting Is a Security Tool, Not Just Ambiance

Well-planned exterior lighting discourages unwanted activity and helps visitors move safely. It also improves identification quality in camera footage.

The best setup combines steady base lighting with motion-triggered boost in critical approach zones.

- Keep entry paths visible with low glare lighting.
- Use motion lights near gate, driveway, and side access.
- Avoid creating deep shadows near doors and windows.

## Scheduling Rules That Feel Natural

Strict on/off timers can make a home look predictable. Instead, build lighting rules that reflect real household patterns and seasonal sunset changes.

Smart scenes let you switch multiple fixtures at once when the family arrives home or when everyone goes to bed.

- Set sunset-based automation, not fixed time only.
- Add a gentle randomization window for selected lights.
- Create one-tap Night Mode that arms lights and cameras together.

## Protect Camera Visibility While Improving Comfort

A bright but poorly aimed light can wash out your video. Place fixtures so they illuminate faces and pathways without shining directly into camera lenses.

Review footage after lighting adjustments and tune intensity in small steps until details are clear.

- Use warm white or neutral white for clearer skin-tone detail.
- Position fixtures above and slightly behind approach paths.
- Re-check footage after rain, since reflections can change exposure.$$
  )
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  published_at = excluded.published_at,
  content_markdown = excluded.content_markdown,
  updated_at = now();
