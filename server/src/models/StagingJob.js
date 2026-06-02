import mongoose from 'mongoose';

const { Schema } = mongoose;

// Optional history record of each staging request (spec §7).
const jobSchema = new Schema(
  {
    input_image_url: { type: String, required: true },
    output_image_url: { type: String },
    selections: { type: Schema.Types.Mixed, default: {} },
    extra_prompt: { type: String, default: '' },
    composed_prompt: { type: String, default: '' },
    model: { type: String },
    processing_ms: { type: Number },
    status: { type: String, enum: ['done', 'error'], required: true },
    error: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

export const StagingJob = mongoose.model('StagingJob', jobSchema);
