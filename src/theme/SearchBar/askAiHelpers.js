// Small pieces of AskAiPanel's logic that don't touch the widget's DOM, kept
// here so they can be tested on their own.

// When Vertex can't produce a real summary it streams a fixed fallback into
// the same slot as a genuine answer: a short sentence, then "Here are some
// search results." The second sentence promises results this panel never
// shows. A real answer is much longer than the fallback, so a short text that
// contains the marker is the fallback; a long one that happens to contain it
// is still an answer (the marker is stripped, see stripFallbackMarker).
export const FALLBACK_MARKER = /\s*Here are some search results\.?/i;
const FALLBACK_MAX_TEXT_LENGTH = 160;

const plainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export function isFallbackAnswer(html) {
  return FALLBACK_MARKER.test(html) && plainText(html.replace(FALLBACK_MARKER, '')).length < FALLBACK_MAX_TEXT_LENGTH;
}

export const stripFallbackMarker = (html) => html.replace(FALLBACK_MARKER, '');

// The widget exposes no "finished streaming" signal, and the text arrives in
// bursts: a pause between two bursts looks like the end if you only compare
// two reads in a row. Treat the answer as finished only once it has stayed
// exactly the same for `stableMs`. A null snapshot (nothing yet, or the
// widget's loader is still showing) restarts the wait.
export function createSettleDetector(stableMs) {
  let last = null;
  let since = 0;
  return {
    observe(snapshot, now) {
      if (!snapshot) {
        last = null;
        return false;
      }
      if (snapshot !== last) {
        last = snapshot;
        since = now;
        return false;
      }
      return now - since >= stableMs;
    },
  };
}

// The reasons the panel gives up. They go to the data layer (see
// reportAskAi) so a jump in one of them shows up in analytics: for example
// `markup_changed` rising means Google changed the widget's internals.
export const FAILURE = {
  scriptFailed: 'script_failed', // the Google script didn't load (or timed out)
  widgetNotDefined: 'widget_not_defined', // loaded, but <gen-search-widget> was never defined
  widgetNotRendered: 'widget_not_rendered', // defined, but its search bar never appeared
  submitIgnored: 'submit_ignored', // the query never left the widget's pre-search state
  markupChanged: 'markup_changed', // a summary container exists but the text isn't where we look
  fallbackAnswer: 'fallback_answer', // Vertex answered with its "no summary" sentence
  noSummary: 'no_summary', // it worked, but there was nothing to show
};

// Picks the reason from what the poll saw by the time it gave up.
export function classifyStall({sawSummaryContainer, sawMarkdown, lastStillZeroState}) {
  if (sawSummaryContainer && !sawMarkdown) return FAILURE.markupChanged;
  if (lastStillZeroState && !sawSummaryContainer) return FAILURE.submitIgnored;
  return FAILURE.noSummary;
}

// Pushes an event to the GTM data layer (a no-op queue if GTM isn't there).
// Never includes the query: only the outcome, and the locale.
export function reportAskAi(event, details) {
  if (typeof window === 'undefined') return;
  (window.dataLayer = window.dataLayer || []).push({event, ...details});
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[AskAi] ${event}`, details);
  }
}
