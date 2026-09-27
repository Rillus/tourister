/** True when coords look like a real geocoded point (not the 0,0 unmapped placeholder). */
export function hasValidCoordinates(point: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  const { latitude: lat, longitude: lon } = point;
  if (lat == null || lon == null) return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  if (lat === 0 && lon === 0) return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  return true;
}
