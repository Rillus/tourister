import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const activityCategoryEnum = pgEnum("activity_category", [
  "food_and_drink",
  "culture_and_history",
  "nature_and_parks",
  "shopping",
  "nightlife",
  "experiences",
]);

export const itineraries = pgTable("itineraries", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  shareToken: text("share_token").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const days = pgTable("days", {
  id: uuid("id").defaultRandom().primaryKey(),
  itineraryId: uuid("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  dateStart: date("date_start").notNull(),
  dateEnd: date("date_end").notNull(),
  name: text("name"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stops = pgTable("stops", {
  id: uuid("id").defaultRandom().primaryKey(),
  itineraryId: uuid("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  dayId: uuid("day_id").references(() => days.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameLocal: text("name_local"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  dateStart: date("date_start"),
  dateEnd: date("date_end"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const enrichments = pgTable("enrichments", {
  id: uuid("id").defaultRandom().primaryKey(),
  stopId: uuid("stop_id")
    .references(() => stops.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  wikipediaSummary: text("wikipedia_summary"),
  wikipediaUrl: text("wikipedia_url"),
  imageUrl: text("image_url"),
  imageAttribution: text("image_attribution"),
  openingHours: text("opening_hours"),
  admissionFee: text("admission_fee"),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});

export const activitySuggestions = pgTable("activity_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  stopId: uuid("stop_id")
    .references(() => stops.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  nameLocal: text("name_local"),
  category: activityCategoryEnum("category").notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  distanceMetres: integer("distance_metres"),
  imageUrl: text("image_url"),
  relevanceScore: decimal("relevance_score", { precision: 4, scale: 2 }),
  seasonalTags: text("seasonal_tags").array(),
  dismissed: boolean("dismissed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations

export const itineraryRelations = relations(itineraries, ({ many }) => ({
  days: many(days),
  stops: many(stops),
}));

export const dayRelations = relations(days, ({ one, many }) => ({
  itinerary: one(itineraries, {
    fields: [days.itineraryId],
    references: [itineraries.id],
  }),
  stops: many(stops),
}));

export const stopRelations = relations(stops, ({ one, many }) => ({
  itinerary: one(itineraries, {
    fields: [stops.itineraryId],
    references: [itineraries.id],
  }),
  day: one(days, {
    fields: [stops.dayId],
    references: [days.id],
  }),
  enrichment: one(enrichments, {
    fields: [stops.id],
    references: [enrichments.stopId],
  }),
  activitySuggestions: many(activitySuggestions),
}));

export const enrichmentRelations = relations(enrichments, ({ one }) => ({
  stop: one(stops, {
    fields: [enrichments.stopId],
    references: [stops.id],
  }),
}));

export const activitySuggestionRelations = relations(
  activitySuggestions,
  ({ one }) => ({
    stop: one(stops, {
      fields: [activitySuggestions.stopId],
      references: [stops.id],
    }),
  })
);
