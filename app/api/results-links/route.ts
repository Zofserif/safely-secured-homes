import { NextResponse } from "next/server";
import { parseShareableResultsPayload } from "../../lib/resultsShare";
import {
  createResultsLinkFromFormData,
  getResultsLinkByKey,
} from "../../lib/resultsLinksServer";

export const dynamic = "force-dynamic";

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const formData = parseShareableResultsPayload(body?.payload);
  if (!formData) {
    return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
  }

  const contactRaw =
    typeof body?.contact === "object" && body.contact !== null ? body.contact : {};
  try {
    const createdLink = await createResultsLinkFromFormData(formData, {
      name: normalizeText((contactRaw as { name?: unknown }).name),
      email: normalizeText((contactRaw as { email?: unknown }).email),
      mobile: normalizeText((contactRaw as { mobile?: unknown }).mobile),
      phone_number: normalizeText(
        (contactRaw as { phone_number?: unknown }).phone_number,
      ),
      phone: normalizeText((contactRaw as { phone?: unknown }).phone),
    });

    if (!createdLink) {
      return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
    }

    return NextResponse.json(
      { key: createdLink.key, expiresAt: createdLink.expiresAt },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Supabase not configured",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key")?.trim() ?? "";
  try {
    const lookup = await getResultsLinkByKey(key);

    if (lookup.status === "invalid_key") {
      return NextResponse.json(
        { error: "Invalid share link key" },
        { status: 400 },
      );
    }

    if (lookup.status === "missing") {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    if (lookup.status === "expired") {
      return NextResponse.json({ error: "Share link expired" }, { status: 410 });
    }

    if (lookup.status === "invalid_payload") {
      return NextResponse.json({ error: "Invalid share payload" }, { status: 500 });
    }

    return NextResponse.json(
      { formData: lookup.formData },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Supabase not configured",
      },
      { status: 500 },
    );
  }
}
