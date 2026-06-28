import { Suggestion, SuggestionKind } from '../types';

export const suggestionMeta: Record<SuggestionKind, { label: string; emoji: string; color: string }> = {
  book: { label: 'Book', emoji: '📖', color: '#121212' },
  course: { label: 'Course', emoji: '🎓', color: '#121212' },
  video: { label: 'Video', emoji: '▶', color: '#121212' },
  article: { label: 'Article', emoji: '📰', color: '#121212' },
  practice: { label: 'Try this', emoji: '✺', color: '#121212' },
};

/** Turn a suggestion into a real, working search URL — we never trust the model
 *  to produce live links, so we route its query through a known search surface. */
export function searchUrl(s: Suggestion): string {
  const q = encodeURIComponent(s.query || s.title);
  switch (s.kind) {
    case 'video':
      return `https://www.youtube.com/results?search_query=${q}`;
    case 'book':
      return `https://www.google.com/search?tbm=bks&q=${q}`;
    case 'course':
      return `https://www.google.com/search?q=${q}+online+course`;
    case 'article':
    case 'practice':
    default:
      return `https://www.google.com/search?q=${q}`;
  }
}
