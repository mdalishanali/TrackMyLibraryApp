import { Redirect } from 'expo-router';

/**
 * The single-screen setup was replaced by the three-step wizard. This route is
 * kept because released builds, deep links and persisted navigation state still
 * point at /onboarding/setup.
 */
export default function SetupRedirect() {
  return <Redirect href="/onboarding/sections" />;
}
