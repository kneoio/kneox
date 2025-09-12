// Shared file upload utilities
// Keep minimal, focused on progress simulation to reuse across components.

export interface ProgressState {
  isSimulationActive: boolean;
  hasSSEStarted: boolean;
  currentProgress: number;
}

// Constants align with current implementation in SoundFragmentForm
const SIMULATION_TARGET_PROGRESS = 70;
const SIMULATION_UPDATE_INTERVAL_MS = 200;
const SIMULATION_DURATION_MULTIPLIER = 2.5;

/**
 * Start a frontend upload progress simulation up to 70%.
 * Returns a function to stop the simulation.
 */
export function uploadProgress(
  state: ProgressState,
  estimatedDurationSeconds: number,
  onProgressUpdate: (progress: number) => void,
  onComplete: () => void
): () => void {
  let simulationActive = true;
  let simulationProgress = 0;
  const targetProgress = SIMULATION_TARGET_PROGRESS;
  const updateIntervalMs = SIMULATION_UPDATE_INTERVAL_MS;
  const adjustedDuration = estimatedDurationSeconds * SIMULATION_DURATION_MULTIPLIER;
  const totalUpdates = (adjustedDuration * 1000) / updateIntervalMs;
  const progressIncrement = targetProgress / totalUpdates;

  state.isSimulationActive = true;

  const updateProgress = () => {
    if (!simulationActive || state.hasSSEStarted) {
      simulationActive = false;
      state.isSimulationActive = false;
      onComplete();
      return;
    }

    simulationProgress = Math.min(simulationProgress + progressIncrement, targetProgress);
    state.currentProgress = simulationProgress;

    onProgressUpdate(simulationProgress);

    if (simulationProgress < targetProgress) {
      setTimeout(updateProgress, updateIntervalMs);
    } else {
      const waitForSSE = () => {
        if (!simulationActive || state.hasSSEStarted) {
          simulationActive = false;
          state.isSimulationActive = false;
          onComplete();
          return;
        }
        setTimeout(waitForSSE, 500);
      };
      setTimeout(waitForSSE, 500);
    }
  };

  setTimeout(updateProgress, 100);

  return () => {
    simulationActive = false;
    state.isSimulationActive = false;
  };
}

// Connects to an SSE stream for backend processing progress.
// Expects JSON with { percentage, status, metadata?, fileId?, id? }.
export function connectSSEProgress(
  state: ProgressState,
  sseUrl: string,
  callbacks: {
    onDisplayProgress: (progress: number) => void,
    onFinished: (final: { fileName?: string; fileId?: string; metadata?: any }) => void,
    onError?: (error?: any) => void,
    onRawData?: (data: any) => void,
  }
): EventSource {
  const es = new EventSource(sseUrl);
  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      callbacks.onRawData?.(data);

      if (!state.hasSSEStarted) {
        state.hasSSEStarted = true;
        if ((state.currentProgress || 0) < 70) {
          state.currentProgress = 70;
          callbacks.onDisplayProgress(70);
        }
      }

      const serverProgress = data.percentage || 0;
      const displayProgress = 70 + serverProgress * 0.3;
      state.currentProgress = displayProgress;
      callbacks.onDisplayProgress(displayProgress);

      if (data.status === 'finished') {
        state.currentProgress = 100;
        callbacks.onDisplayProgress(100);
        es.close();
        callbacks.onFinished({
          fileName: data.metadata?.fileName,
          fileId: data.fileId || data.id,
          metadata: data.metadata,
        });
      }
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = (error) => {
    es.close();
    callbacks.onError?.(error);
  };

  return es;
}
