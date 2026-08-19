"use server";

import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";
import { siteConfig } from "@/config/site";
import { sendVerificationEmail } from "@/server/email";
import { normalizeEmail } from "@/lib/utils";

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 heures

function verifyIdentifier(email: string) {
  return `verify-email:${email}`;
}

export async function createAndSendVerificationEmail(email: string) {
  const normalized = normalizeEmail(email);
  const identifier = verifyIdentifier(normalized);

  // Invalidate any previously issued, still-valid verification link.
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const rawToken = generateRawToken();
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
    },
  });

  const verifyUrl = `${siteConfig.url}/verifier-email?email=${encodeURIComponent(normalized)}&token=${rawToken}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[dev] Email verification link for ${normalized}: ${verifyUrl}`);
  }

  await sendVerificationEmail({ to: normalized, verifyUrl });
}

type VerifyResult =
  | { success: true }
  | { success: false; error: string };

export async function verifyEmailToken(
  email: string,
  token: string
): Promise<VerifyResult> {
  if (!email || !token) {
    return { success: false, error: "Lien de vérification invalide." };
  }

  const normalized = normalizeEmail(email);
  const identifier = verifyIdentifier(normalized);
  const tokenHash = hashToken(token);

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: tokenHash } },
  });

  const invalidResult: VerifyResult = {
    success: false,
    error: "Ce lien de vérification est invalide ou a expiré.",
  };

  if (!record) {
    return invalidResult;
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: tokenHash } },
    });
    return invalidResult;
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    await prisma.verificationToken.deleteMany({ where: { identifier } });
    return invalidResult;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  // Single-use: consume this token and any other outstanding link for this email.
  await prisma.verificationToken.deleteMany({ where: { identifier } });

  return { success: true };
}
