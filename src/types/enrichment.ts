export interface EnrichedStop {
  name: string;
  nameLocal?: string;
  latitude: number;
  longitude: number;
  dateStart?: string;
  dateEnd?: string;
  /** Clock time HH:mm within the day */
  startTime?: string;
  /** Optional end clock time HH:mm */
  endTime?: string;
  notes?: string;
  enrichment?: {
    wikipediaSummary: string;
    wikipediaUrl: string;
    imageUrl?: string;
    imageAttribution?: string;
  };
}
