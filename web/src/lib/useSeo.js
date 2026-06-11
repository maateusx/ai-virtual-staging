import { useEffect } from 'react';

// Lightweight per-route SEO for this client-rendered SPA. Updates the document
// title, meta description and canonical link on mount/route change. No external
// library — keeps the bundle lean. The static tags in index.html remain the
// source of truth for social/crawler scraping (those don't run JS); this just
// keeps in-app navigation titles correct for users and JS-rendering crawlers.

const SITE = 'decorar.ai';
const ORIGIN = 'https://decorar.ai';

function setMeta(name, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(path) {
  if (!path) return;
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', `${ORIGIN}${path}`);
}

/**
 * @param {{ title?: string, description?: string, path?: string }} opts
 * title is suffixed with " — decorar.ai" unless it already contains it.
 */
export function useSeo({ title, description, path } = {}) {
  useEffect(() => {
    if (title) {
      document.title = title.includes(SITE) ? title : `${title} — ${SITE}`;
    }
    setMeta('description', description);
    setCanonical(path);
  }, [title, description, path]);
}
