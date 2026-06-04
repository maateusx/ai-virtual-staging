import mongoose from 'mongoose';

const { Schema } = mongoose;

// Optional history record of each staging request (spec §7).
const jobSchema = new Schema(
  {
    input_image_url: { type: String, required: true },
    // First output, kept for back-compat / quick reference.
    output_image_url: { type: String },
    // All generated variations (1..N) for this request.
    output_image_urls: { type: [String], default: undefined },
    // Painted mask for localized-edit (inpaint) requests.
    mask_image_url: { type: String },
    mode: { type: String, default: 'furnish' },
    selections: { type: Schema.Types.Mixed, default: {} },
    extra_prompt: { type: String, default: '' },
    composed_prompt: { type: String, default: '' },
    aspect_ratio: { type: String },
    aspect_fit: { type: String },
    image_size: { type: String },
    // Local watermark settings, when one was applied to the output.
    watermark: {
      type: {
        vertical: String,
        horizontal: String,
        size: Number,
        opacity: Number,
        color: String,
      },
      default: undefined,
      _id: false,
    },
    model: { type: String },
    processing_ms: { type: Number },
    // Aggregated Gemini token usage across all variations of this request.
    usage: {
      type: {
        prompt_tokens: Number,
        output_tokens: Number,
        total_tokens: Number,
      },
      default: undefined,
      _id: false,
    },
    // Estimated generation cost derived from token usage.
    cost: {
      type: {
        usd: Number,
        brl: Number,
        input_usd: Number,
        output_usd: Number,
        usd_to_brl: Number,
      },
      default: undefined,
      _id: false,
    },
    status: { type: String, enum: ['done', 'error'], required: true },
    error: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const StagingJob = mongoose.model('StagingJob', jobSchema);
