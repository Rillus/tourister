import { z } from "zod/v4";

export const ParsedStopSchema = z.object({
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  notes: z.string().optional(),
});

export const ParsedItinerarySchema = z.object({
  title: z.string().min(1),
  stops: z.array(ParsedStopSchema).min(1),
});

export const GeocodedStopSchema = ParsedStopSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
});

export type ParsedStop = z.infer<typeof ParsedStopSchema>;
export type ParsedItinerary = z.infer<typeof ParsedItinerarySchema>;
export type GeocodedStop = z.infer<typeof GeocodedStopSchema>;
