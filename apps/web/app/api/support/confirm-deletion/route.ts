import { PrismaClient } from "@prisma/client";

import { hasLiveSubscription, verifyDeletionToken } from "@/lib/support/guards";

export const runtime = "nodejs";

const prisma = new PrismaClient();

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head><body style="font-family:system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:0 16px"><h1 style="font-size:1.3rem">${escapeHtml(title)}</h1>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

// GET only shows a confirm button: mail scanners that prefetch links must
// never be able to delete an account.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const userId = verifyDeletionToken(token);
  if (!userId) {
    return page("Link invalid or expired", "<p>Reply to the support email to request a new one.</p>", 400);
  }
  return page(
    "Delete your account?",
    `<p>This permanently deletes your account, YouTube Music credentials, Last.fm connection and scrobble history. It cannot be undone.</p>
<form method="POST"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit" style="padding:10px 16px;background:#b91c1c;color:#fff;border:0;border-radius:6px;cursor:pointer">Yes, delete everything</button></form>`,
  );
}

export async function POST(request: Request) {
  const form = await request.formData();
  const userId = verifyDeletionToken(String(form.get("token") ?? ""));
  if (!userId) {
    return page("Link invalid or expired", "<p>Reply to the support email to request a new one.</p>", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return page("Already deleted", "<p>Your data has already been removed.</p>");
  }
  if (hasLiveSubscription(user)) {
    return page(
      "Cancel your subscription first",
      '<p>Your account has an active paid subscription. Cancel it at <a href="/pricing">/pricing</a> and then request deletion again.</p>',
      409,
    );
  }

  // Songs are removed by the onDelete: Cascade relation.
  await prisma.user.delete({ where: { id: userId } });
  return page("Account deleted", "<p>Your account and all associated data have been permanently deleted.</p>");
}
