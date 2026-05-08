import mongoose from "mongoose";

// Stores all CMS-editable content sections for the About / Our Story page
const ImageSchema = new mongoose.Schema({
  public_id: { type: String, required: true },
  url:       { type: String, required: true },
  label:     { type: String, default: "" },
}, { _id: false });

const JourneyItemSchema = new mongoose.Schema({
  year:  { type: String, required: true },
  title: { type: String, required: true },
  text:  { type: String, required: true },
  image: { type: ImageSchema },
});

const SiteContentSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, unique: true }, // e.g. "about"

    // Hero background image
    heroImage: { type: ImageSchema },

    // Origin story grid (main, topRight, bottomRight)
    storyImages: {
      main:        { type: ImageSchema },
      topRight:    { type: ImageSchema },
      bottomRight: { type: ImageSchema },
    },

    // Atelier gallery strip (up to 6 images)
    atelierGallery: [ImageSchema],

    // Journey / milestones timeline
    journeyItems: [JourneyItemSchema],

    // Values section (up to 3 values with images)
    values: [
      {
        icon:  { type: String },
        title: { type: String },
        text:  { type: String },
        image: { type: ImageSchema },
      },
    ],

    // Team portraits
    team: [
      {
        name:  { type: String },
        title: { type: String },
        image: { type: ImageSchema },
      },
    ],

    // CTA background image
    ctaImage: { type: ImageSchema },
  },
  { timestamps: true }
);

export default mongoose.model("SiteContent", SiteContentSchema);
