import { Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext.jsx';
import { directionsUrl } from '../utils/links.js';

/** Google Maps embed (URL set by the admin) + directions button. Renders nothing if no location is configured. */
export default function MapEmbed() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { mapEmbedUrl, nearbyLandmarks, transportInfo } = settings.location;
  const directions = directionsUrl(settings.location, settings.general.address);
  if (!mapEmbedUrl && !directions) return null;

  return (
    <div className="card !p-0 overflow-hidden">
      {mapEmbedUrl && (
        <iframe
          title={t('public.contact.mapTitle')}
          src={mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="h-72 w-full border-0 sm:h-96"
        />
      )}
      <div className="space-y-2 p-5 text-sm">
        {nearbyLandmarks && <p><strong>{t('public.contact.landmarks')}:</strong> {nearbyLandmarks}</p>}
        {transportInfo && <p><strong>{t('public.contact.transport')}:</strong> {transportInfo}</p>}
        {directions && (
          <a href={directions} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2">
            <Navigation size={16} /> {t('public.contact.directions')}
          </a>
        )}
      </div>
    </div>
  );
}
