import { Platform } from 'react-native';
import * as Constants from 'expo-constants';

const DISCORD_WEBHOOK_URL = process.env.EXPO_PUBLIC_DISCORD_WEBHOOK_URL;

export const sendDiscordNotification = async (content: string, embed?: any) => {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Discord Webhook URL not configured');
    return;
  }

  try {
    const payload = {
      content,
      embeds: embed ? [embed] : [],
      username: 'Captain Hook App',
    };

    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
};

export const logErrorToDiscord = async (error: any, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : 'No stack trace';

  const embed = {
    title: '🚨 App Error Detected',
    color: 0xff0000,
    fields: [
      { name: 'Message', value: errorMessage.substring(0, 1024) },
      { name: 'Context', value: context || 'Unknown context' },
      { name: 'Platform', value: Platform.OS },
      { name: 'Stack Trace', value: `\`\`\`${errorStack?.substring(0, 1000)}\`\`\`` },
    ],
    timestamp: new Date().toISOString(),
  };

  return sendDiscordNotification(`An error occurred in the **TrackMyLibrary** ${Platform.OS} app!`, embed);
};
