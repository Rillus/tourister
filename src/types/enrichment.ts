export interface EnrichedStop {
  name: string;
  nameLocal?: string;
  latitude: number;
  longitude: number;
  dateStart?: string;
  dateEnd?: string;
  notes?: string;
  enrichment?: {
    wikipediaSummary: string;
    wikipediaUrl: string;
    imageUrl?: string;
    imageAttribution?: string;
  };
}
