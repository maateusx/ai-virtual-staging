// Background poll/download/persist orchestrator for video jobs.
//
// No queue infra: the route starts the provider operation, creates the job, and
// fires trackJob() WITHOUT awaiting it. A recursive setTimeout loop polls the
// provider until done/error/timeout, then downloads the MP4 and persists it.
//
// The BYOK key lives only in this closure for the lifetime of the poll — it is
// never written to the job document (matching the image flow's "never persisted").

import { pollVideo, downloadVideo } from './videoProvider.js';
import { estimateVideoCost } from './videoPricing.js';
import { saveBuffer, extForMime } from '../storage.js';
import { VideoJob } from '../../models/VideoJob.js';
import { env } from '../../config/env.js';

// jobId -> { cancel } for in-flight jobs (lets us stop a poll if needed).
const active = new Map();

async function failJob(jobId, message) {
  await VideoJob.findByIdAndUpdate(jobId, {
    status: 'error',
    error: message,
    finished_at: new Date(),
  }).catch(() => {});
}

/**
 * Begin tracking a started job. Fire-and-forget — do not await.
 * @param {Object} args
 * @param {string} args.jobId
 * @param {string} args.model
 * @param {Object} [args.operation]      live operation object (in-memory)
 * @param {string} args.operationName    durable handle (resume after restart)
 * @param {string} [args.apiKey]         BYOK key, held in-memory only
 * @param {Object} [args.logger]         request.log
 */
export function trackJob({ jobId, model, operation, operationName, apiKey, logger }) {
  const interval = env.video.pollIntervalMs;
  const deadline = Date.now() + env.video.timeoutMs;
  let stopped = false;
  let liveOperation = operation;
  active.set(jobId, { cancel: () => { stopped = true; } });

  const cleanup = () => active.delete(jobId);

  const tick = async () => {
    if (stopped) return cleanup();
    try {
      if (Date.now() > deadline) {
        await failJob(jobId, 'video generation timed out');
        return cleanup();
      }

      const { done, operation: op, errorMessage } = await pollVideo(model, {
        operationName,
        operation: liveOperation,
        apiKey,
      });
      liveOperation = op; // keep the latest handle in memory

      if (errorMessage) {
        await failJob(jobId, errorMessage);
        return cleanup();
      }
      if (!done) {
        setTimeout(tick, interval);
        return;
      }

      // Done → download + persist immediately (Google purges after ~2 days).
      const { buffer, mime } = await downloadVideo(model, { operation: op, apiKey });
      const saved = await saveBuffer(buffer, extForMime(mime), 'vid');

      const job = await VideoJob.findById(jobId);
      const cost = estimateVideoCost({
        model,
        resolution: job?.resolution,
        durationSeconds: job?.duration_seconds,
      });
      const startedAt = job?.started_at?.getTime() ?? Date.now();

      await VideoJob.findByIdAndUpdate(jobId, {
        status: 'done',
        output_video_url: saved.url,
        cost,
        finished_at: new Date(),
        processing_ms: Date.now() - startedAt,
      });
      cleanup();
    } catch (err) {
      logger?.error({ err: err.cause ?? err, jobId }, 'video poll failed');
      await failJob(jobId, 'video provider failed');
      cleanup();
    }
  };

  setTimeout(tick, interval);
}
