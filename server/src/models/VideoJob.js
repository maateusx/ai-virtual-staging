import mongoose from 'mongoose';

const { Schema } = mongoose;

// Async image-to-video job. Unlike StagingJob (synchronous), a video job is
// created in `processing`, polled by a background poller, and updated to `done`
// or `error` once the provider finishes. There is no token usage for video —
// cost is duration × per-second rate.
const videoJobSchema = new Schema(
  {
    status: {
      type: String,
      enum: ['queued', 'processing', 'done', 'error'],
      required: true,
      index: true,
    },
    provider: { type: String, required: true }, // e.g. 'gemini'
    model: { type: String, required: true }, // e.g. 'veo-3.1-fast-generate-preview'
    motion: { type: String }, // camera-motion preset id (e.g. 'still', 'walk')
    prompt: { type: String, default: '' }, // final composed prompt sent to the model
    aspect_ratio: { type: String }, // '16:9' | '9:16'
    resolution: { type: String }, // '720p' | '1080p'
    duration_seconds: { type: Number },
    audio: { type: Boolean, default: false },

    input_image_url: { type: String, required: true },
    output_video_url: { type: String },

    // Durable provider operation handle, used to resume polling after a restart.
    // The live operation object and the BYOK key are in-memory only (not stored).
    operation_name: { type: String, index: true },

    processing_ms: { type: Number },

    // No token usage for video; cost is purely duration × per-second rate.
    cost: {
      type: {
        usd: Number,
        brl: Number,
        usd_to_brl: Number,
        price_per_second_usd: Number,
        duration_seconds: Number,
        resolution: String,
      },
      default: undefined,
      _id: false,
    },

    error: { type: String },
    started_at: { type: Date },
    finished_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const VideoJob = mongoose.model('VideoJob', videoJobSchema);
