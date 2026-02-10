import { getSuccessStoriesPage } from "../../lib/successStories";
import SuccessStoriesClient from "./SuccessStoriesClient";

export default async function SuccessStoriesSection() {
  const { stories, hasMore } = await getSuccessStoriesPage({
    limit: 6,
    offset: 0,
  });

  return (
    <section className="mt-12 lg:mt-16">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
          Here are a few more success stories.
        </h2>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Real families who felt safer after following our plan.
        </p>
      </div>

      <SuccessStoriesClient
        initialStories={stories}
        initialHasMore={hasMore}
        pageSize={6}
      />
    </section>
  );
}
