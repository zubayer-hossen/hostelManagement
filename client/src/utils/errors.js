/** Extracts a human-readable message from an Axios error / API envelope. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response) {
    const data = err.response.data;
    const first = data?.errors?.[0]?.message;
    return data?.message && data.message !== 'Validation failed' ? data.message : first || data?.message || fallback;
  }
  if (err?.request) return 'Cannot reach the server. Check your internet connection.';
  return err?.message || fallback;
}

export const getFieldErrors = (err) => err?.response?.data?.errors ?? [];
