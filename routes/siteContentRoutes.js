import express from "express";
import {
  getAboutContent,
  updateHeroImage, updateCtaImage,
  updateStoryImage,
  addAtelierImage, removeAtelierImage,
  addJourneyItem, updateJourneyItem, deleteJourneyItem,
  updateValue,
  updateTeamMember,
  uploadStoryImage,
} from "../controllers/siteContentController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// Public — About page reads this
router.get("/about", getAboutContent);

// Admin-protected writes
router.use(protect, adminOnly);

router.put("/about/hero",              uploadStoryImage, updateHeroImage);
router.put("/about/cta",               uploadStoryImage, updateCtaImage);
router.put("/about/story/:slot",       uploadStoryImage, updateStoryImage);

router.post("/about/atelier",          uploadStoryImage, addAtelierImage);
router.delete("/about/atelier/:publicId",                removeAtelierImage);

router.post("/about/journey",          uploadStoryImage, addJourneyItem);
router.put("/about/journey/:id",       uploadStoryImage, updateJourneyItem);
router.delete("/about/journey/:id",                      deleteJourneyItem);

router.put("/about/values/:index",     uploadStoryImage, updateValue);
router.put("/about/team/:index",       uploadStoryImage, updateTeamMember);

export default router;
