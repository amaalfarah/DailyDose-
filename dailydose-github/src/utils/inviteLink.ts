// utils/inviteLink.ts
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import crypto from 'expo-crypto';

export const APP_SCHEME = 'dailydoseplus';

// Deep link config for React Navigation
export const linking = {
  prefixes: [
    Linking.createURL('/'),
    'dailydoseplus://',
    'https://dailydoseplus.app',
  ],
  config: {
    screens: {
      CaregiverSignup: 'invite/:token',
    },
  },
};

/**
 * Generate a caregiver invite token and shareable link.
 */
export function generateInviteToken(): string {
  // In production, generate server-side. For dev, use random string.
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function buildInviteLink(token: string): string {
  return `${APP_SCHEME}://invite/${token}`;
}

/**
 * Share the invite link via the native share sheet (SMS, email, AirDrop, etc.)
 */
export async function shareInviteLink(
  token: string,
  caregiverName: string
): Promise<void> {
  const link = buildInviteLink(token);
  const message =
    `Hi ${caregiverName}! You've been invited to help manage medications on DailyDose+.\n\nAccept your invite:\n${link}`;

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(link, {
      dialogTitle: `Invite ${caregiverName} to DailyDose+`,
      mimeType: 'text/plain',
    });
  } else {
    // Fallback: copy to clipboard
    await Linking.openURL(`mailto:?subject=DailyDose%2B+Invite&body=${encodeURIComponent(message)}`);
  }
}

/**
 * Parse a deep link URL and extract the invite token.
 */
export function parseInviteLink(url: string): string | null {
  try {
    const parsed = Linking.parse(url);
    return (parsed.queryParams?.token as string) ?? parsed.path?.split('/').pop() ?? null;
  } catch {
    return null;
  }
}
