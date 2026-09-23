export const isExternal = (href = '') => /^https?:\/\//i.test(href);

export function directionsUrl({ latitude, longitude }, address) {
  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number';
  const dest = hasCoords ? `${latitude},${longitude}` : address ? encodeURIComponent(address) : '';
  return dest ? `https://www.google.com/maps/dir/?api=1&destination=${dest}` : '';
}

export const telHref = (phone = '') => `tel:${phone.replace(/[^\d+]/g, '')}`;
