import * as StoreReview from 'expo-store-review';
import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';

const LAST_RATING_PROMPT_KEY = 'last_rating_prompt_date';
const MIN_DAYS_BETWEEN_PROMPTS = 30;

export const useQuickRating = () => {
  const [lastPromptDate, setLastPromptDate] = useMMKVString(LAST_RATING_PROMPT_KEY);

  const triggerRating = useCallback(async (force = false) => {
    try {
      if (!force) {
        const now = new Date();
        if (lastPromptDate) {
          const lastDate = new Date(lastPromptDate);
          const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays < MIN_DAYS_BETWEEN_PROMPTS) {
            return false;
          }
        }
      }

      const isAvailable = await StoreReview.isAvailableAsync();
      const hasAction = await StoreReview.hasAction();

      if (isAvailable && hasAction) {
        await StoreReview.requestReview();
        setLastPromptDate(new Date().toISOString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Rating] Failed to trigger rating:', error);
      return false;
    }
  }, [lastPromptDate, setLastPromptDate]);

  return { triggerRating };
};
