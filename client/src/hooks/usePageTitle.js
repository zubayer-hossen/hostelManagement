import { useEffect } from 'react';
import { setMeta } from '../utils/seo.js';
import { useSettings } from '../context/SettingsContext.jsx';

/** Sets "<page> | <site title>" while the page is mounted. */
export function usePageTitle(title, meta) {
  const { settings } = useSettings();
  const site = settings.seo.siteTitle || settings.general.hostelName;
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${site}` : site;
    return () => { document.title = previous; };
  }, [title, site]);

  useEffect(() => {
    const description = meta?.description || settings.seo.metaDescription;
    const image = meta?.image || settings.seo.ogImageUrl;
    if (!description && !image) return undefined;
    return setMeta({ description, image, url: window.location.href, type: meta?.type });
  }, [meta?.description, meta?.image, meta?.type, settings.seo.metaDescription, settings.seo.ogImageUrl]);
}
