import mongoose from 'mongoose';

const str = (max = 300) => ({ type: String, trim: true, maxlength: max, default: '' });

/** Singleton document (key = "main"). Everything the owner can change from the dashboard lives here. */
const siteSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', required: true },
    general: {
      _id: false,
      hostelName: { type: String, trim: true, maxlength: 120, default: 'Digital Hostel' },
      tagline: str(200),
      description: str(1000),
      logoUrl: str(500),
      faviconUrl: str(500),
      address: str(400),
    },
    contact: {
      _id: false,
      phone: str(30),
      email: str(254),
      emergencyPhone: str(30),
      officeHours: str(200),
      supportInfo: str(500),
    },
    social: {
      _id: false,
      facebook: str(300),
      instagram: str(300),
      youtube: str(300),
      whatsapp: str(300),
      messenger: str(300),
      tiktok: str(300),
      linkedin: str(300),
    },
    location: {
      _id: false,
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      mapEmbedUrl: str(1000),
      nearbyLandmarks: str(500),
      transportInfo: str(500),
    },
    emergency: {
      _id: false,
      police: str(30),
      ambulance: str(30),
      fire: str(30),
      hospital: str(120),
      hostelContact: str(60),
    },
    visitorStats: {
      _id: false,
      showOnlineNow: { type: Boolean, default: true },
      showToday: { type: Boolean, default: true },
      showTotal: { type: Boolean, default: true },
    },
    meetings: {
      _id: false,
      enabled: { type: Boolean, default: true },
      days: { type: [Number], default: [0, 1, 2, 3, 4] }, // 0 = Sunday
      startTime: { type: String, default: '10:00' },
      endTime: { type: String, default: '17:00' },
      slotMinutes: { type: Number, default: 30, min: 10, max: 240 },
      maxPerSlot: { type: Number, default: 1, min: 1, max: 10 },
      maxAdvanceDays: { type: Number, default: 30, min: 1, max: 180 },
      utcOffsetMinutes: { type: Number, default: 360, min: -720, max: 840 },
      blackoutDates: { type: [String], default: [] },
    },
    residentForm: {
      _id: false,
      requiredFields: { type: [String], default: ['dateOfBirth', 'emergencyContact', 'permanentAddress'] },
    },
    footer: {
      _id: false,
      showQuickLinks: { type: Boolean, default: true },
      copyrightText: str(200),
    },
    /** Public navbar. Order = array order. `path` must be a built page. */
    navigation: {
      type: [new mongoose.Schema({
        key: { type: String, required: true, maxlength: 30 },
        label: { type: String, required: true, maxlength: 40 },
        labelBn: { type: String, maxlength: 40, default: '' },
        path: { type: String, required: true, maxlength: 200 },
        enabled: { type: Boolean, default: true },
      }, { _id: false })],
      default: undefined,
    },
    /** Homepage sections. Order = array order. */
    homeSections: {
      type: [new mongoose.Schema({
        key: { type: String, enum: ['hero', 'headlines', 'facilities', 'notices', 'faq', 'contact'], required: true },
        enabled: { type: Boolean, default: true },
      }, { _id: false })],
      default: undefined,
    },
    theme: {
      _id: false,
      mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      primaryColor: { type: String, default: '#4f46e5' },
      secondaryColor: { type: String, default: '#0ea5e9' },
      accentColor: { type: String, default: '#f59e0b' },
      borderRadius: { type: String, enum: ['none', 'sm', 'md', 'lg', 'xl'], default: 'lg' },
      animations: { type: Boolean, default: true },
    },
    seo: {
      _id: false,
      siteTitle: str(120),
      metaDescription: str(300),
      keywords: str(300),
      ogImageUrl: str(500),
    },
  },
  { timestamps: true, minimize: false }
);

siteSettingSchema.index({ key: 1 }, { unique: true });

siteSettingSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
